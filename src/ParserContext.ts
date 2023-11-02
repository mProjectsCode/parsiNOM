import { arrayUnion, getIndex } from './Helpers';
import { ParseResult, ParsingPosition, STypeBase } from './HelperTypes';

export class ParserContext {
	readonly input: string;
	/**
	 * The current parsing position. This will be modified during parsing.
	 */
	position: ParsingPosition;

	constructor(input: string, position: ParsingPosition) {
		this.input = input;
		this.position = position;
	}

	/**
	 * Move to a certain position.
	 *
	 * @param position
	 */
	moveToPosition(position: ParsingPosition): ParserContext {
		this.position = position;
		return this;
	}

	/**
	 * Copies the context with a new position object, while preserving the position.
	 */
	copy(): ParserContext {
		return new ParserContext(this.input, {
			index: this.position.index,
			column: this.position.column,
			line: this.position.line,
		});
	}

	/**
	 * Returns a copy of the current position.
	 * Use this is you want to hold on to the position object.
	 */
	getPosition(): ParsingPosition {
		return {
			index: this.position.index,
			column: this.position.column,
			line: this.position.line,
		};
	}

	/**
	 * Checks if the parser it at or beyond the end of the input string.
	 */
	atEOF(): boolean {
		return this.position.index >= this.input.length;
	}

	/**
	 * Advances the parser to an index while counting lines.
	 *
	 * @param index
	 * @private
	 */
	private advanceTo(index: number): void {
		if (index < this.position.index) {
			throw new Error(`Can not advance backwards. Current pos ${this.position.index}. Advance target index ${index}.`);
		}
		if (index === this.position.index) {
			return;
		}

		for (let i = this.position.index; i < index; i++) {
			if (this.input[i] === '\n') {
				this.position.line += 1;
				this.position.column = 1;
			} else {
				this.position.column += 1;
			}
		}

		this.position.index = index;
	}

	/**
	 * Get a slice of the input from the current position to the end index.
	 *
	 * @param endIndex the index to slice to
	 */
	sliceTo(endIndex: number): string {
		return this.input.slice(this.position.index, endIndex);
	}

	/**
	 * Succeed at a specific offset from the current position.
	 *
	 * @param offset
	 * @param value
	 */
	succeedOffset<SType extends STypeBase>(offset: number, value: SType): ParseResult<SType> {
		return this.succeedAt(this.position.index + offset, value);
	}

	/**
	 * Fail at a specific offset from the current position.
	 *
	 * @param offset
	 * @param expected
	 */
	failOffset<SType extends STypeBase>(offset: number, expected: string | string[]): ParseResult<SType> {
		return this.failAt(this.position.index + offset, expected);
	}

	/**
	 * Succeed at the current position.
	 *
	 * @param value
	 */
	succeed<SType extends STypeBase>(value: SType): ParseResult<SType> {
		return this.succeedAt(this.position.index, value);
	}

	/**
	 * Fail at the current position.
	 *
	 * @param expected
	 */
	fail<SType extends STypeBase>(expected: string | string[]): ParseResult<SType> {
		return this.failAt(this.position.index, expected);
	}

	/**
	 * Succeed at a specific index.
	 * The index must be higher than the current position.
	 *
	 * @param index
	 * @param value
	 */
	succeedAt<SType extends STypeBase>(index: number, value: SType): ParseResult<SType> {
		this.advanceTo(index);

		return {
			success: true,
			value: value,
			furthest: undefined,
			expected: undefined,
		};
	}

	/**
	 * Fail at a specific index.
	 * The index must be higher than the current position.
	 *
	 * @param index
	 * @param expected
	 */
	failAt<SType extends STypeBase>(index: number, expected: string | string[]): ParseResult<SType> {
		this.advanceTo(index);

		return {
			success: false,
			value: undefined,
			furthest: this.position,
			expected: Array.isArray(expected) ? expected : [expected],
		};
	}

	/**
	 * Merge a new result (`b`) into an existing result (`b`).
	 *
	 * @param a
	 * @param b
	 */
	merge<ASType extends STypeBase, BSType extends STypeBase>(a: ParseResult<ASType> | undefined, b: ParseResult<BSType>): ParseResult<BSType> {
		if (a === undefined) {
			return b;
		}

		const aIndex = getIndex(a.furthest);
		const bIndex = getIndex(b.furthest);

		if (bIndex > aIndex) {
			return b;
		}

		const expected = bIndex === aIndex ? arrayUnion(a.expected, b.expected) : a.expected;

		b.furthest = a.furthest;
		b.expected = expected;
		return b;
	}
}

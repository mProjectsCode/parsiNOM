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

	moveToPosition(position: ParsingPosition): ParserContext {
		this.position = position;
		return this;
	}

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

	atEOF(): boolean {
		return this.position.index >= this.input.length;
	}

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

	sliceTo(endIndex: number): string {
		return this.input.slice(this.position.index, endIndex);
	}

	succeedOffset<SType extends STypeBase>(offset: number, value: SType): ParseResult<SType> {
		return this.succeedAt(this.position.index + offset, value);
	}

	failOffset<SType extends STypeBase>(offset: number, expected: string | string[]): ParseResult<SType> {
		return this.failAt(this.position.index + offset, expected);
	}

	succeed<SType extends STypeBase>(value: SType): ParseResult<SType> {
		return this.succeedAt(this.position.index, value);
	}

	fail<SType extends STypeBase>(expected: string | string[]): ParseResult<SType> {
		return this.failAt(this.position.index, expected);
	}

	succeedAt<SType extends STypeBase>(index: number, value: SType): ParseResult<SType> {
		this.advanceTo(index);

		return {
			success: true,
			value: value,
			furthest: undefined,
			expected: undefined,
		};
	}

	failAt<SType extends STypeBase>(index: number, expected: string | string[]): ParseResult<SType> {
		this.advanceTo(index);

		return {
			success: false,
			value: undefined,
			furthest: this.position,
			expected: Array.isArray(expected) ? expected : [expected],
		};
	}

	merge<ASType extends STypeBase, BSType extends STypeBase>(a: ParseResult<ASType> | undefined, b: ParseResult<BSType>): ParseResult<BSType> {
		if (a === undefined) {
			return b;
		}

		if (getIndex(b.furthest) > getIndex(a.furthest)) {
			return b;
		}

		const expected = getIndex(b.furthest) === getIndex(a.furthest) ? arrayUnion(a.expected, b.expected) : a.expected;

		b.furthest = a.furthest;
		b.expected = expected;
		return b;
	}
}

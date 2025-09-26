import { arrayUnion, getIndex } from './Helpers';
import type {InternalParseResult, ParseResult, ParsingPosition, STypeBase} from './HelperTypes';

interface LatestError {
	position: ParsingPosition;
	expected: string[];
}

/**
 * Holds the input string as well as the current parsing position.
 * Also provides methods for succeeding and failing a parse, as well as merging two parse results.
 */
export class ParserContext {
	readonly input: string;
	/**
	 * The current parsing position. This will be modified during parsing.
	 */
	position: ParsingPosition;

	latestError: LatestError | undefined;

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

	copyPosition(position: ParsingPosition): ParserContext {
		this.position = {
			index: position.index,
			column: position.column,
			line: position.line,
		};
		return this;
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
	 * @param index the index to advance to, this can't be smaller than the current position
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
	 * @param offset the offset from the current position, must be positive
	 * @param value
	 */
	succeedOffset<SType extends STypeBase>(offset: number, value: SType): InternalParseResult<SType> {
		return this.succeedAt(this.position.index + offset, value);
	}

	/**
	 * Fail at a specific offset from the current position.
	 *
	 * @param offset the offset from the current position, must be positive
	 * @param expected
	 */
	failOffset<SType extends STypeBase>(offset: number, expected: string | string[]): InternalParseResult<SType> {
		return this.failAt(this.position.index + offset, expected);
	}

	/**
	 * Succeed at the current position.
	 *
	 * @param value
	 */
	succeed<SType extends STypeBase>(value: SType): InternalParseResult<SType> {
		return this.succeedAt(this.position.index, value);
	}

	/**
	 * Fail at the current position.
	 *
	 * @param expected
	 */
	fail<SType extends STypeBase>(expected: string | string[]): InternalParseResult<SType> {
		return this.failAt(this.position.index, expected);
	}

	/**
	 * Succeed at a specific index.
	 * The index must be higher than the current position.
	 *
	 * @param index
	 * @param value
	 */
	succeedAt<SType extends STypeBase>(index: number, value: SType): InternalParseResult<SType> {
		this.advanceTo(index);

		return {
			success: true,
			value: value,
		};
	}

	/**
	 * Fail at a specific index.
	 * The index must be higher than the current position.
	 *
	 * @param index
	 * @param expected
	 */
	failAt<SType extends STypeBase>(index: number, expected: string | string[]): InternalParseResult<SType> {
		this.advanceTo(index);

		this.addError(Array.isArray(expected) ? expected : [expected]);

		return {
			success: false,
			value: undefined,
		};
	}

	// /**
	//  * Merge a new result (`b`) into an existing result (`b`).
	//  *
	//  * @param a
	//  * @param b
	//  */
	// merge<ASType extends STypeBase, BSType extends STypeBase>(a: ParseResult<ASType> | undefined, b: ParseResult<BSType>): ParseResult<BSType> {
	// 	if (a === undefined) {
	// 		return b;
	// 	}

	// 	const aIndex = getIndex(a.furthest);
	// 	const bIndex = getIndex(b.furthest);

	// 	if (bIndex > aIndex) {
	// 		return b;
	// 	}

	// 	const expected = bIndex === aIndex ? arrayUnion(a.expected, b.expected) : a.expected;

	// 	b.furthest = a.furthest;
	// 	b.expected = expected;
	// 	return b;
	// }

	addError(expected: string[]): void {
		if (this.latestError === undefined || getIndex(this.latestError.position) < this.position.index) {
			this.latestError = {
				position: this.getPosition(),
				expected: expected,
			};
		} else if (getIndex(this.latestError.position) === this.position.index) {
			this.latestError.expected = arrayUnion(this.latestError.expected, expected) ?? expected;
		}
	}

	getAndClearLatestError(): LatestError | undefined {
		const error = this.latestError;
		this.latestError = undefined;
		return error;
	}

	mergeLatestError(other: LatestError | undefined): void {
		if (other === undefined) {
			return;
		}

		if (this.latestError === undefined || getIndex(this.latestError.position) < getIndex(other.position)) {
			this.latestError = other;
		} else if (getIndex(this.latestError.position) === getIndex(other.position)) {
			this.latestError.expected = arrayUnion(this.latestError.expected, other.expected) ?? other.expected;
		}
	}
}

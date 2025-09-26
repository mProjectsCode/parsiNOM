import { arrayUnion } from './Helpers';
import type { InternalParseResult, STypeBase } from './HelperTypes';

interface LatestError {
	position: number;
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
	position: number;

	latestError: LatestError | undefined;

	constructor(input: string, position: number) {
		this.input = input;
		this.position = position;
	}

	/**
	 * Checks if the parser it at or beyond the end of the input string.
	 */
	atEOF(): boolean {
		return this.position >= this.input.length;
	}

	/**
	 * Advances the parser to an index while counting lines.
	 *
	 * @param index the index to advance to, this can't be smaller than the current position
	 * @private
	 */
	private advanceTo(index: number): void {
		this.position = index;
	}

	/**
	 * Get a slice of the input from the current position to the end index.
	 *
	 * @param endIndex the index to slice to
	 */
	sliceTo(endIndex: number): string {
		return this.input.slice(this.position, endIndex);
	}

	/**
	 * Succeed at a specific offset from the current position.
	 *
	 * @param offset the offset from the current position, must be positive
	 * @param value
	 */
	succeedOffset<SType extends STypeBase>(offset: number, value: SType): InternalParseResult<SType> {
		return this.succeedAt(this.position + offset, value);
	}

	/**
	 * Fail at a specific offset from the current position.
	 *
	 * @param offset the offset from the current position, must be positive
	 * @param expected
	 */
	failOffset<SType extends STypeBase>(offset: number, expected: string | string[]): InternalParseResult<SType> {
		return this.failAt(this.position + offset, expected);
	}

	/**
	 * Succeed at the current position.
	 *
	 * @param value
	 */
	succeed<SType extends STypeBase>(value: SType): InternalParseResult<SType> {
		return this.succeedAt(this.position, value);
	}

	/**
	 * Fail at the current position.
	 *
	 * @param expected
	 */
	fail<SType extends STypeBase>(expected: string | string[]): InternalParseResult<SType> {
		return this.failAt(this.position, expected);
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

	addError(expected: string[]): void {
		if (this.latestError === undefined || this.latestError.position < this.position) {
			this.latestError = {
				position: this.position,
				expected: expected,
			};
		} else if (this.latestError.position === this.position) {
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

		if (this.latestError === undefined || this.latestError.position < other.position) {
			this.latestError = other;
		} else if (this.latestError.position === other.position) {
			this.latestError.expected = arrayUnion(this.latestError.expected, other.expected) ?? other.expected;
		}
	}
}

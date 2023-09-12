import { arrayUnion } from './Helpers';
import { ParseResult, ParsingPosition, STypeBase } from './HelperTypes';

export class ParserContext {
	readonly input: string;
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

	atEOF(): boolean {
		return this.position.index >= this.input.length;
	}

	// OPTIMIZATION: only create a new position when needed, otherwise mutate
	private advanceTo(index: number): ParsingPosition {
		if (index < this.position.index) {
			throw new Error(`Can not advance backwards. Current pos ${this.position.index}. Advance target index ${index}.`);
		}
		if (index === this.position.index) {
			return this.position;
		}

		let line = this.position.line;
		let column = this.position.column;

		for (let i = this.position.index; i < index; i++) {
			if (this.input[i] === '\n') {
				line += 1;
				column = 1;
			} else {
				column += 1;
			}
		}

		this.position = {
			index: index,
			line: line,
			column: column,
		};

		return this.position;
	}

	private invalidPosition(): ParsingPosition {
		return {
			index: -1,
			line: -1,
			column: -1,
		};
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
		return {
			success: true,
			position: this.advanceTo(index),
			value: value,
			furthest: this.invalidPosition(),
			expected: [],
		};
	}

	failAt<SType extends STypeBase>(index: number, expected: string | string[]): ParseResult<SType> {
		return {
			success: false,
			position: this.invalidPosition(),
			value: null,
			furthest: this.advanceTo(index),
			expected: Array.isArray(expected) ? expected : [expected],
		};
	}

	merge<ASType extends STypeBase, BSType extends STypeBase>(a: ParseResult<ASType> | undefined, b: ParseResult<BSType>): ParseResult<BSType> {
		if (a === undefined) {
			return b;
		}

		if (b.furthest.index > a.furthest.index) {
			return b;
		}

		const expected: string[] = b.furthest.index === a.furthest.index ? arrayUnion(a.expected, b.expected) : a.expected;

		b.furthest = a.furthest;
		b.expected = expected;
		return b;
	}
}

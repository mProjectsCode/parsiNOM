import { arrayUnion, ParsingPosition } from './Helpers';
import { ParseResult, STypeBase } from './Parser';

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
	private move(index: number): ParsingPosition {
		if (index === this.position.index) {
			return this.position;
		}

		const endIndex = index;
		const inputChunk = this.sliceTo(endIndex);
		let endLine = this.position.line;
		let endColumn = this.position.column;

		for (const char of inputChunk) {
			if (char === '\n') {
				endLine += 1;
				endColumn = 1;
			} else {
				endColumn += 1;
			}
		}

		this.position = {
			index: endIndex,
			line: endLine,
			column: endColumn,
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
			position: this.move(index),
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
			furthest: this.move(index),
			expected: Array.isArray(expected) ? expected : [expected],
		};
	}

	succeedAtPosition<SType extends STypeBase>(position: ParsingPosition, value: SType): ParseResult<SType> {
		return {
			success: true,
			position: position,
			value: value,
			furthest: this.invalidPosition(),
			expected: [],
		};
	}

	failAtPosition<SType extends STypeBase>(position: ParsingPosition, expected: string | string[]): ParseResult<SType> {
		return {
			success: false,
			position: this.invalidPosition(),
			value: null,
			furthest: position,
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

		const expected = b.furthest.index === a.furthest.index ? arrayUnion(a.expected, b.expected) : a.expected;

		// this if does nothing other than to satisfy typescript
		if (b.success) {
			return {
				success: true,
				position: b.position,
				value: b.value,
				furthest: a.furthest,
				expected: expected,
			};
		} else {
			return {
				success: false,
				position: b.position,
				value: b.value,
				furthest: a.furthest,
				expected: expected,
			};
		}
	}
}

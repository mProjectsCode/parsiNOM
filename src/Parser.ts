import { arrayUnion, LanguageDef, LanguageRules, P, P_UTILS, ParsingMarker, ParsingNode, ParsingPosition } from './Helpers';

export type STypeBase = any;

export interface ParseSuccess<SType extends STypeBase> {
	success: true;
	position: ParsingPosition;
	value: SType;
	furthest: ParsingPosition;
	expected: string[];
}

export interface ParseFailure {
	success: false;
	position: ParsingPosition;
	value: unknown | undefined;
	furthest: ParsingPosition;
	expected: string[];
}

export type ParseFunction<SType extends STypeBase> = (context: ParserContext) => ParseResult<SType>;

export type ParseResult<SType extends STypeBase> = ParseSuccess<SType> | ParseFailure;

// export function parseSuccess<SType extends STypeBase>(index: number, value: SType): ParseSuccess<SType> {
// 	return {
// 		success: true,
// 		index: index,
// 		value: value,
// 		furthest: -1,
// 		expected: [],
// 	};
// }
//
// export function parseFailure(index: number, expected: string | string[]): ParseFailure {
// 	return {
// 		success: false,
// 		index: -1,
// 		value: undefined,
// 		furthest: index,
// 		expected: Array.isArray(expected) ? expected : [expected],
// 	};
// }

// export function mergeParseResults<SType extends STypeBase>(result: ParseResult<SType>, last: ParseResult<unknown> | undefined): ParseResult<SType> {
// 	if (!last) {
// 		return result;
// 	}
//
// 	if (result.furthest > last.furthest) {
// 		return result;
// 	}
//
// 	const expected = result.furthest === last.furthest ? arrayUnion(result.expected, last.expected) : last.expected;
//
// 	// this if does nothing other than to satisfy typescript
// 	if (result.success) {
// 		return {
// 			success: result.success,
// 			index: result.index,
// 			value: result.value,
// 			furthest: last.furthest,
// 			expected: expected,
// 		};
// 	} else {
// 		return {
// 			success: result.success,
// 			index: result.index,
// 			value: result.value,
// 			furthest: last.furthest,
// 			expected: expected,
// 		};
// 	}
// }

export class Parser<const SType extends STypeBase> {
	public p: ParseFunction<SType>;

	constructor(p: ParseFunction<SType>) {
		this.p = p;
	}

	parse(str: string): ParseResult<SType> {
		return this.p(new ParserContext(str, {index: 0, line: 1, column: 1}));
	}

	or<OtherSType extends STypeBase>(other: Parser<OtherSType>): Parser<SType | OtherSType> {
		return P.or(this as Parser<SType>, other);
	}

	trim(parser: Parser<unknown>): Parser<SType> {
		return this.wrap(parser, parser);
	}

	wrap(leftParser: Parser<unknown>, rightParser: Parser<unknown>): Parser<SType> {
		return P.sequenceMap(
			(_l, m: SType, _r) => {
				return m;
			},
			leftParser,
			this as Parser<SType>,
			rightParser
		);
	}

	then<OtherSType extends STypeBase>(next: Parser<OtherSType>): Parser<OtherSType> {
		return P.sequence(this as Parser<SType>, next).map<OtherSType>(results => results[1] as OtherSType);
	}

	many(): Parser<SType[]> {
		return new Parser<SType[]>((context): ParseResult<SType[]> => {
			let result = undefined;
			const startIndex = context.position.index;
			const value: SType[] = [];

			while (true) {
				const iterStartPosition = context.position;
				result = context.merge(result, this.p(context));
				if (result.success) {
					if (result.position.index === startIndex) {
						throw new Error('infinite loop in many() parser detected');
					}
					context.moveToPosition(result.position);
					value.push(result.value);
				} else {
					return context.succeedAtPosition(iterStartPosition, value);
				}
			}
		});
	}

	times(min: number, max: number): Parser<SType[]> {
		if (max < min) {
			throw new Error('error in times(min, max) parser. max may not be less than min');
		}

		return new Parser<SType[]>((context): ParseResult<SType[]> => {
			let result = undefined;
			let prevResult = undefined;
			const value: SType[] = [];
			let iteration = 0;

			for (; iteration < min; iteration++) {
				result = this.p(context);
				prevResult = context.merge(prevResult, result);
				if (result.success) {
					context.moveToPosition(result.position);
					value.push(result.value);
				} else {
					return prevResult as ParseFailure;
				}
			}

			for (; iteration < max; iteration++) {
				result = this.p(context);
				prevResult = context.merge(prevResult, result);
				if (result.success) {
					context.moveToPosition(result.position);
					value.push(result.value);
				} else {
					break;
				}
			}

			// first move the result to the context position and then change its value.
			return context.succeed(value);
		});
	}

	result<OtherSType extends STypeBase>(value: OtherSType): Parser<OtherSType> {
		return this.map(() => value);
	}

	atMost(max: number): Parser<SType[]> {
		return this.times(0, max);
	}

	atLeast(min: number): Parser<SType[]> {
		return P.sequenceMap(
			(part1, part2) => {
				return part1.concat(part2);
			},
			this.times(min, min),
			this.many()
		);
	}

	map<const OtherSType extends STypeBase>(fn: (value: SType) => OtherSType): Parser<OtherSType> {
		return new Parser((context) => {
			const result = this.p(context);
			if (!result.success) {
				return result;
			}
			// we are kind of changing the generic type of `ParseResult` here and TS does not like it.
			// return context.mutateResult(result, fn(result.value));

			return context.succeed(fn(result.value));
		});
	}

	skip<const OtherSType extends STypeBase>(next: Parser<OtherSType>): Parser<SType> {
		return P.sequence(this as Parser<SType>, next).map(value => value[0]);
	}

	mark(): Parser<ParsingMarker<SType>> {
		return P.sequenceMap(
			(start, value: SType, end) => {
				return {
					start: start,
					value: value,
					end: end,
				};
			},
			P.pos,
			this as Parser<SType>,
			P.pos
		);
	}

	node(name: string): Parser<ParsingNode<SType>> {
		return P.sequenceMap(
			(start, value: SType, end) => {
				return {
					name: name,
					start: start,
					value: value,
					end: end,
				};
			},
			P.pos,
			this as Parser<SType>,
			P.pos
		);
	}

	seperateBy(separator: Parser<unknown>): Parser<SType[]> {
		return P.separateBy(this, separator);
	}

	seperateByNotEmpty(separator: Parser<unknown>): Parser<SType[]> {
		return P.separateByNotEmpty(this, separator);
	}

	lookahead(x: Parser<SType>): Parser<SType>;
	lookahead(x: string): Parser<string>;
	lookahead(x: RegExp): Parser<string>;
	lookahead(x: Parser<SType> | string | RegExp): Parser<SType | string> {
		return this.skip(P_UTILS.lookahead(x));
	}

	notFollowedBy(next: Parser<unknown>): Parser<SType> {
		return this.skip(P.notFollowedBy(next));
	}

	describe(expected: string | string[]): Parser<SType> {
		if (!Array.isArray(expected)) {
			expected = [expected];
		}

		return new Parser<SType>((context) => {
			const result = this.p(context);
			if (!result.success) {
				result.expected = expected as string[];
			}
			return result;
		});
	}

	fallback<OtherSType extends STypeBase>(value: OtherSType): Parser<SType | OtherSType> {
		return this.or(P.alwaysSucceedParser(value));
	}

	chain<OtherSType extends STypeBase>(fn: (result: SType) => Parser<OtherSType>): Parser<OtherSType> {
		return new Parser<OtherSType>((context) => {
			const result: ParseResult<SType> = this.p(context);
			if (!result.success) {
				return result;
			}
			const nextParser: Parser<OtherSType> = fn(result.value);
			const nextResult = nextParser.p(context.moveToPosition(result.position))
			return context.merge(result, nextResult);
		});
	}
}

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
		})
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
			if (char === "\n") {
				endLine += 1;
				endColumn = 1;
			} else {
				endColumn += 1;
			}
		}

		// console.log({
		// 	current: this.position,
		// 	index: endIndex,
		// 	line: endLine,
		// 	column: endColumn,
		// })

		this.position = {
			index: endIndex,
			line: endLine,
			column: endColumn,
		}

		return this.position;
	}

	private invalidPosition(): ParsingPosition {
		return {
			index: -1,
			line: -1,
			column: -1,
		}
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
		}
	}

	failAt<SType extends STypeBase>(index: number, expected: string | string[]): ParseResult<SType> {
		return {
			success: false,
			position: this.invalidPosition(),
			value: null,
			furthest: this.move(index),
			expected: Array.isArray(expected) ? expected : [expected],
		}
	}

	succeedAtPosition<SType extends STypeBase>(position: ParsingPosition, value: SType): ParseResult<SType> {
		return {
			success: true,
			position: position,
			value: value,
			furthest: this.invalidPosition(),
			expected: [],
		}
	}

	failAtPosition<SType extends STypeBase>(position: ParsingPosition, expected: string | string[]): ParseResult<SType> {
		return {
			success: false,
			position: this.invalidPosition(),
			value: null,
			furthest: position,
			expected: Array.isArray(expected) ? expected : [expected],
		}
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

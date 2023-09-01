import { ParserContext } from './ParserContext';
import { ParseFailure, ParseFunction, ParseResult, ParsingMarker, ParsingNode, STypeBase } from './HelperTypes';
import { P } from './ParsiNOM';
import { P_UTILS } from './ParserUtils';

export class Parser<const SType extends STypeBase> {
	public p: ParseFunction<SType>;

	constructor(p: ParseFunction<SType>) {
		this.p = p;
	}

	parse(str: string): ParseResult<SType> {
		return this.p(new ParserContext(str, { index: 0, line: 1, column: 1 }));
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
			rightParser,
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

	// TODO: fix this like many. Maybe no fixing is necessary, further investigation needed
	repeat(min: number, max: number): Parser<SType[]> {
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
		return this.repeat(0, max);
	}

	atLeast(min: number): Parser<SType[]> {
		return P.sequenceMap(
			(part1, part2) => {
				return part1.concat(part2);
			},
			this.repeat(min, min),
			this.many(),
		);
	}

	map<const OtherSType extends STypeBase>(fn: (value: SType) => OtherSType): Parser<OtherSType> {
		return new Parser(context => {
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
			P.pos,
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
			P.pos,
		);
	}

	separateBy(separator: Parser<unknown>): Parser<SType[]> {
		return P.separateBy(this, separator);
	}

	separateByNotEmpty(separator: Parser<unknown>): Parser<SType[]> {
		return P.separateByNotEmpty(this, separator);
	}

	/**
	 * Functions like lookahead. Checks if this parser is followed by `next`, but does not advance the parsing position.
	 *
	 * @param next
	 */
	followedBy(next: Parser<SType>): Parser<SType>;
	followedBy(next: string): Parser<string>;
	followedBy(next: RegExp): Parser<string>;
	followedBy(next: Parser<SType> | string | RegExp): Parser<SType | string> {
		return this.skip(P_UTILS.lookahead(next));
	}

	/**
	 * Functions like inverse lookahead. Checks if this parser is **not** followed by `next`, but does not advance the parsing position.
	 *
	 * @param next
	 */
	notFollowedBy(next: Parser<unknown>): Parser<SType> {
		return this.skip(P.notFollowedBy(next));
	}

	describe(expected: string | string[]): Parser<SType> {
		if (!Array.isArray(expected)) {
			expected = [expected];
		}

		return new Parser<SType>(context => {
			const result = this.p(context);
			if (!result.success) {
				result.expected = expected as string[];
			}
			return result;
		});
	}

	/**
	 * Makes the parser optional. Provide an optional fallback value that will be yielded when the parser fails, otherwise the parser yields `undefined`, but it will never fail.
	 */
	optional(): Parser<SType | undefined>;
	optional<OtherSType extends STypeBase>(value: OtherSType): Parser<SType | OtherSType>;
	optional<OtherSType extends STypeBase>(value?: OtherSType): Parser<SType | OtherSType | undefined> {
		return this.or(P.alwaysSucceedParser(value));
	}

	/**
	 * Specify a function that returns a followup parser based on the result of this parser.
	 *
	 * @param fn
	 */
	chain<OtherSType extends STypeBase>(fn: (result: SType) => Parser<OtherSType>): Parser<OtherSType> {
		return new Parser<OtherSType>(context => {
			const result: ParseResult<SType> = this.p(context);
			if (!result.success) {
				return result;
			}
			const nextParser: Parser<OtherSType> = fn(result.value);
			const nextResult = nextParser.p(context.moveToPosition(result.position));
			return context.merge(result, nextResult);
		});
	}

	thenEof(): Parser<SType> {
		return new Parser<SType>(context => {
			const result: ParseResult<SType> = this.p(context);
			if (!result.success) {
				return result;
			}
			if (!context.atEOF()) {
				return context.fail('eof');
			}
			return result;
		});
	}
}

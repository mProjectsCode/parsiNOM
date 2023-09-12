import { ParserContext } from './ParserContext';
import { NamedParsingMarker, ParseFailure, ParseFunction, ParseResult, ParsingMarker, ParsingRange, STypeBase } from './HelperTypes';
import { P } from './ParsiNOM';
import { P_HELPERS, validateRange } from './Helpers';
import { P_UTILS } from './ParserUtils';

export class Parser<const SType extends STypeBase> {
	public p: ParseFunction<SType>;

	constructor(p: ParseFunction<SType>) {
		this.p = p;
	}

	/**
	 * Parses a string, returning a result object.
	 *
	 * @param str
	 */
	tryParse(str: string): ParseResult<SType> {
		return this.p(new ParserContext(str, { index: 0, line: 1, column: 1 }));
	}

	/**
	 * Parses a string, throwing a {@link ParsingError} on failure.
	 *
	 * @param str
	 */
	parse(str: string): SType {
		const result = this.tryParse(str);
		if (result.success) {
			return result.value;
		} else {
			throw P.createError(str, result as ParseFailure);
		}
	}

	/**
	 * Tries this parser first and then the second if this one fails.
	 *
	 * @param other
	 */
	or<OtherSType extends STypeBase>(other: Parser<OtherSType>): Parser<SType | OtherSType> {
		return P.or(this as Parser<SType>, other);
	}

	/**
	 * Wrap this parser with the same parser on both sides.
	 * `a.trim(b)` is the same as `a.wrap(b, b)`.
	 *
	 * @param parser
	 */
	trim(parser: Parser<unknown>): Parser<SType> {
		return this.wrap(parser, parser);
	}

	/**
	 * Wrap this parser with two parsers, one on each side.
	 * `b.wrap(a, c)` is the same as `a.then(b).skip(c)`.
	 *
	 * @param leftParser
	 * @param rightParser
	 */
	wrap(leftParser: Parser<unknown>, rightParser: Parser<unknown>): Parser<SType> {
		return P.sequenceMap(
			function _wrap(_l, m: SType, _r): SType {
				return m;
			},
			leftParser,
			this as Parser<SType>,
			rightParser,
		);
	}

	/**
	 * Follow this parser with another parser, but the value of the other parser is returned.
	 * Similar to {@link Parser.skip}.
	 *
	 * @param next
	 */
	then<OtherSType extends STypeBase>(next: Parser<OtherSType>): Parser<OtherSType> {
		return P.sequence(this as Parser<SType>, next).map<OtherSType>(results => results[1] as OtherSType);
	}

	/**
	 * Follow this parser with another parser, but the value of this parser is returned.
	 * Similar to {@link Parser.then}.
	 *
	 * @param next
	 */
	skip(next: Parser<unknown>): Parser<SType> {
		return P.sequence(this as Parser<SType>, next).map(value => value[0]);
	}

	/**
	 * Matches this parser as often as it can. Potentially zero or infinite times.
	 */
	many(): Parser<SType[]> {
		const _this = this;
		return new Parser<SType[]>(function _many(context): ParseResult<SType[]> {
			let result = undefined;
			const startIndex = context.position.index;
			const value: SType[] = [];

			while (true) {
				const contextCopy = context.copy();
				const newResult = _this.p(contextCopy);

				result = context.merge(result, newResult);

				if (result.success) {
					if (contextCopy.position.index === startIndex) {
						throw new Error('infinite loop in many() parser detected');
					}

					context.moveToPosition(contextCopy.position);
					value.push(result.value);
				} else {
					return context.merge(result, context.succeed(value));
				}
			}
		});
	}

	/**
	 * Match this parser at least `min` and at most `max` times.
	 * If you need only an upper or lower bound see {@link Parser.atLeast} or {@link Parser.atMost}.
	 *
	 * @param min
	 * @param max
	 */
	repeat(min: number, max: number): Parser<SType[]> {
		validateRange(min, max);
		const _this = this;

		return new Parser<SType[]>(function _repeat(context): ParseResult<SType[]> {
			let newResult = undefined;
			let result = undefined;
			const value: SType[] = [];
			let iteration = 0;

			for (; iteration < min; iteration++) {
				newResult = _this.p(context);

				result = context.merge(result, newResult);

				if (newResult.success) {
					value.push(newResult.value);
				} else {
					return result as ParseFailure;
				}
			}

			for (; iteration < max; iteration++) {
				const contextCopy = context.copy();
				newResult = _this.p(contextCopy);

				result = context.merge(result, newResult);

				if (newResult.success) {
					context.moveToPosition(contextCopy.position);
					value.push(newResult.value);
				} else {
					break;
				}
			}

			// first move the result to the context position and then change its value.
			return context.merge(result, context.succeed(value));
		});
	}

	/**
	 * Change the result of the parser.
	 *
	 * @example P.string('true').result(true)
	 *
	 * @param value
	 */
	result<OtherSType extends STypeBase>(value: OtherSType): Parser<OtherSType> {
		return this.map(() => value);
	}

	/**
	 * Match this parser at most `max` times.
	 *
	 * @param max
	 */
	atMost(max: number): Parser<SType[]> {
		return this.repeat(0, max);
	}

	/**
	 * Match this parser at least `min` times.
	 *
	 * @param min
	 */
	atLeast(min: number): Parser<SType[]> {
		return P.sequenceMap(
			(part1, part2) => {
				return part1.concat(part2);
			},
			this.repeat(min, min),
			this.many(),
		);
	}

	/**
	 * Allows for transformation of the return value after the parser has run.
	 *
	 * @param fn
	 */
	map<const OtherSType extends STypeBase>(fn: (value: SType) => OtherSType): Parser<OtherSType> {
		const _this = this;
		return new Parser(function _map(context): ParseResult<OtherSType> {
			const result = _this.p(context);
			if (!result.success) {
				return result as ParseFailure;
			}
			// we are kind of changing the generic type of `ParseResult` here and TS does not like it.
			// return context.mutateResult(result, fn(result.value));

			return context.merge(result, context.succeed(fn(result.value)));
		});
	}

	/**
	 * Wrap the return value if this parser in an object containing the before and after parsing position.
	 */
	marker(): Parser<ParsingMarker<SType>> {
		return P.sequenceMap(
			function _marker(from, value: SType, to): ParsingMarker<SType> {
				return {
					value: value,
					range: { from, to },
				};
			},
			P_UTILS.position(),
			this as Parser<SType>,
			P_UTILS.position(),
		);
	}

	/**
	 * Same as {@link Parser.marker} but allows for naming of the marker.
	 *
	 * @param name
	 */
	namedMarker(name: string): Parser<NamedParsingMarker<SType>> {
		return P.sequenceMap(
			function _namedMarker(from, value: SType, to): NamedParsingMarker<SType> {
				return {
					value: value,
					name: name,
					range: { from, to },
				};
			},
			P_UTILS.position(),
			this as Parser<SType>,
			P_UTILS.position(),
		);
	}

	/**
	 * Similar to {@link Parser.map}, but with additional access to a parsing range.
	 *
	 * @param fn
	 */
	node<NodeType>(fn: (value: SType, range: ParsingRange) => NodeType): Parser<NodeType> {
		return P.sequenceMap(
			function _node(from, value: SType, to): NodeType {
				return fn(value, { from, to });
			},
			P_UTILS.position(),
			this as Parser<SType>,
			P_UTILS.position(),
		);
	}

	/**
	 * Same as {@link Parser.separateByNotEmpty}, but it also accepts empty inputs.
	 *
	 * @param separator
	 */
	separateBy(separator: Parser<unknown>): Parser<SType[]> {
		return P.separateBy(this, separator);
	}

	/**
	 * Matches this parser multiple times, separated by some other parser, e.g. comma seperated values. Does not accept empty input.
	 *
	 * @param separator
	 */
	separateByNotEmpty(separator: Parser<unknown>): Parser<SType[]> {
		return P.separateByNotEmpty(this, separator);
	}

	/**
	 * Functions like lookahead. Checks if this parser is followed by `next`, but does not advance the parsing position.
	 * So it is similar to {@link Parser.skip} but it does not advance the parsing position.
	 *
	 * @param next
	 */
	followedBy(next: Parser<unknown>): Parser<SType> {
		return this.skip(P_HELPERS.followedBy(next));
	}

	/**
	 * Functions like inverse lookahead. Checks if this parser is **not** followed by `next`, but does not advance the parsing position.
	 * So it is more or less the inverse of {@link Parser.followedBy}.
	 *
	 * @param next
	 */
	notFollowedBy(next: Parser<unknown>): Parser<SType> {
		return this.skip(P_HELPERS.notFollowedBy(next));
	}

	/**
	 * Lets you provide a customized error message for when the parser fails.
	 *
	 * @param expected
	 */
	describe(expected: string | string[] = []): Parser<SType> {
		if (!Array.isArray(expected)) {
			expected = [expected];
		}
		const _this = this;

		return new Parser<SType>(function _describe(context) {
			const result = _this.p(context);
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
		return this.or(P.succeed(value));
	}

	/**
	 * Specify a function that returns a followup parser based on the result of this parser.
	 *
	 * @param fn
	 */
	chain<OtherSType extends STypeBase>(fn: (result: SType) => Parser<OtherSType>): Parser<OtherSType> {
		const _this = this;

		return new Parser<OtherSType>(function _chain(context): ParseResult<OtherSType> {
			const result: ParseResult<SType> = _this.p(context);
			if (!result.success) {
				return result as ParseFailure;
			}
			const nextParser: Parser<OtherSType> = fn(result.value);
			const nextResult = nextParser.p(context);
			return context.merge(result, nextResult);
		});
	}

	/**
	 * Makes this parser expect that it is at the end of the input after parsing.
	 */
	thenEof(): Parser<SType> {
		const _this = this;

		return new Parser<SType>(function _thenEof(context): ParseResult<SType> {
			const result: ParseResult<SType> = _this.p(context);
			if (!result.success) {
				return result;
			}
			if (!context.atEOF()) {
				return context.merge(result, context.fail('eof'));
			}
			return result;
		});
	}
}

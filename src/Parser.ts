import { P_HELPERS, validateRange } from './Helpers';
import type { NamedParsingMarker, ParseFunction, ParseResult, ParsingMarker, ParsingRange, STypeBase } from './HelperTypes';
import { ParserContext } from './ParserContext';
import { ParsingError } from './ParserError';
import { P_UTILS } from './ParserUtils';
import { P } from './ParsiNOM';

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
		const context = new ParserContext(str, 0);
		const result = this.p(context);
		if (result.success) {
			return result;
		} else {
			return {
				success: false,
				value: undefined,
				furthest: context.latestError!.position,
				expected: context.latestError!.expected,
			};
		}
	}

	/**
	 * Parses a string, throwing a {@link ParsingError} on failure.
	 *
	 * @param str
	 */
	parse(str: string): SType {
		const result: ParseResult<SType> = this.tryParse(str);
		if (result.success) {
			return result.value;
		} else {
			throw new ParsingError(str, result);
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
	 * Wrap this parser with the same string on both sides.
	 * `a.trimString(str)` is the same as `a.trim(P.string(str))` or `a.wrap(P.string(str), P.string(str))` or `a.wrapString(str, str)`.
	 *
	 * @param str
	 */
	trimString(str: string): Parser<SType> {
		return this.trim(P.string(str));
	}

	/**
	 * Wrap this parser with two parsers, one on each side.
	 * `parser.wrap(leftParser, rightParser)` is the same as `leftParser.then(parser).skip(rightParser)` or `P.sequenceMap((left, middle, right) => middle, leftParser, parser, rightParser)`.
	 *
	 * @param leftParser
	 * @param rightParser
	 */
	wrap(leftParser: Parser<unknown>, rightParser: Parser<unknown>): Parser<SType> {
		const _this = this;

		return new Parser<SType>(function _wrap(context) {
			const leftResult = leftParser.p(context);
			if (!leftResult.success) {
				return leftResult;
			}

			const thisResult = _this.p(context);
			if (!thisResult.success) {
				return thisResult;
			}

			const rightResult = rightParser.p(context);
			if (!rightResult.success) {
				return rightResult;
			}

			return thisResult;
		});
	}

	/**
	 * Wrap this parser with two strings, one on each side.
	 * `parser.wrapString(leftStr, rightStr)` is the same as `parser.wrap(P.string(leftStr), P.string(rightStr))`.
	 *
	 * @param leftStr
	 * @param rightStr
	 */
	wrapString(leftStr: string, rightStr: string): Parser<SType> {
		return this.wrap(P.string(leftStr), P.string(rightStr));
	}

	/**
	 * Follow this parser with another parser, but the value of the other parser is returned.
	 * Similar to {@link Parser.skip}.
	 *
	 * @param next
	 */
	then<OtherSType extends STypeBase>(next: Parser<OtherSType>): Parser<OtherSType> {
		const _this = this;

		return new Parser<OtherSType>(function _then(context) {
			const firstResult = _this.p(context);
			if (!firstResult.success) {
				return firstResult;
			}

			const secondResult = next.p(context);
			if (!secondResult.success) {
				return secondResult;
			}

			return secondResult;
		});
	}

	/**
	 * Follow this parser with another parser, but the value of this parser is returned.
	 * Similar to {@link Parser.then}.
	 *
	 * @param next
	 */
	skip(next: Parser<unknown>): Parser<SType> {
		const _this = this;

		return new Parser<SType>(function _skip(context) {
			const firstResult = _this.p(context);
			if (!firstResult.success) {
				return firstResult;
			}

			const secondResult = next.p(context);
			if (!secondResult.success) {
				return secondResult;
			}

			return firstResult;
		});
	}

	/**
	 * Follow this parser with another parser.
	 * If you chain more than two parser use {@link P.sequence}.
	 *
	 * @param next
	 */
	and<OtherSType extends STypeBase>(next: Parser<OtherSType>): Parser<[SType, OtherSType]> {
		return P.sequence(this as Parser<SType>, next);
	}

	/**
	 * Matches this parser as often as it can. Potentially zero or infinite times.
	 */
	many(): Parser<SType[]> {
		const _this = this;
		return new Parser<SType[]>(function _many(context): ParseResult<SType[]> {
			const value: SType[] = [];

			while (true) {
				const beforeIndex = context.position;
				const result = _this.p(context);

				if (result.success) {
					if (context.position === beforeIndex) {
						throw new Error('infinite loop in many() parser detected');
					}

					value.push(result.value);
				} else {
					context.position = beforeIndex;

					return {
						success: true,
						value: value,
					};
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

		return new Parser<SType[]>(function _repeat(context) {
			const value: SType[] = [];
			let count = 0;

			while (count < max) {
				const beforeIndex = context.position;
				const result = _this.p(context);

				if (result.success) {
					if (context.position === beforeIndex) {
						throw new Error('infinite loop in many() parser detected');
					}

					value.push(result.value);
					count++;
				} else {
					context.position = beforeIndex;

					if (count >= min) {
						return {
							success: true,
							value: value,
						};
					} else {
						return {
							success: false,
							value: undefined,
						};
					}
				}
			}

			return {
				success: true,
				value: value,
			};
		});
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
	 * Change the result of the parser.
	 *
	 * @example A parser that matches the string 'true' but yields the boolean value 'true'.
	 * P.string('true').result(true)
	 *
	 * @param value
	 */
	result<OtherSType extends STypeBase>(value: OtherSType): Parser<OtherSType> {
		return this.map(() => value);
	}

	/**
	 * Allows for transformation of the return value after the parser has run.
	 *
	 * @param fn
	 */
	map<OtherSType extends STypeBase>(fn: (value: SType) => OtherSType): Parser<OtherSType> {
		const _this = this;
		return new Parser(function _map(context) {
			// we use any here, because that allows us to change the value of the result later
			const result = _this.p(context);
			if (!result.success) {
				return result;
			}

			return {
				success: true,
				value: fn(result.value),
			};
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
	 * Overrides the error message of this parser when it fails.
	 *
	 * @param expected
	 */
	describe(expected: string | string[]): Parser<SType> {
		if (typeof expected === 'string') {
			expected = [expected];
		}

		const _this = this;

		return new Parser<SType>(function _describe(context) {
			const oldLatestError = context.getAndClearLatestError();

			const result = _this.p(context);

			if (context.latestError !== undefined) {
				context.latestError.expected = expected;
			}

			context.mergeLatestError(oldLatestError);

			return result;
		});
	}

	/**
	 * Aggregates the error messages of the parser and gives them an overarching description.
	 *
	 * a or b => (a or b as part of `expected`)
	 *
	 * @param expected
	 */
	box(expected: string): Parser<SType> {
		const _this = this;

		return new Parser<SType>(function _describe(context) {
			const oldLatestError = context.getAndClearLatestError();

			const result = _this.p(context);

			if (context.latestError !== undefined) {
				context.latestError.expected = [`(${context.latestError.expected.join(' or ')} as part of ${expected})`];
			}

			context.mergeLatestError(oldLatestError);

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

		return new Parser<OtherSType>(function _chain(context) {
			const result = _this.p(context);
			if (!result.success) {
				return result;
			}
			return fn(result.value).p(context);
		});
	}

	/**
	 * Makes this parser expect that it is at the end of the input after parsing.
	 */
	thenEof(): Parser<SType> {
		const _this = this;

		return new Parser<SType>(function _thenEof(context) {
			const result = _this.p(context);
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

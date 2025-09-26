import { P_HELPERS, validateRegexFlags } from './Helpers';
import type {
	DeParserArray,
	InternalParseResult,
	NomLanguage,
	NomLanguagePartial,
	NomLanguageRef,
	NomLanguageRules,
	ParseFunction,
	ParserRef,
	STypeBase,
	TupleToUnion,
} from './HelperTypes';
import { Parser } from './Parser';

export class P {
	// --- COMBINATORS ---

	/**
	 * Matches multiple parsers in a row, yielding an array of their results.
	 *
	 * @param parsers
	 */
	static sequence<ParserArr extends readonly Parser<unknown>[]>(...parsers: ParserArr): Parser<DeParserArray<ParserArr>> {
		if (parsers.length === 0) {
			throw new Error('sequence must have at least one parser argument');
		}

		return new Parser<DeParserArray<ParserArr>>(function _sequence(context): InternalParseResult<DeParserArray<ParserArr>> {
			const value: unknown[] = new Array(parsers.length);

			for (let i = 0; i < parsers.length; i++) {
				const p = parsers[i];

				const result = p.p(context);
				if (!result.success) {
					return result;
				}

				value[i] = result.value;
			}

			return {
				success: true,
				value: value as DeParserArray<ParserArr>,
			};
		});
	}

	/**
	 * Matches multiple parsers in a row, passing the result into `fn` and yielding the return value of `fn`.
	 *
	 * @param fn
	 * @param parsers
	 */
	static sequenceMap<OtherSType extends STypeBase, ParserArr extends readonly Parser<unknown>[]>(
		fn: (...value: DeParserArray<ParserArr>) => OtherSType,
		...parsers: ParserArr
	): Parser<OtherSType> {
		if (parsers.length === 0) {
			throw new Error('sequenceMap must have at least one parser argument');
		}

		return new Parser<OtherSType>(function _sequenceMap(context): InternalParseResult<OtherSType> {
			const value: unknown[] = new Array(parsers.length);

			for (let i = 0; i < parsers.length; i++) {
				const p = parsers[i];

				const result = p.p(context);
				if (!result.success) {
					return result;
				}

				value[i] = result.value;
			}

			return {
				success: true,
				value: fn(...(value as DeParserArray<ParserArr>)),
			};
		});
	}

	/**
	 * Utility for creating languages.
	 * Use `language` to refer to rules defined previously and `ref` to refer to rules that are defined later and the same rule.
	 * You can also use `ref` to refer to all other rules, but that will be slower.
	 *
	 * @param parsers
	 */
	static createLanguage<const RulesType extends object>(parsers: NomLanguageRules<RulesType>): NomLanguage<RulesType> {
		const language: NomLanguage<RulesType> = {} as NomLanguage<RulesType>;
		const languageProxy: NomLanguagePartial<RulesType> = {} as NomLanguagePartial<RulesType>;
		const languageRef: NomLanguageRef<RulesType> = {} as NomLanguageRef<RulesType>;

		for (const key in parsers) {
			languageRef[key] = P.reference(() => parsers[key](language, languageRef));
			// use getters on language proxy, so that we can throw errors when accessing later rules.
			Object.defineProperty(languageProxy, key, {
				get: () => {
					if (language[key] !== undefined) {
						return language[key];
					} else {
						throw new Error(`Can not access rule '${key}' in language. Rule is not yet defined. Try to access it via 'ref'.`);
					}
				},
			});
		}

		for (const key in parsers) {
			language[key] = parsers[key](languageProxy, languageRef);
		}

		return language;
	}

	/**
	 * Takes in a list of parsers and tries them in order until one succeeds, then returns that parsers result.
	 *
	 * @param parsers
	 */
	static or<ParserArr extends readonly Parser<unknown>[]>(...parsers: ParserArr): Parser<TupleToUnion<DeParserArray<ParserArr>>> {
		if (parsers.length === 0) {
			throw new Error('or must have at least one alternative');
		}

		return new Parser<TupleToUnion<DeParserArray<ParserArr>>>(function _or(context): InternalParseResult<TupleToUnion<DeParserArray<ParserArr>>> {
			const startPosition = context.position;

			for (const parser of parsers) {
				const p = parser as Parser<TupleToUnion<DeParserArray<ParserArr>>>;

				context.position = startPosition;
				const result = p.p(context);

				if (result.success) {
					return result;
				}
			}

			return {
				success: false,
				value: undefined,
			};
		});
	}

	/**
	 * Same as {@link P.separateByNotEmpty}, but it also accepts empty inputs.
	 *
	 * @param parser
	 * @param separator
	 */
	static separateBy<SType extends STypeBase>(parser: Parser<SType>, separator: Parser<unknown>): Parser<SType[]> {
		return this.separateByNotEmpty(parser, separator).or(P.succeed([]));
	}

	/**
	 * Matches a separated list, so e.g. comma separated values. Yields the values as an array. Does not accept empty input.
	 *
	 * @param parser
	 * @param separator
	 */
	static separateByNotEmpty<SType extends STypeBase>(parser: Parser<SType>, separator: Parser<unknown>): Parser<SType[]> {
		return this.sequenceMap(
			function _separateBy(part1, part2): SType[] {
				// console.log('sep', [part1, ...part2]);
				part2.unshift(part1);
				return part2;
			},
			parser,
			separator.then(parser).many(),
		);
	}

	// --- CONSTRUCTORS ---

	/**
	 * Matches a string. Yields the string.
	 *
	 * @param str
	 */
	static string(str: string): Parser<string> {
		const expected = "'" + str + "'";

		return new Parser<string>(function _string(context): InternalParseResult<string> {
			for (let i = 0; i < str.length; i++) {
				if (context.input[context.position + i] !== str[i]) {
					return context.fail(expected);
				}
			}

			return context.succeedOffset(str.length, str);
		});
	}

	/**
	 * Matches a regexp. Yields the matched string or the content of a specified capture group.
	 *
	 * @param regexp
	 * @param group
	 */
	static regexp(regexp: RegExp, group?: number): Parser<string> {
		validateRegexFlags(regexp.flags);

		const expected = regexp.source;

		if (group !== undefined) {
			return new Parser<string>(function _regexp(context): InternalParseResult<string> {
				const subInput = context.input.slice(context.position);
				const match = regexp.exec(subInput);

				if (match !== null) {
					const captureGroup = group ?? 0;

					if (captureGroup >= 0 && captureGroup <= match.length) {
						const fullMatch = match[0];
						const groupMatch = match[captureGroup];
						// console.log('regexp', expected, fullMatch, context);
						return context.succeedOffset(fullMatch.length, groupMatch);
					}

					const message = 'expected valid match group (0 to ' + match.length + ') in ' + expected;
					return context.fail(message);
				} else {
					return context.fail(expected);
				}
			});
		} else {
			return new Parser<string>(function _regexp(context): InternalParseResult<string> {
				const subInput = context.input.slice(context.position);
				const match = regexp.exec(subInput);

				if (match !== null) {
					const fullMatch = match[0];
					return context.succeedOffset(fullMatch.length, fullMatch);
				} else {
					return context.fail(expected);
				}
			});
		}
	}

	/**
	 * Parser that always succeeds and yields the value passed in as the argument. Consumes no input.
	 *
	 * @param value
	 */
	static succeed<SType extends STypeBase>(value: SType): Parser<SType> {
		return new Parser<SType>(function _succeed(context): InternalParseResult<SType> {
			return context.succeed(value);
		});
	}

	/**
	 * Parser that always fails and expects the value provided. Consumes no input.
	 *
	 * @param expected
	 */
	static fail<SType extends STypeBase>(expected: string): Parser<SType> {
		return new Parser<SType>(function _fail(context): InternalParseResult<SType> {
			return context.fail(expected);
		});
	}

	/**
	 * Returns a parser that yields the next character if it is included in `str`.
	 * If you want to match multiple characters in a row consider using {@link P.manyOf}.
	 *
	 * @param str
	 */
	static oneOf(str: string): Parser<string> {
		return P_HELPERS.test(function _oneOf(char: string): boolean {
			return str.includes(char);
		}, `one character of '${str}'`);
	}

	/**
	 * Returns a parser that yields the next character if it is **not** included in `str`.
	 * If you want to match multiple characters in a row consider using {@link P.manyNotOf}.
	 *
	 * @param str
	 */
	static noneOf(str: string): Parser<string> {
		return P_HELPERS.test(function _noneOf(char: string): boolean {
			return !str.includes(char);
		}, `no character of '${str}'`);
	}

	/**
	 * Returns a parser that checks every string in `strings` and yields the first matching string.
	 *
	 * @param strings
	 */
	static oneStringOf(strings: readonly string[]): Parser<string> {
		return this.or(...strings.map(x => this.string(x))).describe(strings.map(x => `'${x}'`).join(' or '));
	}

	/**
	 * Returns a parser that matches as many characters as it can, as long as they are included in `str`.
	 * `P.manyOf('ab')` is the same and more performant as `P.oneOf('ab').many().map(x => x.join(''))`.
	 *
	 * @param str
	 */
	static manyOf(str: string): Parser<string> {
		return new Parser<string>(function _manyOf(context): InternalParseResult<string> {
			let i = context.position;
			for (; i < context.input.length; i++) {
				if (!str.includes(context.input[i])) {
					break;
				}
			}
			return context.succeedAt(i, context.sliceTo(i));
		});
	}

	/**
	 * Returns a parser that matches anything until a character included in `str` is encountered.
	 * `P.manyNotOf('ab')` is the same and more performant as `P.noneOf('ab').many().map(x => x.join(''))`.
	 *
	 * @example A simple string without escape characters.
	 * P.manyNotOf('"').trim(P.string('"'))
	 *
	 * @param str
	 */
	static manyNotOf(str: string): Parser<string> {
		return new Parser<string>(function _manyOf(context): InternalParseResult<string> {
			let i = context.position;
			for (; i < context.input.length; i++) {
				if (str.includes(context.input[i])) {
					break;
				}
			}
			return context.succeedAt(i, context.sliceTo(i));
		});
	}

	/**
	 * Create a custom parser from a parsing function.
	 *
	 * @param parsingFunction
	 */
	static custom<SType extends STypeBase>(parsingFunction: ParseFunction<SType>): Parser<SType> {
		return new Parser(parsingFunction);
	}

	/**
	 * Returns a parser that matches and yields a character, which char code is between the char codes of `begin` and `end`.
	 *
	 * @param begin
	 * @param end
	 */
	static range(begin: string, end: string): Parser<string> {
		const beginCharCode = begin.charCodeAt(0);
		const endCharCode = end.charCodeAt(0);
		return P_HELPERS.testCharCode(function _range(charCode): boolean {
			return beginCharCode <= charCode && charCode <= endCharCode;
		}, `${begin}-${end}`);
	}

	/**
	 * Returns a parser that matched until `fn` returns false. Then yields all matched characters as a string.
	 *
	 * @param fn
	 */
	static takeWhile(fn: (char: string) => boolean): Parser<string> {
		return new Parser(function _takeWhile(context): InternalParseResult<string> {
			let endIndex = context.position;
			while (endIndex < context.input.length && fn(context.input[endIndex])) {
				endIndex++;
			}
			return context.succeedAt(endIndex, context.input.slice(context.position, endIndex));
		});
	}

	/**
	 * Wraps a parser, allowing for recursion. `fn` is only called when the parser is in use.
	 * Recursion can easily lead to infinite loops.
	 *
	 * @param fn
	 */
	static reference<SType extends STypeBase>(fn: () => Parser<SType>): ParserRef<SType> {
		return new Parser<SType>(function _reference(context): InternalParseResult<SType> {
			return fn().p(context);
		});
	}
}

import {
	DeParserArray,
	NomLanguage,
	NomLanguagePartial,
	NomLanguageRef,
	NomLanguageRules,
	ParseFailure,
	ParseFunction,
	ParseResult,
	ParserRef,
	ParsingPosition,
	STypeBase,
	TupleToUnion,
} from './HelperTypes';
import { Parser } from './Parser';
import { ParsingError } from './ParserError';
import { P_HELPERS } from './Helpers';

export class ParsiNOM {
	// --- OTHER ---
	createError(str: string, parseFailure: ParseFailure): ParsingError {
		return new ParsingError(str, parseFailure);
	}

	// --- COMBINATORS ---

	/**
	 * Matches multiple parsers in a row, yielding an array of their results.
	 *
	 * @param parsers
	 */
	sequence<const SType extends STypeBase, ParserArr extends readonly Parser<SType>[]>(...parsers: ParserArr): Parser<DeParserArray<ParserArr>> {
		return new Parser<DeParserArray<ParserArr>>((context): ParseResult<DeParserArray<ParserArr>> => {
			let result = undefined;
			const value: SType[] = new Array(parsers.length);

			for (let i = 0; i < parsers.length; i++) {
				const p = parsers[i];

				const newResult = p.p(context);
				result = context.merge(result, newResult);

				if (!result.success) {
					// console.log('sequence failed', result);
					return result;
				}

				value[i] = result.value;
				context.moveToPosition(result.position);
			}

			// console.log('sequence', value);

			return context.merge(result, context.succeed(value as DeParserArray<ParserArr>));
		});
	}

	/**
	 * Matches multiple parsers in a row, passing the result into `fn` and yielding the return value of `fn`.
	 *
	 * @param fn
	 * @param parsers
	 */
	sequenceMap<const SType extends STypeBase, OtherSType extends STypeBase, ParserArr extends Parser<SType>[]>(
		fn: (...value: DeParserArray<ParserArr>) => OtherSType,
		...parsers: ParserArr
	): Parser<OtherSType> {
		return this.sequence(...parsers).map<OtherSType>(function (results) {
			const res = fn(...results);
			// console.log('seq map', res);
			return res;
		});
	}

	/**
	 * Utility for creating languages.
	 * Use `language` to refer to rules defined previously and `ref` to refer to rules that are defined later and the same rule.
	 * You can also use `ref` to refer to all other rules, but that will be slower.
	 *
	 * @param parsers
	 */
	createLanguage<const RulesType extends object>(parsers: NomLanguageRules<RulesType>): NomLanguage<RulesType> {
		const language: NomLanguagePartial<RulesType> = {} as NomLanguagePartial<RulesType>;
		const languageRef: NomLanguageRef<RulesType> = {} as NomLanguageRef<RulesType>;

		for (const key in parsers) {
			languageRef[key] = P.reference(() => parsers[key](language, languageRef));
		}

		for (const key in parsers) {
			language[key] = parsers[key](language, languageRef);
		}

		return language as NomLanguage<RulesType>;
	}

	/**
	 * Takes in a list of parsers and tries them in order until one succeeds, then returns that parsers result.
	 *
	 * @param parsers
	 */
	or<const ParserArr extends readonly Parser<unknown>[]>(...parsers: ParserArr): Parser<TupleToUnion<DeParserArray<ParserArr>>> {
		if (parsers.length === 0) {
			P.fail('or must have at least one alternative');
		}

		return new Parser<TupleToUnion<DeParserArray<ParserArr>>>((context): ParseResult<TupleToUnion<DeParserArray<ParserArr>>> => {
			let result = undefined;

			for (let i = 0; i < parsers.length; i++) {
				const p = parsers[i] as Parser<TupleToUnion<DeParserArray<ParserArr>>>;

				const newResult = p.p(context.copy());

				result = context.merge(result, newResult);
				if (result.success) {
					return result;
				}
			}

			return result as ParseResult<TupleToUnion<DeParserArray<ParserArr>>>;
		});
	}

	/**
	 * Same as {@link P.separateByNotEmpty}, but it also accepts empty inputs.
	 *
	 * @param parser
	 * @param separator
	 */
	separateBy<SType extends STypeBase>(parser: Parser<SType>, separator: Parser<unknown>): Parser<SType[]> {
		return this.separateByNotEmpty(parser, separator).or(P.succeed([]));
	}

	/**
	 * Matches a separated list, so e.g. comma seperated values. Yields the values as an array. Does not accept empty input.
	 *
	 * @param parser
	 * @param separator
	 */
	separateByNotEmpty<SType extends STypeBase>(parser: Parser<SType>, separator: Parser<unknown>): Parser<SType[]> {
		return this.sequenceMap(
			(part1, part2) => {
				// console.log('sep', [part1, ...part2]);
				return [part1, ...part2];
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
	string(str: string): Parser<string> {
		const expected = "'" + str + "'";

		return new Parser<string>(context => {
			const endIndex = context.position.index + str.length;
			const subInput = context.sliceTo(endIndex);
			// console.log('str', str, subInput, context, endIndex);

			if (subInput === str) {
				return context.succeedAt(endIndex, subInput);
			} else {
				return context.fail(expected);
			}
		});
	}

	/**
	 * Matches a regexp. Yields the matched string or the content of a specified capture group.
	 *
	 * @param regexp
	 * @param group
	 */
	regexp(regexp: RegExp, group?: number | undefined): Parser<string> {
		const expected = regexp.source;

		return new Parser<string>(context => {
			const subInput = context.input.slice(context.position.index);
			const match = regexp.exec(subInput);

			if (match) {
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
	}

	/**
	 * Parser that always succeeds and yields the value passed in as the argument. Consumes no input.
	 *
	 * @param value
	 */
	succeed<SType extends STypeBase>(value: SType): Parser<SType> {
		return new Parser<SType>(context => {
			return context.succeed(value);
		});
	}

	/**
	 * Parser that always fails and expects the value provided. Consumes no input.
	 *
	 * @param expected
	 */
	fail<SType extends STypeBase>(expected: string): Parser<SType> {
		return new Parser<SType>(context => {
			return context.fail(expected);
		});
	}

	/**
	 * Returns a parser that yields the next character if it is included in `str`.
	 *
	 * @param str
	 */
	oneOf(str: string): Parser<string> {
		return P_HELPERS.test((char: string) => {
			return str.includes(char);
		}).describe(`one character of '${str}'`);
	}

	/**
	 * Returns a parser that checks every string in `strings` and yields the first matching string.
	 *
	 * @param strings
	 */
	oneStringOf(strings: readonly string[]): Parser<string> {
		return this.or(...strings.map(x => this.string(x))).describe(strings.map(x => `'${x}'`).join(' or '));
	}

	/**
	 * Returns a parser that yields the next character if it is **not** included in `str`.
	 *
	 * @param str
	 */
	noneOf(str: string): Parser<string> {
		return P_HELPERS.test(function (char: string) {
			return !str.includes(char);
		}).describe(`no character of '${str}'`);
	}

	/**
	 * Create a custom parser from a parsing function.
	 *
	 * @param parsingFunction
	 */
	custom<SType extends STypeBase>(parsingFunction: ParseFunction<SType>): Parser<SType> {
		return new Parser(parsingFunction);
	}

	/**
	 * Returns a parser that matches and yields a character, which char code is between the char codes of `begin` and `end`.
	 *
	 * @param begin
	 * @param end
	 */
	range(begin: string, end: string): Parser<string> {
		const beginCharCode = begin.charCodeAt(0);
		const endCharCode = end.charCodeAt(0);
		return P_HELPERS.test(char => {
			const charCode = char.charCodeAt(0);
			return beginCharCode <= charCode && charCode <= endCharCode;
		}).describe(`${begin}-${end}`);
	}

	/**
	 * Returns a parser that matched until `fn` returns false. Then yields all matched characters as a string.
	 *
	 * @param fn
	 */
	takeWhile(fn: (char: string) => boolean): Parser<string> {
		return new Parser(context => {
			let endIndex = context.position.index;
			while (endIndex < context.input.length && fn(context.input[endIndex])) {
				endIndex++;
			}
			return context.succeedAt(endIndex, context.input.slice(context.position.index, endIndex));
		});
	}

	/**
	 * Wraps a parser, allowing for recursion. `fn` is only called when the parser is in use.
	 * Recursion can easily lead to infinite loops.
	 *
	 * @param fn
	 */
	reference<SType extends STypeBase>(fn: () => Parser<SType>): ParserRef<SType> {
		return new Parser<SType>(context => {
			return fn().p(context);
		});
	}

	// --- UTILITY PARSERS ---

	/**
	 * Yields the current position.
	 */
	readonly pos: Parser<ParsingPosition> = new Parser<ParsingPosition>(context => {
		return context.succeed(context.position);
	});

	/**
	 * Accepts any single character except for eof.
	 * Yields the character
	 */
	readonly any: Parser<string> = new Parser<string>(context => {
		if (context.atEOF()) {
			return context.fail('any character or byte');
		}
		return context.succeedOffset(1, context.input[context.position.index]);
	});

	/**
	 * Accepts the entire rest of the string until the end.
	 * Yields the rest of the string.
	 */
	readonly all: Parser<string> = new Parser<string>(context => {
		return context.succeedAt(context.input.length, context.input.slice(context.position.index));
	});

	readonly eof: Parser<undefined> = new Parser<undefined>(context => {
		if (!context.atEOF()) {
			return context.fail('eof');
		}
		return context.succeed(undefined);
	});

	readonly digit = this.regexp(/[0-9]/).describe('a digit');
	readonly digits = this.regexp(/[0-9]*/).describe('optional digits');
	readonly letter = this.regexp(/[a-z]/i).describe('a letter');
	readonly letters = this.regexp(/[a-z]*/i).describe('optional letters');
	readonly optWhitespace = this.regexp(/\s*/).describe('optional whitespace');
	readonly whitespace = this.regexp(/\s+/).describe('whitespace');
	readonly cr = this.string('\r');
	readonly lf = this.string('\n');
	readonly crlf = this.string('\r\n');
	readonly newline = this.or(this.crlf, this.lf, this.cr).describe('newline');
	readonly end = this.or(this.newline, this.eof);
}

export const P = new ParsiNOM();

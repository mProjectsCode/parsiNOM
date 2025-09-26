import { P_HELPERS } from './Helpers';
import type { InternalParseResult, ParsingRange } from './HelperTypes';
import { Parser } from './Parser';
import { P } from './ParsiNOM';

const charCodeZero = '0'.charCodeAt(0);
const charCodeNine = '9'.charCodeAt(0);

const charCodeA = 'a'.charCodeAt(0);
const charCodeZ = 'z'.charCodeAt(0);

const charCodeAUpper = 'A'.charCodeAt(0);
const charCodeZUpper = 'Z'.charCodeAt(0);

export class P_UTILS {
	/**
	 * Yields the current position in the input string.
	 */
	static position(): Parser<number> {
		return new Parser<number>(context => {
			return context.succeed(context.position);
		});
	}

	/**
	 * Matches any single character except for eof.
	 * Yields the character
	 */
	static any(): Parser<string> {
		return new Parser<string>(context => {
			if (context.atEOF()) {
				return context.fail('any character');
			}
			return context.succeedOffset(1, context.input[context.position]);
		});
	}

	/**
	 * Matches the entire rest of the string until the end.
	 * Yields the rest of the string.
	 */
	static remaining(): Parser<string> {
		return new Parser<string>(context => {
			return context.succeedAt(context.input.length, context.input.slice(context.position));
		});
	}

	/**
	 * Matches the end of the input.
	 */
	static eof(): Parser<undefined> {
		return new Parser<undefined>(context => {
			if (!context.atEOF()) {
				return context.fail('eof');
			}
			return context.succeed(undefined);
		});
	}

	/**
	 * Matches a single digit.
	 */
	static digit(): Parser<string> {
		return P_HELPERS.testCharCode(charCode => {
			return charCode >= charCodeZero && charCode <= charCodeNine;
		}, 'a digit');
	}

	/**
	 * Matches multiple digits.
	 */
	static digits(): Parser<string> {
		return P_HELPERS.testCharCodes(charCode => {
			return charCode >= charCodeZero && charCode <= charCodeNine;
		}, 'multiple digits');
	}

	/**
	 * Matches a single ascii letter.
	 */
	static letter(): Parser<string> {
		return P_HELPERS.testCharCode(charCode => {
			return (charCode >= charCodeA && charCode <= charCodeZ) || (charCode >= charCodeAUpper && charCode <= charCodeZUpper);
		}, 'a letter');
	}

	/**
	 * Matches multiple ascii letters.
	 */
	static letters(): Parser<string> {
		return P_HELPERS.testCharCodes(charCode => {
			return (charCode >= charCodeA && charCode <= charCodeZ) || (charCode >= charCodeAUpper && charCode <= charCodeZUpper);
		}, 'multiple letters');
	}

	/**
	 * Matches a single unicode letter.
	 */
	static unicodeLetter(): Parser<string> {
		return P.regexp(/^\p{L}/iu).describe('a unicode letter');
	}

	/**
	 * Matches multiple unicode letters.
	 */
	static unicodeLetters(): Parser<string> {
		return P.regexp(/^\p{L}+/iu).describe('multiple unicode letters');
	}

	/**
	 * Matches a single alphanumeric unicode character.
	 */
	static unicodeAlphanumeric(): Parser<string> {
		return P.regexp(/^[\p{L}\p{N}]/iu).describe('a unicode alphanumeric character');
	}

	/**
	 * Matches multiple alphanumeric unicode characters.
	 */
	static unicodeAlphanumerics(): Parser<string> {
		return P.regexp(/^[\p{L}\p{N}]+/iu).describe('multiple unicode alphanumeric characters');
	}

	/**
	 * Matches as much whitespace as it can or no whitespace.
	 */
	static optionalWhitespace(): Parser<void> {
		return new Parser<void>(function _test(context): InternalParseResult<void> {
			let i = context.position;
			for (; i < context.input.length; i++) {
				const char = context.input[i];
				if (char !== ' ' && char !== '\t' && char !== '\n' && char !== '\r') {
					break;
				}
			}

			return context.succeedAt(i, undefined);
		});
	}

	/**
	 * Matches multiple, at least one, whitespace.
	 */
	static whitespace(): Parser<void> {
		return new Parser<void>(function _test(context): InternalParseResult<void> {
			let i = context.position;
			for (; i < context.input.length; i++) {
				const char = context.input[i];
				if (char !== ' ' && char !== '\t' && char !== '\n' && char !== '\r') {
					break;
				}
			}

			if (i === context.position) {
				return context.fail('whitespace');
			} else {
				return context.succeedAt(i, undefined);
			}
		});
	}

	/**
	 * Matches a `\r` character.
	 */
	static cr(): Parser<void> {
		return new Parser<void>(function _test(context): InternalParseResult<void> {
			const char = context.input[context.position];
			if (!context.atEOF() && char === '\r') {
				return context.succeedOffset(1, undefined);
			} else {
				return context.fail('\\r');
			}
		});
	}

	/**
	 * Matches a `\n` character.
	 */
	static lf(): Parser<void> {
		return new Parser<void>(function _test(context): InternalParseResult<void> {
			const char = context.input[context.position];
			if (!context.atEOF() && char === '\n') {
				return context.succeedOffset(1, undefined);
			} else {
				return context.fail('\\n');
			}
		});
	}

	/**
	 * Matches a `\r\n` character.
	 */
	static crlf(): Parser<void> {
		return new Parser<void>(function _test(context): InternalParseResult<void> {
			if (context.position + 1 >= context.input.length) {
				return context.fail('\\r\\n');
			}

			const char = context.input[context.position];
			const nextChar = context.input[context.position + 1];

			if (char === '\r' && nextChar === '\n') {
				return context.succeedOffset(2, undefined);
			} else {
				return context.fail('\\r\\n');
			}
		});
	}

	/**
	 * Matches a newline character (either `\r\n`, `\n` or `\r`).
	 */
	static newline(): Parser<void> {
		const failureString = 'newline';

		return new Parser<void>(function _test(context): InternalParseResult<void> {
			if (context.position >= context.input.length) {
				return context.fail(failureString);
			}

			const char = context.input[context.position];

			if (char === '\n') {
				return context.succeedOffset(1, undefined);
			} else if (char === '\r') {
				if (context.position + 1 < context.input.length && context.input[context.position + 1] === '\n') {
					return context.succeedOffset(2, undefined);
				} else {
					return context.succeedOffset(1, undefined);
				}
			} else {
				return context.fail(failureString);
			}
		});
	}

	/**
	 * Matches as many operators as it can and then a singe operand. Then it will reduce the list of operators with the combine function.
	 *
	 * @param operatorsParser
	 * @param nextParser
	 * @param combine
	 */
	static prefix<OperatorSType, OtherSType, ReturnSType>(
		operatorsParser: Parser<OperatorSType>,
		nextParser: Parser<OtherSType>,
		combine: (a: OperatorSType, b: OtherSType | ReturnSType) => ReturnSType,
	): Parser<OtherSType | ReturnSType> {
		return P.sequenceMap(
			(prefixes: OperatorSType[], x: OtherSType) => {
				return prefixes.reduce<OtherSType | ReturnSType>((acc, y) => combine(y, acc), x);
			},
			operatorsParser.many(),
			nextParser,
		);
	}

	/**
	 * Matches a singe operand and then as many operators as it can. Then it will reduce the list of operators with the combine function.
	 *
	 * @param operatorsParser
	 * @param nextParser
	 * @param combine
	 */
	static postfix<OperatorSType, OtherSType, ReturnSType>(
		operatorsParser: Parser<OperatorSType>,
		nextParser: Parser<OtherSType>,
		combine: (a: OperatorSType, b: OtherSType | ReturnSType) => ReturnSType,
	): Parser<OtherSType | ReturnSType> {
		return P.sequenceMap(
			(x: OtherSType, postfixes: OperatorSType[]) => {
				return postfixes.reduce<OtherSType | ReturnSType>((acc, y) => combine(y, acc), x);
			},
			nextParser,
			operatorsParser.many(),
		);
	}

	/**
	 * Matches a right associative binary operation.
	 *
	 * @param operatorsParser
	 * @param operandParser
	 * @param combine
	 */
	static binaryRight<OperatorSType, OtherSType, ReturnSType>(
		operatorsParser: Parser<OperatorSType>,
		operandParser: Parser<OtherSType>,
		combine: (a: OtherSType, b: OperatorSType, c: OtherSType | ReturnSType) => ReturnSType,
	): Parser<OtherSType | ReturnSType> {
		return P.sequenceMap(
			(others: [OtherSType, OperatorSType][], last: OtherSType) => {
				return others.reverse().reduce<OtherSType | ReturnSType>((acc, y) => {
					const [operand, operator] = y;
					return combine(operand, operator, acc);
				}, last);
			},
			P.sequence(operandParser, operatorsParser.trim(this.optionalWhitespace())).many(),
			operandParser,
		);
	}

	/**
	 * Matches a left associative binary operation.
	 *
	 * @param operatorsParser
	 * @param operandParser
	 * @param combine
	 */
	static binaryLeft<OperatorSType, OtherSType, ReturnSType>(
		operatorsParser: Parser<OperatorSType>,
		operandParser: Parser<OtherSType>,
		combine: (a: OtherSType | ReturnSType, b: OperatorSType, c: OtherSType) => ReturnSType,
	): Parser<OtherSType | ReturnSType> {
		return P.sequenceMap(
			(first: OtherSType, others: [OperatorSType, OtherSType][]) => {
				return others.reduce<OtherSType | ReturnSType>((acc, y) => {
					const [operator, operand] = y;
					return combine(acc, operator, operand);
				}, first);
			},
			operandParser,
			P.sequence(operatorsParser.trim(this.optionalWhitespace()), operandParser).many(),
		);
	}

	/**
	 * Matches a right associative binary operation and also passes a parsing range to the combine function.
	 *
	 * @param operatorsParser
	 * @param operandParser
	 * @param combine
	 */
	static binaryRightRange<OperatorSType, OtherSType, ReturnSType>(
		operatorsParser: Parser<OperatorSType>,
		operandParser: Parser<OtherSType>,
		combine: (range: ParsingRange, a: OtherSType, b: OperatorSType, c: OtherSType | ReturnSType) => ReturnSType,
	): Parser<OtherSType | ReturnSType> {
		return P.sequenceMap(
			(others: [number, OtherSType, OperatorSType][], last: OtherSType, to: number) => {
				return others.reverse().reduce<OtherSType | ReturnSType>((acc, y) => {
					const [from, operand, operator] = y;
					return combine({ from, to }, operand, operator, acc);
				}, last);
			},
			P.sequence(P_UTILS.position(), operandParser, operatorsParser.trim(this.optionalWhitespace())).many(),
			operandParser,
			P_UTILS.position(),
		);
	}

	/**
	 * Matches a left associative binary operation and also passes a parsing range to the combine function.
	 *
	 * @param operatorsParser
	 * @param operandParser
	 * @param combine
	 */
	static binaryLeftRange<OperatorSType, OtherSType, ReturnSType>(
		operatorsParser: Parser<OperatorSType>,
		operandParser: Parser<OtherSType>,
		combine: (range: ParsingRange, a: OtherSType | ReturnSType, b: OperatorSType, c: OtherSType) => ReturnSType,
	): Parser<OtherSType | ReturnSType> {
		return P.sequenceMap(
			(from: number, first: OtherSType, others: [OperatorSType, OtherSType, number][]) => {
				return others.reduce<OtherSType | ReturnSType>((acc, y) => {
					const [operator, operand, to] = y;
					return combine({ from, to }, acc, operator, operand);
				}, first);
			},
			P_UTILS.position(),
			operandParser,
			P.sequence(operatorsParser.trim(this.optionalWhitespace()), operandParser, P_UTILS.position()).many(),
		);
	}

	static func<ArgsSType, ReturnSType>(
		name: string | Parser<string>,
		args: Parser<ArgsSType>,
		combine: (name: string, args: ArgsSType) => ReturnSType,
	): Parser<ReturnSType> {
		const nameParser: Parser<string> = typeof name === 'string' ? P.string(name) : name;
		return P.sequenceMap(
			(name, _lBracket, _1, args, _2, _rBracket) => {
				return combine(name, args);
			},
			nameParser,
			P.string('('),
			this.optionalWhitespace(),
			args,
			this.optionalWhitespace(),
			P.string(')'),
		);
	}
}

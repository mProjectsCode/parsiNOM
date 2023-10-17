import { Parser } from './Parser';
import { P } from './ParsiNOM';
import { ParsingPosition, ParsingRange } from './HelperTypes';

export class P_UTILS {
	/**
	 * Yields the current position in the input string.
	 */
	static position(): Parser<ParsingPosition> {
		return new Parser<ParsingPosition>(context => {
			return context.succeed(context.getPosition());
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
			return context.succeedOffset(1, context.input[context.position.index]);
		});
	}

	/**
	 * Matches the entire rest of the string until the end.
	 * Yields the rest of the string.
	 */
	static remaining(): Parser<string> {
		return new Parser<string>(context => {
			return context.succeedAt(context.input.length, context.input.slice(context.position.index));
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
	static digit() {
		return P.regexp(/^[0-9]/).describe('a digit');
	}

	/**
	 * Matches multiple digits.
	 */
	static digits() {
		return P.regexp(/^[0-9]+/).describe('multiple digits');
	}

	/**
	 * Matches a single ascii letter.
	 */
	static letter() {
		return P.regexp(/^[a-z]/i).describe('a letter');
	}

	/**
	 * Matches multiple ascii letters.
	 */
	static letters() {
		return P.regexp(/^[a-z]+/i).describe('multiple letters');
	}

	/**
	 * Matches as much whitespace as it can or no whitespace.
	 */
	static optionalWhitespace() {
		return P.regexp(/^\s*/).describe('optional whitespace');
	}

	/**
	 * Matches multiple, at least one, whitespace.
	 */
	static whitespace() {
		return P.regexp(/^\s+/).describe('whitespace');
	}

	/**
	 * Matches a `\r` character.
	 */
	static cr() {
		return P.string('\r');
	}

	/**
	 * Matches a `\n` character.
	 */
	static lf() {
		return P.string('\n');
	}

	/**
	 * Matches a `\r\n` character.
	 */
	static crlf() {
		return P.string('\r\n');
	}

	/**
	 * Matches a newline character (either `\r\n`, `\n` or `\r`).
	 */
	static newline() {
		return P.or(this.crlf(), this.lf(), this.cr()).describe('newline');
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
			(prefixes, x) => {
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
			(x, postfixes) => {
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
			(others, last: OtherSType) => {
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
			(first: OtherSType, others) => {
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
			(others, last: OtherSType, to) => {
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
			(from, first: OtherSType, others) => {
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
		const nameParser = typeof name === 'string' ? P.string(name) : name;
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

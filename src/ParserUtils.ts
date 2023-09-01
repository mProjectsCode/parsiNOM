import { STypeBase } from './HelperTypes';
import { Parser } from './Parser';
import { P } from './ParsiNOM';

export class ParserUtils {
	lookahead<SType extends STypeBase>(x: Parser<SType>): Parser<SType>;
	lookahead(x: string): Parser<string>;
	lookahead(x: RegExp): Parser<string>;
	lookahead<SType extends STypeBase>(x: Parser<SType> | string | RegExp): Parser<SType | string>;
	lookahead<SType extends STypeBase>(x: Parser<SType> | string | RegExp): Parser<SType | string> {
		if (x instanceof Parser) {
			return new Parser<SType>(context => {
				const result = x.p(context.copy());
				result.position = context.position;
				result.value = '';
				return result;
			});
		} else if (typeof x === 'string') {
			return this.lookahead(P.string(x));
		}

		return this.lookahead(P.regexp(x));
	}

	prefix<OperatorSType, OtherSType, ReturnSType>(
		operatorsParser: Parser<OperatorSType>,
		nextParser: Parser<OtherSType>,
		combine: (a: OperatorSType, b: OtherSType | ReturnSType) => ReturnSType,
	): Parser<OtherSType | ReturnSType> {
		const parser: Parser<OtherSType | ReturnSType> = P.lazy(() => {
			return P.sequenceMap(combine, operatorsParser, parser).or(nextParser);
		});
		return parser;
	}

	postfix<OperatorSType, OtherSType, ReturnSType>(
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

	binaryRight<OperatorSType, OtherSType, ReturnSType>(
		operatorsParser: Parser<OperatorSType>,
		nextParser: Parser<OtherSType>,
		combine: (a: OtherSType, b: OperatorSType, c: OtherSType | ReturnSType) => ReturnSType,
	): Parser<OtherSType | ReturnSType> {
		const parser: Parser<OtherSType | ReturnSType> = P.lazy(() =>
			P.sequenceMap(combine, nextParser, operatorsParser.trim(P.optWhitespace), parser).or(nextParser),
		);
		return parser;
	}

	binaryLeft<OperatorSType, OtherSType, ReturnSType>(
		operatorsParser: Parser<OperatorSType>,
		nextParser: Parser<OtherSType>,
		combine: (a: OtherSType | ReturnSType, b: OperatorSType, c: OtherSType) => ReturnSType,
	): Parser<OtherSType | ReturnSType> {
		return P.sequenceMap(
			(first: OtherSType, others) => {
				return others.reduce<OtherSType | ReturnSType>((acc, y) => {
					const [operator, next] = y;
					return combine(acc, operator, next);
				}, first);
			},
			nextParser,
			P.sequence(operatorsParser.trim(P.optWhitespace), nextParser).many(),
		);
	}

	func<ArgsSType, ReturnSType>(
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
			P.optWhitespace,
			args,
			P.optWhitespace,
			P.string(')'),
		);
	}
}

export const P_UTILS = new ParserUtils();

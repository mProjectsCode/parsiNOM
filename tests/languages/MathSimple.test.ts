import { Parser } from '../../src/Parser';
import { P } from '../../src/ParsiNOM';
import { STypeBase } from '../../src/HelperTypes';

const _ = P.optWhitespace;

function operators(operators: Record<string, string>): Parser<string> {
	const keys = Object.keys(operators).sort();
	const parsers = keys.map(k => P.string(operators[k]).trim(_).result(k));
	return P.or(...parsers);
}

type UnaryOperatorParserData<OperatorSType extends STypeBase, OtherSType extends STypeBase> =
	| [OperatorSType, UnaryOperatorParserData<OperatorSType, OtherSType>]
	| OtherSType;
function prefix<OperatorSType extends STypeBase, OtherSType extends STypeBase>(
	operatorsParser: Parser<OperatorSType>,
	nextParser: Parser<OtherSType>,
): Parser<UnaryOperatorParserData<OperatorSType, OtherSType>> {
	const parser: Parser<UnaryOperatorParserData<OperatorSType, OtherSType>> = P.lazy(() => {
		return P.sequence(operatorsParser, parser).or(nextParser);
	});
	return parser;
}

function postfix<OperatorSType extends STypeBase, OtherSType extends STypeBase>(
	operatorsParser: Parser<OperatorSType>,
	nextParser: Parser<OtherSType>,
): Parser<UnaryOperatorParserData<OperatorSType, OtherSType>> {
	return P.sequenceMap(
		(x, postfixes) => {
			return postfixes.reduce<UnaryOperatorParserData<OperatorSType, OtherSType>>((acc, y) => [y, acc], x);
		},
		nextParser,
		operatorsParser.many(),
	);
}

type BinaryOperatorParserData<OperatorSType extends STypeBase, OtherSType extends STypeBase> =
	| [OperatorSType, BinaryOperatorParserData<OperatorSType, OtherSType>, BinaryOperatorParserData<OperatorSType, OtherSType>]
	| OtherSType;

function binaryRight<OperatorSType extends STypeBase, OtherSType extends STypeBase>(
	operatorsParser: Parser<OperatorSType>,
	nextParser: Parser<OtherSType>,
): Parser<BinaryOperatorParserData<OperatorSType, OtherSType>> {
	const parser: Parser<BinaryOperatorParserData<OperatorSType, OtherSType>> = P.lazy(() =>
		nextParser.chain(next => P.sequence(operatorsParser, P.alwaysSucceedParser(next), parser).or(P.alwaysSucceedParser(next))),
	);
	return parser;
}

function binaryLeft<OperatorSType extends STypeBase, OtherSType extends STypeBase>(
	operatorsParser: Parser<OperatorSType>,
	nextParser: Parser<OtherSType>,
): Parser<BinaryOperatorParserData<OperatorSType, OtherSType>> {
	return P.sequenceMap(
		(first: OtherSType, others) => {
			return others.reduce<BinaryOperatorParserData<OperatorSType, OtherSType>>((acc, ch) => {
				const [op, another] = ch;
				return [op, acc, another];
			}, first);
		},
		nextParser,
		P.sequence(operatorsParser, nextParser).many(),
	);
}

let Num: Parser<readonly ['Number', number]> = P.regexp(/[0-9]+/)
	.map(str => ['Number', Number.parseInt(str)])
	.describe('number');

let Basic: Parser<unknown> = P.lazy(() => P.string('(').then(Math).skip(P.string(')')).or(Num));

let table: {
	type: (
		operatorsParser: Parser<string>,
		nextParser: Parser<unknown>,
	) => Parser<UnaryOperatorParserData<string, unknown>> | Parser<BinaryOperatorParserData<string, unknown>>;
	ops: Parser<string>;
}[] = [
	{ type: prefix, ops: operators({ Negate: '-' }) },
	{ type: postfix, ops: operators({ Factorial: '!' }) },
	{ type: binaryRight, ops: operators({ Exponentiate: '^' }) },
	{ type: binaryLeft, ops: operators({ Multiply: '*', Divide: '/' }) },
	{ type: binaryLeft, ops: operators({ Add: '+', Subtract: '-' }) },
];

let tableParser: Parser<unknown> = table.reduce((acc, level) => level.type(level.ops, acc), Basic);

let Math: Parser<unknown> = tableParser.trim(_);

describe('math test', () => {
	const testCases: string[] = ['1 + 2', '1 + 2 + 3', '1 * 2 + 3', '1 + 2 * 3', '(1 + 2) * 3', '1 + -2', '1 + -2 ^ 2', '1 + -2 ^ 2!'];

	for (const testCase of testCases) {
		test(testCase, () => {
			expect(Math.parse(testCase)).toMatchSnapshot();
		});
	}
});

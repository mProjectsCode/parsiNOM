import { TupleToUnion } from '../src/HelperTypes';
import { P } from '../src/ParsiNOM';
import { Parser } from '../src/Parser';
import { P_UTILS } from '../src/ParserUtils';

type Literal = string | number | boolean;

const ComparisonOperators = ['>', '>=', '<=', '<', '=', '!='] as const;
type ComparisonOperator = TupleToUnion<typeof ComparisonOperators>;

const ArithmeticOperators = ['+', '-', '*', '/', '%', '^', '&&', '||'] as const;
type ArithmeticOperator = TupleToUnion<typeof ArithmeticOperators>;

const UnaryOperators = ['!', '-'] as const;
type UnaryOperator = TupleToUnion<typeof UnaryOperators>;

type BinaryOperator = ComparisonOperator | ArithmeticOperator;
type Operator = BinaryOperator | UnaryOperator;

type Expression = LiteralExpression | UnaryExpression | BinaryExpression;

interface LiteralExpression {
	type: 'literal';
	value: Literal;
}

interface UnaryExpression {
	type: 'unary';
	operator: Operator;
	value: Expression;
}

interface BinaryExpression {
	type: 'binary';
	operator: Operator;

	left: Expression;
	right: Expression;
}

export class _ExpressionConstructor {
	literal(value: Literal): LiteralExpression {
		return { type: 'literal', value: value };
	}

	unary(operator: Operator, value: Expression): UnaryExpression {
		return { type: 'unary', operator: operator, value: value };
	}

	binary(left: Expression, operator: Operator, right: Expression): BinaryExpression {
		return { type: 'binary', operator: operator, left: left, right: right };
	}
}

const EXPRESSION_CONSTRUCTOR = new _ExpressionConstructor();

interface MathTokenLanguage {
	number: number;
	string: string;
	bool: boolean;

	unaryFactorial: UnaryOperator;

	binaryExp: BinaryOperator;
	binaryMulDiv: BinaryOperator;
	binaryPlus: BinaryOperator;
	binaryMinus: BinaryOperator;
	binaryCompare: BinaryOperator;
	binaryAnd: BinaryOperator;
	binaryOr: BinaryOperator;
}

const MATH_TOKEN = P.createLanguage<MathTokenLanguage>({
	number: _ =>
		P.regexp(/^[0-9]+/)
			.map(str => Number.parseInt(str))
			.describe('number'),
	string: _ =>
		P.string('"')
			.then(
				P.noneOf('"')
					.many()
					.map(x => x.join('')),
			)
			.skip(P.string('"'))
			.describe('string'),
	bool: _ => P.or(P.string('true').result(true), P.string('true').result(false)).describe('boolean'),

	unaryFactorial: _ => (P.string('!') as Parser<UnaryOperator>).describe('factorial'),

	binaryExp: _ => (P.or(P.string('^')) as Parser<ArithmeticOperator>).describe("'^'"),
	binaryMulDiv: _ => (P.or(P.string('*'), P.string('/')) as Parser<ArithmeticOperator>).describe("'*' or '/'"),
	binaryPlus: _ => (P.string('+') as Parser<ArithmeticOperator>).describe("'+'"),
	binaryMinus: _ => (P.string('-') as Parser<ArithmeticOperator>).describe("'-'"),
	binaryCompare: _ => P.oneStringOf(ComparisonOperators) as Parser<ComparisonOperator>,
	binaryAnd: _ => (P.string('&&') as Parser<ArithmeticOperator>).describe("'&&'"),
	binaryOr: _ => (P.string('||') as Parser<ArithmeticOperator>).describe("'||'"),
});

interface MathLanguage {
	number: LiteralExpression;
	bool: LiteralExpression;
	string: LiteralExpression;

	atom: Expression;

	parens: Expression;

	unaryFactorial: Expression;
	unaryNegate: Expression;

	binaryExp: Expression;
	binaryMulDiv: Expression;
	binaryPlusMinus: Expression;
	binaryCompare: Expression;
	binaryBoolean: Expression;

	binaryOp: Expression;
	expression: Expression;
}

const Math = P.createLanguage<MathLanguage>({
	number: () => MATH_TOKEN.number.map(EXPRESSION_CONSTRUCTOR.literal).describe('number'),
	bool: () => MATH_TOKEN.bool.map(EXPRESSION_CONSTRUCTOR.literal).describe('bool'),
	string: () => MATH_TOKEN.string.map(EXPRESSION_CONSTRUCTOR.literal).describe('string'),

	parens: (l, r) => r.binaryOp.wrap(P.string('('), P.string(')')),

	atom: l => P.or(l.parens, l.number, l.bool, l.string),

	unaryFactorial: l => P_UTILS.postfix(MATH_TOKEN.unaryFactorial, l.atom, EXPRESSION_CONSTRUCTOR.unary),
	unaryNegate: l => P_UTILS.prefix(MATH_TOKEN.binaryMinus, l.unaryFactorial, EXPRESSION_CONSTRUCTOR.unary),

	binaryExp: l => P_UTILS.binaryRight(MATH_TOKEN.binaryExp, l.unaryNegate, EXPRESSION_CONSTRUCTOR.binary),
	binaryMulDiv: l => P_UTILS.binaryLeft(MATH_TOKEN.binaryMulDiv, l.binaryExp, EXPRESSION_CONSTRUCTOR.binary),
	binaryPlusMinus: l => P_UTILS.binaryLeft(MATH_TOKEN.binaryPlus.or(MATH_TOKEN.binaryMinus), l.binaryMulDiv, EXPRESSION_CONSTRUCTOR.binary),
	binaryCompare: l => P_UTILS.binaryLeft(MATH_TOKEN.binaryCompare, l.binaryPlusMinus, EXPRESSION_CONSTRUCTOR.binary),
	binaryBoolean: l => P_UTILS.binaryLeft(MATH_TOKEN.binaryAnd.or(MATH_TOKEN.binaryOr), l.binaryCompare, EXPRESSION_CONSTRUCTOR.binary),

	binaryOp: l => l.binaryBoolean,
	expression: l => l.binaryOp,
});

export const MathParser = Math.expression.thenEof();

/*
 * ----- INTERPRETER -----
 *
 * This is interpreter is a proof of concept of how a programming language could be defined using parsiNOM.
 * This was written without prior knowledge on how interpreters work, so the code is not that pretty.
 * The language itself has strict type checking, no type inference and only implicit returns at the end of blocks.
 * This is a deliberate decision to keep the language relatively simple.
 *
 * TODO:
 *  - '-' unary prefix
 *  - allow functions to access parent scope
 *  - if statements and loops
 *  - allow for blocks to be used as expressions
 *  - better errors (code locations)
 * Maybe TODO:
 * 	- arrays
 * 	- objects or classes
 * 	- namespaces
 */

import { P_UTILS } from '../src/ParserUtils';
import { P } from '../src/ParsiNOM';
import { Parser } from '../src/Parser';
import { ParsingRange, TupleToUnion } from '../src/HelperTypes';

const ComparisonOperators = ['>', '>=', '<=', '<', '==', '!='] as const;
type ComparisonOperator = TupleToUnion<typeof ComparisonOperators>;

const ArithmeticOperators = ['+', '-', '*', '/', '%', '^', '&&', '||'] as const;
type ArithmeticOperator = TupleToUnion<typeof ArithmeticOperators>;

const UnaryOperators = ['-'] as const;
type UnaryOperator = TupleToUnion<typeof UnaryOperators>;

export type BinaryOperator = ComparisonOperator | ArithmeticOperator;

class Callable {
	body: AST_Block;
	args: AST_TypedIdentifier[];
	retType: TypeWrapper;

	constructor(body: AST_Block, args: AST_TypedIdentifier[], retType: TypeWrapper) {
		this.body = body;
		this.args = args;
		this.retType = retType;
	}

	run(args: Value[]): Value {
		for (let i = 0; i < args.length; i++) {
			// console.log(`writing args ${this.args[i].identifier.name}`);
			this.body.declareVar(this.args[i], this.args[i].identifier.name, args[i]);
		}

		return this.body.evaluate();
	}

	validateType(): TypeWrapper {
		for (let i = 0; i < this.args.length; i++) {
			this.body.createVar(this.args[i], this.args[i].identifier.name, this.args[i].validateType());
		}

		const bodyType = this.body.validateType();
		// const bodyType = this.retType;

		if (!isEqualType(this.retType, bodyType)) {
			throw new Error(`callable has defined return type of '${this.retType.type}' but it's body has the return type of '${bodyType.type}'`);
		}

		return TypeOf(BaseType.CALLABLE, this.retType);
	}
}

type Value = null | string | number | boolean | Callable;

export enum BaseType {
	STRING = 'STRING',
	NUMBER = 'NUMBER',
	BOOL = 'BOOL',
	NULL = 'NULL',
	CALLABLE = 'CALLABLE',
}

interface NonGenericTypeWrapper {
	type: BaseType;
	isGeneric: false;
	generic: undefined;
}

interface GenericTypeWrapper {
	type: BaseType;
	isGeneric: true;
	generic: TypeWrapper;
}

type TypeWrapper = GenericTypeWrapper | NonGenericTypeWrapper;

function isGeneric(type: BaseType): boolean {
	switch (type) {
		case BaseType.CALLABLE:
			return true;
		default:
			return false;
	}
}

function TypeOf(type: BaseType, generic?: TypeWrapper): TypeWrapper {
	if (generic !== undefined) {
		if (isGeneric(type)) {
			return {
				type: type,
				isGeneric: true,
				generic: generic,
			};
		} else {
			throw new Error(`can't create generic type from ${type}, ${type} is not generic`);
		}
	} else {
		if (isGeneric(type)) {
			throw new Error(`can't create non generic type from ${type}, ${type} is generic`);
		} else {
			return {
				type: type,
				isGeneric: false,
				generic: undefined,
			};
		}
	}
}

function isCallable(type: TypeWrapper): boolean {
	return type.type === BaseType.CALLABLE;
}

function isEqualType(typeA: TypeWrapper, typeB: TypeWrapper): boolean {
	if (typeA.type === typeB.type) {
		if (typeA.isGeneric && typeB.isGeneric) {
			return isEqualType(typeA.generic, typeB.generic);
		}

		return true;
	}

	return false;
}

class Variable {
	name: string;
	type: TypeWrapper;
	declared: boolean;
	value: Value | undefined;
	declaration: AST_Node;
	lastWrite: AST_Node | undefined;

	constructor(node: AST_Node, name: string, type: TypeWrapper) {
		this.name = name;
		this.type = type;
		this.value = undefined;
		this.declared = false;
		this.declaration = node;
	}

	validateWriteType(valueAST: AST_Node): void {
		const valueType = valueAST.validateType();
		if (!isEqualType(this.type, valueType)) {
			throw new Error(`type '${valueType.type}' is not assignable to variable of type '${this.type.type}'`);
		}
	}

	declare(node: AST_Node, value: Value): void {
		this.declared = true;
		this.value = value;

		this.declaration = node;
		this.lastWrite = node;
	}

	free() {
		this.declared = false;
		this.value = undefined;

		this.lastWrite = undefined;
	}

	write(node: AST_Node, value: Value): void {
		if (!this.declared) {
			throw new Error(`variable '${this.name}' is not declared yet`);
		}

		this.value = value;
		this.lastWrite = node;
	}

	read(): Value {
		if (!this.declared) {
			throw new Error(`variable '${this.name}' is not declared yet`);
		}

		return this.value as Value;
	}
}

abstract class AST_Node {
	range: ParsingRange;
	parent: AST_Node | undefined;

	constructor(range: ParsingRange) {
		this.range = range;
	}

	setParent(parent: AST_Node): void {
		this.parent = parent;
	}

	getParent(): AST_Node {
		if (this.parent) {
			return this.parent;
		} else {
			throw new Error('Node is missing parent');
		}
	}

	getScope(): AST_Block {
		let parent = this.getParent();

		while (!(parent instanceof AST_Block)) {
			parent = parent.getParent();
		}

		return parent;
	}

	abstract evaluate(): Value;

	abstract validateType(): TypeWrapper;
}

class AST_String extends AST_Node {
	value: string;

	constructor(range: ParsingRange, value: string) {
		super(range);
		this.value = value;
	}

	public evaluate(): string {
		return this.value;
	}

	public validateType(): TypeWrapper {
		return TypeOf(BaseType.STRING);
	}
}

class AST_Number extends AST_Node {
	value: number;

	constructor(range: ParsingRange, value: number) {
		super(range);
		this.value = value;
	}

	public evaluate(): number {
		return this.value;
	}

	public validateType(): TypeWrapper {
		return TypeOf(BaseType.NUMBER);
	}
}

class AST_Bool extends AST_Node {
	value: boolean;

	constructor(range: ParsingRange, value: boolean) {
		super(range);
		this.value = value;
	}

	public evaluate(): boolean {
		return this.value;
	}

	public validateType(): TypeWrapper {
		return TypeOf(BaseType.BOOL);
	}
}

type AST_Leaf = AST_String | AST_Number | AST_Bool;

class AST_Identifier extends AST_Node {
	name: string;

	constructor(range: ParsingRange, name: string) {
		super(range);
		this.name = name;
	}

	public evaluate(): null {
		throw new Error('can not evaluate identifier');
	}

	public validateType(): TypeWrapper {
		return TypeOf(BaseType.NULL);
	}
}

class AST_TypeAnnotation extends AST_Node {
	type: TypeWrapper;

	constructor(range: ParsingRange, type: TypeWrapper) {
		super(range);
		this.type = type;
	}

	public evaluate(): null {
		throw new Error('can not evaluate type annotation');
	}

	public validateType(): TypeWrapper {
		for (const entry of Object.values(BaseType)) {
			if (this.type.type === entry) {
				return this.type;
			}
		}

		throw new Error(`invalid type ${this.type.type}`);
	}
}

class AST_TypedIdentifier extends AST_Node {
	identifier: AST_Identifier;
	type: AST_TypeAnnotation;

	constructor(range: ParsingRange, identifier: AST_Identifier, type: AST_TypeAnnotation) {
		super(range);
		this.identifier = identifier;
		this.type = type;

		this.identifier.setParent(this);
		this.type.setParent(this);
	}

	public evaluate(): null {
		throw new Error('can not evaluate typed identifier');
	}

	public validateType(): TypeWrapper {
		return this.type.validateType();
	}
}

class AST_VarRead extends AST_Node {
	identifier: AST_Identifier;

	constructor(range: ParsingRange, identifier: AST_Identifier) {
		super(range);
		this.identifier = identifier;

		this.identifier.setParent(this);
	}

	public evaluate(): Value {
		const scope = this.getScope();
		return scope.readVar(this, this.identifier.name);
	}

	public validateType(): TypeWrapper {
		const scope = this.getScope();
		return scope.readVarType(this.identifier.name);
	}
}

class AST_Binary extends AST_Node {
	operator: BinaryOperator;
	lhs: AST_Expression;
	rhs: AST_Expression;

	constructor(range: ParsingRange, operator: BinaryOperator, lhs: AST_Expression, rhs: AST_Expression) {
		super(range);
		this.operator = operator;
		this.lhs = lhs;
		this.rhs = rhs;

		this.lhs.setParent(this);
		this.rhs.setParent(this);
	}

	public evaluate(): Value {
		const ltype = this.lhs.validateType();
		const rtype = this.rhs.validateType();

		const lvalue = this.lhs.evaluate();
		const rvalue = this.rhs.evaluate();

		switch (this.operator) {
			case '>':
				if (isEqualType(ltype, rtype) && ltype.type === BaseType.NUMBER) {
					// @ts-ignore
					return lvalue > rvalue;
				}
				break;
			case '>=':
				if (isEqualType(ltype, rtype) && ltype.type === BaseType.NUMBER) {
					// @ts-ignore
					return lvalue >= rvalue;
				}
				break;
			case '<=':
				if (isEqualType(ltype, rtype) && ltype.type === BaseType.NUMBER) {
					// @ts-ignore
					return lvalue <= rvalue;
				}
				break;
			case '<':
				if (isEqualType(ltype, rtype) && ltype.type === BaseType.NUMBER) {
					// @ts-ignore
					return lvalue < rvalue;
				}
				break;
			case '==':
				return lvalue === rvalue;
			case '!=':
				return lvalue !== rvalue;
			case '+':
				if (isEqualType(ltype, rtype)) {
					if (ltype.type === BaseType.NUMBER) {
						// @ts-ignore
						return lvalue + rvalue;
					}
					if (ltype.type === BaseType.STRING) {
						// @ts-ignore
						return lvalue + rvalue;
					}
				}
				break;
			case '-':
				if (isEqualType(ltype, rtype) && ltype.type === BaseType.NUMBER) {
					// @ts-ignore
					return lvalue - rvalue;
				}
				break;
			case '*':
				if (isEqualType(ltype, rtype) && ltype.type === BaseType.NUMBER) {
					// @ts-ignore
					return lvalue * rvalue;
				}
				break;
			case '/':
				if (isEqualType(ltype, rtype) && ltype.type === BaseType.NUMBER) {
					// @ts-ignore
					return lvalue / rvalue;
				}
				break;
			case '%':
				if (isEqualType(ltype, rtype) && ltype.type === BaseType.NUMBER) {
					// @ts-ignore
					return ((lvalue % rvalue) + rvalue) % rvalue;
				}
				break;
			case '^':
				if (isEqualType(ltype, rtype) && ltype.type === BaseType.NUMBER) {
					// @ts-ignore
					return lvalue ** rvalue;
				}
				break;
			case '&&':
				if (isEqualType(ltype, rtype) && ltype.type === BaseType.BOOL) {
					// @ts-ignore
					return lvalue && rvalue;
				}
				break;
			case '||':
				if (isEqualType(ltype, rtype) && ltype.type === BaseType.BOOL) {
					// @ts-ignore
					return lvalue || rvalue;
				}
				break;
		}

		throw new Error(`operator '${this.operator}' is not applicable to '${lvalue}' (${ltype}) and '${rvalue}' (${rtype})`);
	}

	public validateType(): TypeWrapper {
		const ltype = this.lhs.validateType();
		const rtype = this.rhs.validateType();

		switch (this.operator) {
			case '>':
				if (isEqualType(ltype, rtype) && ltype.type === BaseType.NUMBER) {
					return TypeOf(BaseType.NUMBER);
				}
				break;
			case '>=':
				if (isEqualType(ltype, rtype) && ltype.type === BaseType.NUMBER) {
					return TypeOf(BaseType.NUMBER);
				}
				break;
			case '<=':
				if (isEqualType(ltype, rtype) && ltype.type === BaseType.NUMBER) {
					return TypeOf(BaseType.NUMBER);
				}
				break;
			case '<':
				if (isEqualType(ltype, rtype) && ltype.type === BaseType.NUMBER) {
					return TypeOf(BaseType.NUMBER);
				}
				break;
			case '==':
				return TypeOf(BaseType.BOOL);
			case '!=':
				return TypeOf(BaseType.BOOL);
			case '+':
				if (isEqualType(ltype, rtype)) {
					if (ltype.type === BaseType.NUMBER) {
						return TypeOf(BaseType.NUMBER);
					}
					if (ltype.type === BaseType.STRING) {
						return TypeOf(BaseType.STRING);
					}
				}
				break;
			case '-':
				if (isEqualType(ltype, rtype) && ltype.type === BaseType.NUMBER) {
					return TypeOf(BaseType.NUMBER);
				}
				break;
			case '*':
				if (isEqualType(ltype, rtype) && ltype.type === BaseType.NUMBER) {
					return TypeOf(BaseType.NUMBER);
				}
				break;
			case '/':
				if (isEqualType(ltype, rtype) && ltype.type === BaseType.NUMBER) {
					return TypeOf(BaseType.NUMBER);
				}
				break;
			case '%':
				if (isEqualType(ltype, rtype) && ltype.type === BaseType.NUMBER) {
					return TypeOf(BaseType.NUMBER);
				}
				break;
			case '^':
				if (isEqualType(ltype, rtype) && ltype.type === BaseType.NUMBER) {
					return TypeOf(BaseType.NUMBER);
				}
				break;
			case '&&':
				if (isEqualType(ltype, rtype) && ltype.type === BaseType.BOOL) {
					return TypeOf(BaseType.BOOL);
				}
				break;
			case '||':
				if (isEqualType(ltype, rtype) && ltype.type === BaseType.BOOL) {
					return TypeOf(BaseType.BOOL);
				}
				break;
		}

		throw new Error(`operator '${this.operator}' is not applicable to ${ltype.type} and ${rtype.type}`);
	}
}

type AST_Expression = AST_Leaf | AST_VarRead | AST_Binary | AST_FunctionCall;

class AST_VarWrite extends AST_Node {
	identifier: AST_Identifier;
	value: AST_Expression;

	constructor(range: ParsingRange, identifier: AST_Identifier, value: AST_Expression) {
		super(range);
		this.identifier = identifier;
		this.value = value;

		this.identifier.setParent(this);
		this.value.setParent(this);
	}

	public evaluate(): null {
		const scope = this.getScope();
		scope.writeVar(this, this.identifier.name, this.value.evaluate());

		return null;
	}

	public validateType(): TypeWrapper {
		return TypeOf(BaseType.NULL);
	}
}

class AST_VarDeclaration extends AST_Node {
	identifier: AST_TypedIdentifier;
	value: AST_Node;

	constructor(range: ParsingRange, identifier: AST_TypedIdentifier, value: AST_Expression) {
		super(range);
		this.identifier = identifier;
		this.value = value;

		this.identifier.setParent(this);
		this.value.setParent(this);
	}

	public evaluate(): null {
		const scope = this.getScope();
		scope.declareVar(this, this.identifier.identifier.name, this.value.evaluate());

		return null;
	}

	public validateType(): TypeWrapper {
		const scope = this.getScope();
		scope.createVar(this, this.identifier.identifier.name, this.identifier.validateType(), this.value);

		return TypeOf(BaseType.NULL);
	}
}

type AST_Statement = AST_VarWrite | AST_VarDeclaration | AST_FunctionDeclaration | AST_Expression;

class AST_Block extends AST_Node {
	vars: Map<string, Variable>;
	statements: AST_Statement[];

	constructor(range: ParsingRange, statements: AST_Statement[]) {
		super(range);
		this.statements = statements;

		for (const statement of statements) {
			statement.setParent(this);
		}

		this.vars = new Map<string, Variable>();
	}

	public evaluate(): Value {
		let value = null;
		for (const statement of this.statements) {
			value = statement.evaluate();
		}
		// free all vars
		for (const [_, variable] of this.vars) {
			variable.free();
		}

		return value;
	}

	public validateType(): TypeWrapper {
		let value = null;
		for (const statement of this.statements) {
			// console.log(`validate statement `);
			value = statement.validateType();
		}

		return value ?? TypeOf(BaseType.NULL);
	}

	declareVar(node: AST_Node, name: string, value: Value): void {
		// console.log(`declare var ${name}`);

		const variable = this.vars.get(name);

		if (variable === undefined) {
			throw new Error(`can not access non existent variable ${name}`);
		}

		variable.declare(node, value);
	}

	readVar(node: AST_Node, name: string): Value {
		// console.log(`read var ${name}`);

		const variable = this.vars.get(name);

		if (variable === undefined) {
			throw new Error(`can not access undeclared variable ${name}`);
		}

		return variable.read();
	}

	writeVar(node: AST_Node, name: string, value: Value): void {
		// console.log(`write var ${name}`);

		const variable = this.vars.get(name);

		if (variable === undefined) {
			throw new Error(`can not access undeclared variable ${name}`);
		}

		variable.write(node, value);
	}

	getVar(name: string): Variable {
		// console.log(`get var ${name}`);

		const variable = this.vars.get(name);

		if (variable === undefined) {
			throw new Error(`can not access undeclared variable ${name}`);
		}

		return variable;
	}

	createVar(node: AST_Node, name: string, type: TypeWrapper, valueNode?: AST_Node): void {
		// console.log(`create var ${name}`);

		const variable = new Variable(node, name, type);

		if (valueNode !== undefined) {
			variable.validateWriteType(valueNode);
		}
		this.vars.set(name, variable);
	}

	readVarType(name: string): TypeWrapper {
		const variable = this.vars.get(name);

		if (variable === undefined) {
			throw new Error(`can not access type of undeclared variable ${name}`);
		}

		// console.log(`read type ${variable.type.type}`);

		return variable.type;
	}
}

class AST_FunctionDeclaration extends AST_Node {
	name: AST_Identifier;
	args: AST_TypedIdentifier[];
	type: AST_TypeAnnotation;
	body: AST_Block;
	callable: Callable | undefined;

	constructor(range: ParsingRange, name: AST_Identifier, args: AST_TypedIdentifier[], type: AST_TypeAnnotation, body: AST_Block) {
		super(range);
		this.name = name;
		this.args = args;
		this.type = type;
		this.body = body;

		this.name.setParent(this);
		this.args.forEach(x => x.setParent(this));
		this.type.setParent(this);
		this.body.setParent(this);
	}

	public evaluate(): null {
		const scope = this.getScope();
		const variable = scope.getVar(this.name.name);
		// console.log(`got function ${this.name.name}`);
		variable.declare(this, this.callable as Callable);
		// console.log(`declared function ${this.name.name}`);

		return null;
	}

	public validateType(): TypeWrapper {
		const scope = this.getScope();
		this.callable = new Callable(this.body, this.args, this.type.validateType());
		scope.createVar(this, this.name.name, this.callable.validateType());

		return TypeOf(BaseType.NULL);
	}
}

class AST_FunctionCall extends AST_Node {
	name: AST_Identifier;
	args: AST_Expression[];

	constructor(range: ParsingRange, name: AST_Identifier, args: AST_Expression[]) {
		super(range);
		this.name = name;
		this.args = args;

		this.name.setParent(this);
		this.args.forEach(x => x.setParent(this));
	}

	public evaluate(): Value {
		const scope = this.getScope();

		const varType = scope.readVarType(this.name.name);

		if (isCallable(varType)) {
			const callable = scope.readVar(this, this.name.name) as Callable;

			// console.log('running callable');

			return callable.run(this.args.map(x => x.evaluate()));
		} else {
			throw new Error('can not call non callable');
		}
	}

	public validateType(): TypeWrapper {
		const scope = this.getScope();
		const varType = scope.readVarType(this.name.name);

		if (isCallable(varType)) {
			const variable = scope.getVar(this.name.name);
			const callable = (variable.declaration as AST_FunctionDeclaration).callable;

			if (callable === undefined) {
				throw new Error('can not access callable');
			}

			if (this.args.length !== callable.args.length) {
				throw new Error('invalid number of arguments');
			}

			for (let i = 0; i < this.args.length; i++) {
				if (!isEqualType(this.args[i].validateType(), callable.args[i].validateType())) {
					throw new Error('argument type mismatch');
				}
			}

			return (varType as GenericTypeWrapper).generic;
		} else {
			throw new Error('can not call non callable');
		}
	}
}

interface LangRules {
	string: AST_String;
	number: AST_Number;
	bool: AST_Bool;
	identifier: AST_Identifier;
	type: TypeWrapper;
	typeAnnotation: AST_TypeAnnotation;
	typedIdentifier: AST_TypedIdentifier;
	functionDeclaration: AST_FunctionDeclaration;
	functionCall: AST_FunctionCall;

	atomicExpression: AST_Expression;

	// binary
	binaryExp: AST_Binary | AST_Expression;
	binaryMulDiv: AST_Binary | AST_Expression;
	binaryPlusMinus: AST_Binary | AST_Expression;
	binaryCompare: AST_Binary | AST_Expression;
	binaryBoolean: AST_Binary | AST_Expression;

	expression: AST_Expression;

	varRead: AST_VarRead;
	varWrite: AST_VarWrite;
	varDeclaration: AST_VarDeclaration;
	statement: AST_Statement;
	block: AST_Block;
}

const optW = P_UTILS.optionalWhitespace();
const w = P_UTILS.whitespace();

const lang = P.createLanguage<LangRules>({
	string: _ =>
		P.manyNotOf('"')
			.trim(P.string('"'))
			.node((x, range) => new AST_String(range, x))
			.describe('string'),
	number: _ =>
		P.or(
			P.sequenceMap((a, b, c) => Number(a + b + c), P_UTILS.digits(), P.string('.'), P_UTILS.digits()),
			P_UTILS.digits().map(x => Number(x)),
		)
			.node((x, range) => new AST_Number(range, x))
			.describe('number'),
	bool: _ =>
		P.or(P.string('true').result(true), P.string('false').result(false))
			.node((x, range) => new AST_Bool(range, x))
			.describe('bool'),

	identifier: (language, ref) =>
		P.regexp(/^[a-z_][a-z0-9_]*/i)
			.node((x, range) => new AST_Identifier(range, x))
			.describe('identifier'),
	type: (language, ref) =>
		P.or(
			P.sequenceMap(
				(_1, _2, subType, _3) => TypeOf(BaseType.CALLABLE, subType),
				P.string(BaseType.CALLABLE.toLowerCase()),
				P.string('<'),
				ref.type,
				P.string('>'),
			),
			P.string(BaseType.STRING.toLowerCase()).result(TypeOf(BaseType.STRING)),
			P.string(BaseType.NUMBER.toLowerCase()).result(TypeOf(BaseType.NUMBER)),
			P.string(BaseType.BOOL.toLowerCase()).result(TypeOf(BaseType.BOOL)),
			P.string(BaseType.NULL.toLowerCase()).result(TypeOf(BaseType.NULL)),
		).describe('type'),
	typeAnnotation: (language, ref) =>
		P.sequenceMap((_1, _2, _3, type) => type, optW, P.string(':'), optW, language.type).node((x, range) => new AST_TypeAnnotation(range, x)),
	typedIdentifier: (language, ref) => language.identifier.and(language.typeAnnotation).node((x, range) => new AST_TypedIdentifier(range, x[0], x[1])),

	functionDeclaration: (language, ref) =>
		P.sequence(
			P.string('fn'),
			w,
			language.identifier,
			optW,
			P.separateBy(language.typedIdentifier.trim(optW), P.string(',')).wrap(P.string('('), P.string(')')),
			language.typeAnnotation,
			optW,
			ref.block,
		).node((x, range) => new AST_FunctionDeclaration(range, x[2], x[4], x[5], x[7])),
	functionCall: (language, ref) =>
		P.sequence(language.identifier, P.separateBy(ref.expression.trim(optW), P.string(',')).wrap(P.string('('), P.string(')'))).node(
			(x, range) => new AST_FunctionCall(range, x[0], x[1]),
		),

	atomicExpression: (language, ref) =>
		P.or(language.string, language.number, language.bool, language.functionCall, ref.varRead, ref.expression.wrap(P.string('('), P.string(')'))),

	binaryExp: (language, ref) =>
		P_UTILS.binaryRightRange(P.string('^') as Parser<BinaryOperator>, language.atomicExpression, (range, a, b, c) => new AST_Binary(range, b, a, c)),
	binaryMulDiv: (language, ref) =>
		P_UTILS.binaryLeftRange(
			P.or(P.string('*'), P.string('/')) as Parser<BinaryOperator>,
			language.binaryExp,
			(range, a, b, c) => new AST_Binary(range, b, a, c),
		),
	binaryPlusMinus: (language, ref) =>
		P_UTILS.binaryLeftRange(
			P.or(P.string('+'), P.string('-')) as Parser<BinaryOperator>,
			language.binaryMulDiv,
			(range, a, b, c) => new AST_Binary(range, b, a, c),
		),
	binaryCompare: (language, ref) =>
		P_UTILS.binaryLeftRange(
			P.oneStringOf(ComparisonOperators) as Parser<BinaryOperator>,
			language.binaryPlusMinus,
			(range, a, b, c) => new AST_Binary(range, b, a, c),
		),
	binaryBoolean: (language, ref) =>
		P_UTILS.binaryLeftRange(
			P.or(P.string('&&'), P.string('||')) as Parser<BinaryOperator>,
			language.binaryCompare,
			(range, a, b, c) => new AST_Binary(range, b, a, c),
		),

	expression: (language, ref) => language.binaryBoolean,

	varRead: (language, ref) => language.identifier.node((x, range) => new AST_VarRead(range, x)),
	varWrite: (language, ref) =>
		P.sequence(language.identifier, optW, P.string('='), optW, language.expression).node((x, range) => new AST_VarWrite(range, x[0], x[4])),
	varDeclaration: (language, ref) =>
		P.sequence(P.string('var'), w, language.typedIdentifier, optW, P.string('='), optW, language.expression).node(
			(x, range) => new AST_VarDeclaration(range, x[2], x[6]),
		),

	statement: (language, ref) => P.or(language.varWrite, language.varDeclaration, language.functionDeclaration, language.expression),
	block: (language, ref) =>
		P.separateBy(
			P.sequenceMap((statement, _1, _2) => statement, language.statement, optW, P.string(';')),
			optW,
		)
			.trim(optW)
			.wrap(P.string('{'), P.string('}'))
			.node((x, range) => new AST_Block(range, x)),
});

export const interpreterParser = P.separateBy(
	P.sequenceMap((statement, _1, _2) => statement, lang.statement, optW, P.string(';')),
	optW,
)
	.trim(optW)
	.thenEof()
	.node((x, range) => new AST_Block(range, x));

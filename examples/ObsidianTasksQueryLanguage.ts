import { P } from '../src/ParsiNOM';
import { P_UTILS } from '../src/ParserUtils';
import { ParsingRange } from '../src/HelperTypes';

/*
 * This is a simplified version of the tasks query language.
 * Query expressions are oversimplified here, as the focus is on the combination operators.
 * A task in this proof of concept is simply a string.
 * The expression `abc` represents a query that results in the tasks `['a', 'b', 'c']`.
 * The combination operators (AND and OR) have the same precedence and are thus evaluated left to right.
 * The operations are parsed into an AST with additional positional information which isn't utilized here, but can be useful later.
 */

// in our simplified world, a task is a string
type Task = string;

/**
 * This represents a task expression, so a leaf in our AST.
 */
export class TaskQueryExpression {
	range: ParsingRange;
	tasks: Task[];

	constructor(range: ParsingRange, tasks: Task[]) {
		this.range = range;
		this.tasks = tasks;
	}

	evaluate(): Task[] {
		return this.tasks;
	}
}

export enum TaskExpressionOperator {
	AND = 'AND',
	OR = 'OR',
}

/**
 * This represents an operation such as AND, so a node in our AST.
 */
export class TaskExpressionOperation {
	range: ParsingRange;
	operator: TaskExpressionOperator;
	lhs: TaskASTElement;
	rhs: TaskASTElement;

	constructor(range: ParsingRange, operator: TaskExpressionOperator, lhs: TaskASTElement, rhs: TaskASTElement) {
		this.range = range;
		this.operator = operator;
		this.lhs = lhs;
		this.rhs = rhs;
	}

	evaluate(): Task[] {
		const lhsValue: Task[] = this.lhs.evaluate();
		const rhsValue: Task[] = this.rhs.evaluate();

		if (this.operator === TaskExpressionOperator.AND) {
			const ret: Task[] = [];
			// add all elements that are included in both
			for (const task of lhsValue) {
				if (rhsValue.includes(task)) {
					ret.push(task);
				}
			}
			return ret;
		} else if (this.operator === TaskExpressionOperator.OR) {
			// clone lhs
			const ret: Task[] = lhsValue.slice();
			// add all elements of rhs that are not already included
			for (const task of rhsValue) {
				if (!ret.includes(task)) {
					ret.push(task);
				}
			}
			return ret;
		} else {
			// should be unreachable
			return [];
		}
	}
}

type TaskASTElement = TaskQueryExpression | TaskExpressionOperation;

interface TasksQueryLanguageDef {
	expression: TaskQueryExpression;
	wrappedExpression: TaskQueryExpression | TaskExpressionOperation;

	operator: TaskExpressionOperator;
	operation: TaskQueryExpression | TaskExpressionOperation;
	parser: TaskQueryExpression | TaskExpressionOperation;
}

const TasksQueryLanguage = P.createLanguage<TasksQueryLanguageDef>({
	// an operator is any value of the TaskExpressionOperator enum
	operator: () => P.or(...Object.values(TaskExpressionOperator).map(x => P.string(x).result(x))),

	// an expression consists of a letter and then letters and parens
	expression: () =>
		P.or(
			P_UTILS.letter().atLeast(1),
			P.sequenceMap((_1, exp, _2) => exp, P.string('"'), P.noneOf('"').atLeast(1), P.string('"')),
		).node((value, range) => new TaskQueryExpression(range, value)),

	// a wrapped expression is either an expression with parens or an operation with parens
	// we use ref here, since we are referencing a parser that we only define later on
	wrappedExpression: (language, ref) => P.or(language.expression, ref.operation).trim(P_UTILS.optionalWhitespace()).wrap(P.string('('), P.string(')')),

	// an operation is a left associative binary expression
	operation: language =>
		P_UTILS.binaryLeftRange(language.operator, language.wrappedExpression, (range, a, b, c) => new TaskExpressionOperation(range, b, a, c)),

	// the entire parser is either an operation or an expression and then end of string
	parser: language => P.or(language.operation, language.expression).thenEof(),
});

export const ObsidianTasksQueryParser = TasksQueryLanguage.parser;

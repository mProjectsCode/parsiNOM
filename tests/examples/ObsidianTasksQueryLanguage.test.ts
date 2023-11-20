import { describe, test, expect } from 'bun:test';
import { ObsidianTasksQueryParser, TaskExpressionOperation, TaskExpressionOperator } from '../../examples/ObsidianTasksQueryLanguage';

describe('task query language', () => {
	test('single expression', () => {
		const result = ObsidianTasksQueryParser.tryParse('abc');

		expect(result.success).toBe(true);
		expect(result.value?.evaluate().sort()).toEqual(['a', 'b', 'c']);
	});

	test('single expression with parens', () => {
		const str = '(abc)';
		const result = ObsidianTasksQueryParser.tryParse(str);

		expect(result.success).toBe(true);
		expect(result.value?.evaluate().sort()).toEqual(['a', 'b', 'c']);
	});

	test('dual expression with AND', () => {
		const result = ObsidianTasksQueryParser.tryParse('(abc) AND (acd)');

		expect(result.success).toBe(true);
		expect(result.value?.evaluate().sort()).toEqual(['a', 'c']);
	});

	test('dual expression with OR', () => {
		const result = ObsidianTasksQueryParser.tryParse('(abc) OR (acd)');

		expect(result.success).toBe(true);
		expect(result.value?.evaluate().sort()).toEqual(['a', 'b', 'c', 'd']);
	});

	test('triple expression with AND', () => {
		const result = ObsidianTasksQueryParser.tryParse('(abc) AND (acd) AND (abd)');

		expect(result.success).toBe(true);
		expect(result.value?.evaluate().sort()).toEqual(['a']);
	});

	test('triple expression with OR', () => {
		const result = ObsidianTasksQueryParser.tryParse('(abc) OR (acd) OR (ade)');

		expect(result.success).toBe(true);
		expect(result.value?.evaluate().sort()).toEqual(['a', 'b', 'c', 'd', 'e']);
	});

	test('mixed expression with AND and OR', () => {
		const result = ObsidianTasksQueryParser.tryParse('(abc) AND (acd) OR (ae)');

		expect(result.success).toBe(true);
		// since AND and OR have the same precedence, they are parsed left to right. So AND should be the inner one and OR the outer one.
		expect(result.value).toBeInstanceOf(TaskExpressionOperation);
		// @ts-ignore
		expect(result.value?.operator).toBe(TaskExpressionOperator.OR);
		expect(result.value?.evaluate().sort()).toEqual(['a', 'c', 'e']);
	});

	test('mixed expression with AND and OR and parens', () => {
		const str = '(abc) AND ((acd) OR (be))';
		const result = ObsidianTasksQueryParser.tryParse(str);

		expect(result.success).toBe(true);
		// since OR is in parens, AND should be the outer one and OR the inner one.
		expect(result.value).toBeInstanceOf(TaskExpressionOperation);
		// @ts-ignore
		expect(result.value?.operator).toBe(TaskExpressionOperator.AND);
		expect(result.value?.evaluate().sort()).toEqual(['a', 'b', 'c']);
	});

	test('double paren', () => {
		const str = '((abc))';
		const result = ObsidianTasksQueryParser.tryParse(str);

		expect(result.success).toBe(true);
		expect(result.value?.evaluate().sort()).toEqual(['a', 'b', 'c']);
	});

	test('double paren AND', () => {
		const str = '((abc) AND (acd))';
		const result = ObsidianTasksQueryParser.tryParse(str);

		expect(result.success).toBe(true);
		expect(result.value?.evaluate().sort()).toEqual(['a', 'c']);
	});

	test('paren is an allowed character', () => {
		const str = '"ab(c)"';
		const result = ObsidianTasksQueryParser.tryParse(str);

		expect(result.success).toBe(true);
		expect(result.value?.evaluate().sort()).toEqual(['(', ')', 'a', 'b', 'c']);
	});

	test('parens inside AND', () => {
		const str = '( "ab(c)" ) AND ( c )';
		const result = ObsidianTasksQueryParser.tryParse(str);

		expect(result.success).toBe(true);
		expect(result.value?.evaluate().sort()).toEqual(['c']);
	});
});

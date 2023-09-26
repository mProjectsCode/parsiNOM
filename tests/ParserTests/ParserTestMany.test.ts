import { P } from '../../src/ParsiNOM';
import { ParserTestData, testParser, testParserAdvanced } from '../TestHelpers';
import { describe, test, expect } from 'bun:test';

describe.each([
	['', true],
	['a', true],
	['aa', true],
	['aaa', true],
	['abaa', false],
])(`many`, (str, shouldSucceed) => {
	const parser = P.string('a').many().thenEof();
	testParser(parser, str, shouldSucceed);
});

describe('many infinite loop', () => {
	test('infinite loop to throw error', () => {
		expect(() => {
			const parser = P.string('').many();
			parser.parse('foo');
		}).toThrow('infinite loop');
	});
});

describe.each<ParserTestData<string[]>>([
	{
		input: '',
		shouldSucceed: true,
		ast: [],
		toIndex: 0,
	},
	{
		input: 'a',
		shouldSucceed: true,
		ast: ['a'],
		toIndex: 1,
	},
	{
		input: 'aa',
		shouldSucceed: true,
		ast: ['a', 'a'],
		toIndex: 2,
	},
	{
		input: 'aaa',
		shouldSucceed: true,
		ast: ['a', 'a', 'a'],
		toIndex: 3,
	},
	{
		input: 'abaa',
		shouldSucceed: true,
		ast: ['a'],
		toIndex: 1,
	},
])(`many advanced`, data => {
	const parser = P.string('a').many();
	testParserAdvanced(parser, data);
});

describe.each<ParserTestData<string[]>>([
	{
		input: '',
		shouldSucceed: true,
		ast: [],
		toIndex: 0,
	},
	{
		input: 'this',
		shouldSucceed: true,
		ast: ['this'],
		toIndex: 4,
	},
	{
		input: 'thisthis',
		shouldSucceed: true,
		ast: ['this', 'this'],
		toIndex: 8,
	},
	{
		input: 'thisthisthis',
		shouldSucceed: true,
		ast: ['this', 'this', 'this'],
		toIndex: 12,
	},
	{
		input: 'thisfoothisthis',
		shouldSucceed: true,
		ast: ['this'],
		toIndex: 4,
	},
])(`many long string advanced`, data => {
	const parser = P.string('this').many();
	testParserAdvanced(parser, data);
});

import { P } from '../../src/ParsiNOM';
import { ParserTestData, testParser, testParserAdvanced } from '../TestHelpers';
import { describe } from 'bun:test';

describe.each([
	['', false],
	['this', true],
	['foo', false],
])(`describe`, (str, shouldSucceed) => {
	const parser = P.string('this').describe('some error');
	testParser(parser, str, shouldSucceed);
});

describe.each<ParserTestData<string>>([
	{
		input: '',
		shouldSucceed: false,
		furthest: 0,
		expected: ['some error'],
	},
	{
		input: 'foo',
		shouldSucceed: false,
		furthest: 0,
		expected: ['some error'],
	},
	{
		input: 'this',
		shouldSucceed: true,
		ast: 'this',
		toIndex: 4,
	},
])(`describe advanced`, data => {
	const parser = P.string('this').describe('some error');
	testParserAdvanced(parser, data);
});

describe.each<ParserTestData<string[]>>([
	{
		input: '',
		shouldSucceed: false,
		furthest: 0,
		expected: ['some error'],
	},
	{
		input: 'this',
		shouldSucceed: false,
		furthest: 4,
		expected: ['some error'],
	},
	{
		input: 'that',
		shouldSucceed: false,
		furthest: 0,
		expected: ['some error'],
	},
	{
		input: 'thisthat',
		shouldSucceed: true,
		ast: ['this', 'that'],
		toIndex: 8,
	},
	{
		input: 'thisthatfoo',
		shouldSucceed: true,
		ast: ['this', 'that'],
		toIndex: 8,
	},
	{
		input: 'foo',
		shouldSucceed: false,
		furthest: 0,
		expected: ['some error'],
	},
])(`describe sequence advanced`, data => {
	const parser = P.sequence(P.string('this'), P.string('that')).describe('some error');
	testParserAdvanced(parser, data);
});

describe.each<ParserTestData<[[string[], string] | undefined, string]>>([
	{
		input: 'aaaaa',
		shouldSucceed: false,
		furthest: 5,
		expected: ['some error', "'b'"],
	},
	{
		input: 'aab',
		shouldSucceed: false,
		furthest: 3,
		expected: ["'c'"],
	},
	{
		input: 'c',
		shouldSucceed: true,
		ast: [undefined, 'c'],
		toIndex: 1,
	},
	{
		input: 'aabc',
		shouldSucceed: true,
		ast: [[['a', 'a'], 'b'], 'c'],
		toIndex: 4,
	},
])(`describe multiple errors advanced`, data => {
	const parser = P.sequence(P.sequence(P.string('a').many().describe('some error'), P.string('b')).optional(), P.string('c'));
	testParserAdvanced(parser, data);
});

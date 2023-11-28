import { P } from '../../src/ParsiNOM';
import { ParserTestData, testParser, testParserAdvanced } from '../TestHelpers';
import { describe } from 'bun:test';

describe.each([
	['', false],
	['this', true],
	['foo', false],
])(`box`, (str, shouldSucceed) => {
	const parser = P.string('this').box('some error');
	testParser(parser, str, shouldSucceed);
});

describe.each<ParserTestData<string>>([
	{
		input: '',
		shouldSucceed: false,
		furthest: 0,
		expected: [`('this' as part of something)`],
	},
	{
		input: 'foo',
		shouldSucceed: false,
		furthest: 0,
		expected: [`('this' as part of something)`],
	},
	{
		input: 'this',
		shouldSucceed: true,
		ast: 'this',
		toIndex: 4,
	},
])(`box advanced`, data => {
	const parser = P.string('this').box('something');
	testParserAdvanced(parser, data);
});

describe.each<ParserTestData<string[]>>([
	{
		input: '',
		shouldSucceed: false,
		furthest: 0,
		expected: [`('this' as part of something)`],
	},
	{
		input: 'this',
		shouldSucceed: false,
		furthest: 4,
		expected: [`('that' as part of something)`],
	},
	{
		input: 'that',
		shouldSucceed: false,
		furthest: 0,
		expected: [`('this' as part of something)`],
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
		expected: [`('this' as part of something)`],
	},
])(`box sequence advanced`, data => {
	const parser = P.sequence(P.string('this'), P.string('that')).box('something');
	testParserAdvanced(parser, data);
});

describe.each<ParserTestData<[[string[], string] | undefined, string]>>([
	{
		input: 'aaaaa',
		shouldSucceed: false,
		furthest: 5,
		expected: [`('a' as part of many 'a's)`, "('b' as part of the end of the 'a's)"],
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
])(`box multiple errors advanced`, data => {
	const parser = P.sequence(P.sequence(P.string('a').many().box("many 'a's"), P.string('b').box("the end of the 'a's")).optional(), P.string('c'));
	testParserAdvanced(parser, data);
});

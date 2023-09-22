import { P } from '../../src/ParsiNOM';
import { P_UTILS } from '../../src/ParserUtils';
import { ParserTestData, testParser, testParserAdvanced } from '../TestHelpers';

describe.each([
	['', false],
	['this', false],
	['that', false],
	['thisthat', true],
	['thisthatfoo', false],
	['foo', false],
])(`sequence`, (str, shouldSucceed) => {
	const parser = P.sequence(P.string('this'), P.string('that'), P_UTILS.eof());
	testParser(parser, str, shouldSucceed);
});

describe.each<ParserTestData<[string, string]>>([
	{
		input: '',
		shouldSucceed: false,
		furthest: 0,
		expected: ["'this'"],
	},
	{
		input: 'this',
		shouldSucceed: false,
		furthest: 4,
		expected: ["'that'"],
	},
	{
		input: 'that',
		shouldSucceed: false,
		furthest: 0,
		expected: ["'this'"],
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
		expected: ["'this'"],
	},
])(`sequence advanced`, data => {
	const parser = P.sequence(P.string('this'), P.string('that'));
	testParserAdvanced(parser, data);
});

import { P } from '../../src/ParsiNOM';
import { ParserTestData, testParser, testParserAdvanced } from '../TestHelpers';
import { describe } from 'bun:test';

describe.each([
	['', false],
	['this', true],
	['thisfoo', true],
	['thisthat', false],
	['that', false],
	['thatthis', false],
	['foo', false],
])(`notFollowedBy`, (str, shouldSucceed) => {
	const parser = P.string('this').namedMarker('before').notFollowedBy(P.string('that')).namedMarker('after');
	testParser(parser, str, shouldSucceed);
});

describe.each<ParserTestData<string>>([
	{
		input: '',
		shouldSucceed: false,
		furthest: 0,
		expected: ["'this'"],
	},
	{
		input: 'this',
		shouldSucceed: true,
		ast: 'this',
		toIndex: 4,
	},
	{
		input: 'thisfoo',
		shouldSucceed: true,
		ast: 'this',
		toIndex: 4,
	},
	{
		input: 'thisthat',
		shouldSucceed: false,
		furthest: 4,
		expected: ["not 'that'"],
	},
	{
		input: 'that',
		shouldSucceed: false,
		furthest: 0,
		expected: ["'this'"],
	},
	{
		input: 'thatthis',
		shouldSucceed: false,
		furthest: 0,
		expected: ["'this'"],
	},
	{
		input: 'foo',
		shouldSucceed: false,
		furthest: 0,
		expected: ["'this'"],
	},
])(`notFollowedBy advanced`, data => {
	const parser = P.string('this').notFollowedBy(P.string('that'));
	testParserAdvanced(parser, data);
});

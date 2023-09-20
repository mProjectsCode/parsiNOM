import { ParserTestData, testParserAdvanced } from '../TestHelpers';
import { P } from '../../src/ParsiNOM';

describe.each<ParserTestData<string>>([
	{
		input: '',
		shouldSucceed: false,
		furthest: 0,
		expected: ["'_'"],
	},
	{
		input: '_',
		shouldSucceed: false,
		furthest: 1,
		expected: ["'a'"],
	},
	{
		input: '_a',
		shouldSucceed: false,
		furthest: 2,
		expected: ["'a'", "'b'", "'c'", "'d'"],
	},
	{
		input: '_aa',
		shouldSucceed: false,
		furthest: 3,
		expected: ["'a'", "'b'", "'c'", "'d'"],
	},
	{
		input: '_ab',
		shouldSucceed: false,
		furthest: 3,
		expected: ["'a'"],
	},
	{
		input: '_ac',
		shouldSucceed: false,
		furthest: 3,
		expected: ["'a'"],
	},
	{
		input: '_ad',
		shouldSucceed: false,
		furthest: 3,
		expected: ["'a'"],
	},
	{
		input: '_aaa',
		shouldSucceed: false,
		furthest: 4,
		expected: ["'a'", "'b'", "'c'", "'d'"],
	},
	{
		input: '_aaba',
		shouldSucceed: true,
		ast: 'aa',
		toIndex: 5,
	},
])(`memorize advanced`, data => {
	const memoParser = P.string('a')
		.atLeast(1)
		.map(x => x.join(''))
		.memorize();
	const parser = P.string('_')
		.then(P.or(memoParser.skip(P.string('b')), memoParser.skip(P.string('c')), memoParser.skip(P.string('d'))))
		.skip(memoParser);

	// since bun test doesn't support it yet, we sadly can't test if memorize actually caches the parser runs
	// TODO: a solution would be a custom parser (P.custom()) that counts the times it has been called.

	testParserAdvanced(parser, data);
});

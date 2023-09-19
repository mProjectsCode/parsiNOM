import { P } from '../../src/ParsiNOM';
import { ParserTestData, testParser, testParserAdvanced } from '../TestHelpers';
describe.each([
	['', false],
	['this', true],
	['that', true],
	['thisthat', false],
	['thatthis', false],
	['foo', false],
])(`or '%s'`, (str, shouldSucceed) => {
	const parser = P.or(P.string('this'), P.string('that')).thenEof();
	testParser(parser, str, shouldSucceed);
});

describe.each<ParserTestData<string>>([
	{
		input: '',
		shouldSucceed: false,
		furthest: 0,
		expected: ["'this'", "'that'"],
	},
	{
		input: 'this',
		shouldSucceed: true,
		ast: 'this',
		toIndex: 4,
	},
	{
		input: 'that',
		shouldSucceed: true,
		ast: 'that',
		toIndex: 4,
	},
	{
		input: 'foo',
		shouldSucceed: false,
		furthest: 0,
		expected: ["'this'", "'that'"],
	},
])(`or advanced`, data => {
	const parser = P.or(P.string('this'), P.string('that'));
	testParserAdvanced(parser, data);
});

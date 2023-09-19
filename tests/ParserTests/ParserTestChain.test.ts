import { P } from '../../src/ParsiNOM';
import { P_UTILS } from '../../src/ParserUtils';
import { ParserTestData, testParser, testParserAdvanced } from '../TestHelpers';
describe.each([
	['', false],
	['thisthat', true],
	['1bar', true],
	['thisbar', false],
	['1that', false],
	['this', false],
	['1', false],
	['thatthis', false],
	['foo', false],
])(`chain '%s'`, (str, shouldSucceed) => {
	const parser = P.string('this')
		.or(P_UTILS.digit().map(x => Number(x)))
		.chain(res => {
			if (typeof res === 'string') {
				return P.string('that');
			} else {
				return P.string('bar');
			}
		})
		.thenEof();
	testParser(parser, str, shouldSucceed);
});

describe.each<ParserTestData<string>>([
	{
		input: '',
		shouldSucceed: false,
		furthest: 0,
		expected: ['a digit', "'this'"],
	},
	{
		input: 'thisthat',
		shouldSucceed: true,
		ast: 'that',
		toIndex: 8,
	},
	{
		input: '1bar',
		shouldSucceed: true,
		ast: 'bar',
		toIndex: 4,
	},
	{
		input: 'thisbar',
		shouldSucceed: false,
		furthest: 4,
		expected: ["'that'"],
	},
	{
		input: '1that',
		shouldSucceed: false,
		furthest: 1,
		expected: ["'bar'"],
	},
	{
		input: 'this',
		shouldSucceed: false,
		furthest: 4,
		expected: ["'that'"],
	},
	{
		input: '1',
		shouldSucceed: false,
		furthest: 1,
		expected: ["'bar'"],
	},
	{
		input: 'foo',
		shouldSucceed: false,
		furthest: 0,
		expected: ['a digit', "'this'"],
	},
])(`chain advanced`, data => {
	const parser = P.string('this')
		.or(P_UTILS.digit().map(x => Number(x)))
		.chain(res => {
			if (typeof res === 'string') {
				return P.string('that');
			} else {
				return P.string('bar');
			}
		})
		.thenEof();
	testParserAdvanced(parser, data);
});

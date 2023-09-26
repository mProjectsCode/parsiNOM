import { P_UTILS } from '../../src/ParserUtils';
import { testParser } from '../TestHelpers';
import { describe } from 'bun:test';

describe.each([
	['', false],
	[' ', true],
	['\n', true],
	['\r', true],
	['\r\n', true],
	['\r\n  \n', true],
	['b', false],
])(`whitespace`, (str, shouldSucceed) => {
	const parser = P_UTILS.whitespace().thenEof();
	testParser(parser, str, shouldSucceed);
});

describe.each([
	['', true],
	[' ', true],
	['\n', true],
	['\r', true],
	['\r\n', true],
	['\r\n  \n', true],
	['b', false],
])(`optional whitespace`, (str, shouldSucceed) => {
	const parser = P_UTILS.optionalWhitespace().thenEof();
	testParser(parser, str, shouldSucceed);
});

describe.each([
	['', false],
	[' ', false],
	['\n', true],
	['\r', true],
	['\r\n', true],
	['\r\n  \n', false],
	['b', false],
])(`newline`, (str, shouldSucceed) => {
	const parser = P_UTILS.newline().thenEof();
	testParser(parser, str, shouldSucceed);
});

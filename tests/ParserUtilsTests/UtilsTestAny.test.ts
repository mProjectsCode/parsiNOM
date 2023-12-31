import { P_UTILS } from '../../src/ParserUtils';
import { testParser } from '../TestHelpers';
import { describe } from 'bun:test';

describe.each([
	['', false],
	['a', true],
	['b', true],
	[' ', true],
	['\n', true],
])(`any`, (str, shouldSucceed) => {
	const parser = P_UTILS.any();
	testParser(parser, str, shouldSucceed);
});

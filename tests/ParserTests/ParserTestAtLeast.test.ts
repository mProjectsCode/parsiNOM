import { P } from '../../src/ParsiNOM';
import { testParser } from '../TestHelpers';
import { describe } from 'bun:test';

describe.each([
	['', false],
	['a', false],
	['aa', true],
	['aaa', true],
	['abaa', false],
])(`atLeast`, (str, shouldSucceed) => {
	const parser = P.string('a').atLeast(2).thenEof();
	testParser(parser, str, shouldSucceed);
});

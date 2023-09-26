import { P } from '../../src/ParsiNOM';
import { testParser } from '../TestHelpers';
import { describe } from 'bun:test';

describe.each([
	['', false],
	['this', true],
	['thisthat', false],
	['foo', false],
])(`thenEof`, (str, shouldSucceed) => {
	const parser = P.string('this').thenEof();
	testParser(parser, str, shouldSucceed);
});

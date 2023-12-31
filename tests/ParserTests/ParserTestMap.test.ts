import { P } from '../../src/ParsiNOM';
import { testParser } from '../TestHelpers';
import { describe } from 'bun:test';

describe.each([
	['', false],
	['this', true],
	['foo', false],
])(`map`, (str, shouldSucceed) => {
	const parser = P.string('this')
		.map(x => x + ' is the result')
		.thenEof();
	testParser(parser, str, shouldSucceed);
});

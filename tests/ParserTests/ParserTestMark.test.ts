import { P } from '../../src/ParsiNOM';
import { testParser } from '../TestHelpers';
import { describe } from 'bun:test';

describe.each([
	['', false],
	['this', true],
	['foo', false],
])(`mark`, (str, shouldSucceed) => {
	const parser = P.string('this').marker().thenEof();
	testParser(parser, str, shouldSucceed);
});

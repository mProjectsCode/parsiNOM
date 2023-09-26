import { P } from '../../src/ParsiNOM';
import { testParser } from '../TestHelpers';
import { describe } from 'bun:test';

describe.each([
	['', true],
	['this', true],
	['this,this', true],
	['this,this,this', true],
	['this, this', false],
	['foo', false],
])(`separateBy`, (str, shouldSucceed) => {
	const parser = P.string('this').separateBy(P.string(',')).thenEof();
	testParser(parser, str, shouldSucceed);
});

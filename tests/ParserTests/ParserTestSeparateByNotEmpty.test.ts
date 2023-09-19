import { P } from '../../src/ParsiNOM';
import { testParser } from '../TestHelpers';
describe.each([
	['', false],
	['this', true],
	['this,this', true],
	['this,this,this', true],
	['this, this', false],
	['foo', false],
])(`separateByNotEmpty '%s'`, (str, shouldSucceed) => {
	const parser = P.string('this').separateByNotEmpty(P.string(',')).thenEof();
	testParser(parser, str, shouldSucceed);
});

import { P } from '../../src/ParsiNOM';
import {testParser} from '../TestHelpers';
describe.each([
	['', true],
	['this', true],
	['this,this', true],
	['this,this,this', true],
	['this, this', false],
	['foo', false],
])(`separateBy '%s'`, (str, shouldSucceed) => {
	const parser = P.separateBy(P.string('this'), P.string(',')).thenEof();
	testParser(parser, str, shouldSucceed);
});

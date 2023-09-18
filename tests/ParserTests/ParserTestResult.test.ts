import { P } from '../../src/ParsiNOM';
import {testParser} from '../TestHelpers';
describe.each([
	['', false],
	['this', true],
	['foo', false],
])(`result '%s'`, (str, shouldSucceed) => {
	const parser = P.string('this').result('result').thenEof();
	testParser(parser, str, shouldSucceed);
});

import { P } from '../../src/ParsiNOM';
import { testParser } from '../TestHelpers';
describe.each([
	['', false],
	['this', true],
	['foo', false],
])(`mark '%s'`, (str, shouldSucceed) => {
	const parser = P.string('this').marker().thenEof();
	testParser(parser, str, shouldSucceed);
});

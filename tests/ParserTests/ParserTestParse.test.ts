import { P } from '../../src/ParsiNOM';
import { testParser } from '../TestHelpers';
describe.each([
	['', false],
	['this', true],
	['that', false],
])(`parse '%s'`, (str, shouldSucceed) => {
	const parser = P.string('this').thenEof();
	testParser(parser, str, shouldSucceed);
});

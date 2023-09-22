import { P } from '../../src/ParsiNOM';
import { testParser } from '../TestHelpers';

describe.each([
	['', false],
	['this', true],
	['foo', false],
])(`describe`, (str, shouldSucceed) => {
	const parser = P.string('this').describe('some error').thenEof();
	testParser(parser, str, shouldSucceed);
});

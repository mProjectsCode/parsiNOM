import { P } from '../../src/ParsiNOM';
import { testParser } from '../TestHelpers';
describe.each([
	['', false],
	['a', true],
	['b', true],
	['c', true],
	['afoo', true],
	['foo', false],
])(`oneStringOf`, (str, shouldSucceed) => {
	const parser = P.oneStringOf(['a', 'b', 'c']);
	testParser(parser, str, shouldSucceed);
});

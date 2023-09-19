import { P } from '../../src/ParsiNOM';
import { testParser } from '../TestHelpers';
describe.each([
	['', true],
	['a', true],
	['aa', true],
	['aab', true],
	['baa', true],
	['foo', true],
])(`sequence '%s'`, (str, shouldSucceed) => {
	const parser = P.takeWhile(char => char === 'a');
	testParser(parser, str, shouldSucceed);
});

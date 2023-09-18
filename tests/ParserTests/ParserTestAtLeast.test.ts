import { P } from '../../src/ParsiNOM';
import {testParser} from '../TestHelpers';
describe.each([
	['', false],
	['a', false],
	['aa', true],
	['aaa', true],
	['abaa', false],
])(`atLeast '%s'`, (str, shouldSucceed) => {
	const parser = P.string('a').atLeast(2).thenEof();
	testParser(parser, str, shouldSucceed);
});

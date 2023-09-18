import { P } from '../../src/ParsiNOM';
import {testParser} from '../TestHelpers';
describe.each([
	['', true],
	['a', true],
	['aa', true],
	['aaa', false],
	['abaa', false],
])(`atMost '%s'`, (str, shouldSucceed) => {
	const parser = P.string('a').atMost(2).thenEof();
	testParser(parser, str, shouldSucceed);
});

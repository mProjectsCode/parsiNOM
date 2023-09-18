import { P_UTILS } from '../../src/ParserUtils';
import {testParser} from '../TestHelpers';
describe.each([
	['', false],
	['a', true],
	['b', true],
	[' ', true],
	['\n', true],
])(`any '%s'`, (str, shouldSucceed) => {
	const parser = P_UTILS.any();
	testParser(parser, str, shouldSucceed);
});

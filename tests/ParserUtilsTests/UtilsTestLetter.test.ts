import { P_UTILS } from '../../src/ParserUtils';
import {testParser} from '../TestHelpers';
describe.each([
	['a', true],
	['b', true],
	['z', true],
	['#', false],
	[' ', false],
	['', false],
])(`letter '%s'`, (str, shouldSucceed) => {
	const parser = P_UTILS.letter();
	testParser(parser, str, shouldSucceed);
});

describe.each([
	['a', true],
	['bb', true],
	['zz', true],
	['#', false],
	[' ', false],
	['', false],
])(`letters '%s'`, (str, shouldSucceed) => {
	const parser = P_UTILS.letters();
	testParser(parser, str, shouldSucceed);
});

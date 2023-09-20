import { P_UTILS } from '../../src/ParserUtils';
import { testParser } from '../TestHelpers';
describe.each([
	['0', true],
	['2', true],
	['9', true],
	['a', false],
	['a1', false],
])(`digit`, (str, shouldSucceed) => {
	const parser = P_UTILS.digit();
	testParser(parser, str, shouldSucceed);
});

describe.each([
	['0', true],
	['22', true],
	['99', true],
	['a', false],
	['a12', false],
])(`digits`, (str, shouldSucceed) => {
	const parser = P_UTILS.digits();
	testParser(parser, str, shouldSucceed);
});

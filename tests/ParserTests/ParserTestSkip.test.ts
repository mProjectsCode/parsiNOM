import { P } from '../../src/ParsiNOM';
import { P_UTILS } from '../../src/ParserUtils';
import { testParser } from '../TestHelpers';
import { describe } from 'bun:test';

describe.each([
	['', false],
	['this', true],
	['foo', false],
])(`skip`, (str, shouldSucceed) => {
	const parser = P.string('this').skip(P_UTILS.eof());
	testParser(parser, str, shouldSucceed);
});

import { P } from '../../src/ParsiNOM';
import { P_UTILS } from '../../src/ParserUtils';
import { testParser } from '../TestHelpers';

describe.each([
	['', false],
	['a', true],
	['aa', true],
	['aba', true],
	['baba', false],
])(`remaining`, (str, shouldSucceed) => {
	const parser = P.string('a').then(P_UTILS.remaining()).thenEof();
	testParser(parser, str, shouldSucceed);
});

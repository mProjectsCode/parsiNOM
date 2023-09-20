import { P } from '../../src/ParsiNOM';
import { P_UTILS } from '../../src/ParserUtils';
import { testParser } from '../TestHelpers';
describe.each([
	['', false],
	['a', true],
	['aa', false],
])(`eof`, (str, shouldSucceed) => {
	const parser = P.string('a').then(P_UTILS.eof());
	testParser(parser, str, shouldSucceed);
});

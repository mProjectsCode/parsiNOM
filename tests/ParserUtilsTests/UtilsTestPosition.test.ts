import { P } from '../../src/ParsiNOM';
import { P_UTILS } from '../../src/ParserUtils';
import { testParser } from '../TestHelpers';
describe.each([
	['a', true],
	['b', true],
	['aab', true],
	['a\nab', true],
])(`position`, (str, shouldSucceed) => {
	const parser = P.takeWhile(char => char !== 'b').then(P_UTILS.position());
	testParser(parser, str, shouldSucceed);
});

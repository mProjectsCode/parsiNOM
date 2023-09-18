import { P } from '../../src/ParsiNOM';
import { P_UTILS } from '../../src/ParserUtils';
import {testParser} from '../TestHelpers';
describe.each([
	['', false],
	['thisthat', true],
	['1bar', true],
	['thisbar', false],
	['1that', false],
	['this', false],
	['1', false],
	['thatthis', false],
	['foo', false],
])(`chain '%s'`, (str, shouldSucceed) => {
	const parser = P.string('this')
		.or(P_UTILS.digit().map(x => Number(x)))
		.chain(res => {
			if (typeof res === 'string') {
				return P.string('that');
			} else {
				return P.string('bar');
			}
		})
		.thenEof();
	testParser(parser, str, shouldSucceed);
});

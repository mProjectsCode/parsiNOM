import { P } from '../../src/ParsiNOM';
import {testParser} from '../TestHelpers';
describe.each([
	['', false],
	['this', true],
	['that', true],
	['thisthat', false],
	['thatthis', false],
	['foo', false],
])(`or '%s'`, (str, shouldSucceed) => {
	const parser = P.or(P.string('this'), P.string('that')).thenEof();
	testParser(parser, str, shouldSucceed);
});

import { P } from '../../src/ParsiNOM';
import { testParser } from '../TestHelpers';
describe.each([
	['', false],
	['this', true],
	['that', true],
	['thisthat', false],
	['thatthis', false],
	['foo', false],
])(`or`, (str, shouldSucceed) => {
	const parser = P.string('this').or(P.string('that')).thenEof();
	testParser(parser, str, shouldSucceed);
});

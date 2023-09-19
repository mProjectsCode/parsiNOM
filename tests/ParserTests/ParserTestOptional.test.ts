import { P } from '../../src/ParsiNOM';
import { testParser } from '../TestHelpers';
describe.each([
	['', false],
	['this', true],
	['thisthat', true],
	['that', false],
	['thatthis', false],
	['foo', false],
])(`optional value '%s'`, (str, shouldSucceed) => {
	const parser = P.string('this').then(P.string('that').optional()).thenEof();
	testParser(parser, str, shouldSucceed);
});

describe.each([
	['', false],
	['this', true],
	['thisthat', true],
	['that', false],
	['thatthis', false],
	['foo', false],
])(`optional no value '%s'`, (str, shouldSucceed) => {
	const parser = P.string('this').then(P.string('that').optional('some fallback')).thenEof();
	testParser(parser, str, shouldSucceed);
});

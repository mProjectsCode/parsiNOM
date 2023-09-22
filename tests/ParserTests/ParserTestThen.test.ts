import { P } from '../../src/ParsiNOM';
import { testParser } from '../TestHelpers';

describe.each([
	['', false],
	['thisthat', true],
	['this', false],
	['that', false],
	['thatthis', false],
	['foo', false],
])(`then`, (str, shouldSucceed) => {
	const parser = P.string('this').then(P.string('that')).thenEof();
	testParser(parser, str, shouldSucceed);
});

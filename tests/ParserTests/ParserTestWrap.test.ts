import { P } from '../../src/ParsiNOM';
import { testParser } from '../TestHelpers';
describe.each([
	['', false],
	['(this)', true],
	['this)', false],
	['(this', false],
	[')this(', false],
	['foo', false],
])(`wrap '%s'`, (str, shouldSucceed) => {
	const parser = P.string('this').wrap(P.string('('), P.string(')')).thenEof();
	testParser(parser, str, shouldSucceed);
});

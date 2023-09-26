import { P } from '../../src/ParsiNOM';
import { P_UTILS } from '../../src/ParserUtils';
import { testParser } from '../TestHelpers';
import { describe } from 'bun:test';

describe.each([
	['', false],
	[' this ', true],
	['this ', false],
	[' this', false],
	['  this', false],
	['foo', false],
])(`trim fixed length`, (str, shouldSucceed) => {
	const parser = P.string('this').trim(P.string(' ')).thenEof();
	testParser(parser, str, shouldSucceed);
});

describe.each([
	['', false],
	[' this ', true],
	['this ', true],
	[' this', true],
	['  this', true],
	['foo', false],
])(`trim variable length`, (str, shouldSucceed) => {
	const parser = P.string('this').trim(P_UTILS.optionalWhitespace()).thenEof();
	testParser(parser, str, shouldSucceed);
});

import { P } from '../../src/ParsiNOM';
import { P_UTILS } from '../../src/ParserUtils';
import { testParser } from '../TestHelpers';
import { describe } from 'bun:test';

describe.each([
	['', false],
	['this', false],
	['that', false],
	['thisthat', true],
	['thisthatfoo', false],
	['foo', false],
])(`sequenceMap`, (str, shouldSucceed) => {
	const parser = P.sequenceMap((...a) => a.join(''), P.string('this'), P.string('that'), P_UTILS.eof());
	testParser(parser, str, shouldSucceed);
});

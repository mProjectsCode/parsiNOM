import { P } from '../../src/ParsiNOM';
import { testParser } from '../TestHelpers';
import { describe } from 'bun:test';

describe.each([
	['', false],
	['this', false],
	['that', false],
	['thisthat', false],
	['thisthatfoo', false],
	['foo', false],
])(`fail`, (str, shouldSucceed) => {
	const parser = P.fail('expected');
	testParser(parser, str, shouldSucceed);
});

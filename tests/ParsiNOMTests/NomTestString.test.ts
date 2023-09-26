import { P } from '../../src/ParsiNOM';
import { testParser } from '../TestHelpers';
import { describe } from 'bun:test';

describe.each([
	['', false],
	['this', true],
	['thisthat', true],
	['foo', false],
])(`string`, (str, shouldSucceed) => {
	const parser = P.string('this');
	testParser(parser, str, shouldSucceed);
});

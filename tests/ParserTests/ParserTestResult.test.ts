import { P } from '../../src/ParsiNOM';
import { testParser } from '../TestHelpers';
import { describe } from 'bun:test';

describe.each([
	['', false],
	['this', true],
	['foo', false],
])(`result`, (str, shouldSucceed) => {
	const parser = P.string('this').result('result').thenEof();
	testParser(parser, str, shouldSucceed);
});

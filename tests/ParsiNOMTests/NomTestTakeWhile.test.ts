import { P } from '../../src/ParsiNOM';
import { testParser } from '../TestHelpers';
import { describe } from 'bun:test';

describe.each([
	['', true],
	['a', true],
	['aa', true],
	['aab', true],
	['baa', true],
	['foo', true],
])(`sequence`, (str, shouldSucceed) => {
	const parser = P.takeWhile(char => char === 'a');
	testParser(parser, str, shouldSucceed);
});

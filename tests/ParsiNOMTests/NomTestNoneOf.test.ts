import { P } from '../../src/ParsiNOM';
import { testParser } from '../TestHelpers';
describe.each([
	['', false],
	['a', false],
	['b', false],
	['c', false],
	['afoo', false],
	['foo', true],
])(`noneOf`, (str, shouldSucceed) => {
	const parser = P.noneOf('abc');
	testParser(parser, str, shouldSucceed);
});

describe.each([
	['', true],
	['a', true],
	['b', true],
	['c', true],
	['abcabc', true],
	['afoo', true],
	['foo', true],
	['fooa', true],
])(`manyNotOf`, (str, shouldSucceed) => {
	const parser = P.manyNotOf('abc');
	testParser(parser, str, shouldSucceed);
});

import { P } from '../../src/ParsiNOM';
import {testParser} from '../TestHelpers';
describe.each([
	['', false],
	['a', true],
	['b', true],
	['c', true],
	['afoo', true],
	['foo', false],
])(`oneOf '%s'`, (str, shouldSucceed) => {
	const parser = P.oneOf('abc');
	testParser(parser, str, shouldSucceed);
});

describe.each([
	['', true],
	['a', true],
	['b', true],
	['c', true],
	['aa', true],
	['abcabc', true],
	['afoo', true],
	['bafoo', true],
	['foo', true],
])(`manyOf '%s'`, (str, shouldSucceed) => {
	const parser = P.manyOf('abc');
	testParser(parser, str, shouldSucceed);
});

import { P_UTILS } from '../../src/ParserUtils';
import { testParser } from '../TestHelpers';
import { describe } from 'bun:test';

describe.each([
	['a', true],
	['b', true],
	['z', true],
	['こ', false],
	['你', false],
	['#', false],
	[' ', false],
	['', false],
])(`letter`, (str, shouldSucceed) => {
	const parser = P_UTILS.letter().thenEof();
	testParser(parser, str, shouldSucceed);
});

describe.each([
	['a', true],
	['bb', true],
	['zz', true],
	['こんにちは', false],
	['你叫什么名字', false],
	['#', false],
	[' ', false],
	['', false],
])(`letters`, (str, shouldSucceed) => {
	const parser = P_UTILS.letters().thenEof();
	testParser(parser, str, shouldSucceed);
});

describe.each([
	['a', true],
	['b', true],
	['z', true],
	['こ', true],
	['你', true],
	['#', false],
	[' ', false],
	['', false],
])(`unicodeLetter`, (str, shouldSucceed) => {
	const parser = P_UTILS.unicodeLetter().thenEof();
	testParser(parser, str, shouldSucceed);
});

describe.each([
	['a', true],
	['bb', true],
	['zz', true],
	['こんにちは', true],
	['你叫什么名字', true],
	['#', false],
	[' ', false],
	['', false],
])(`unicodeLetters`, (str, shouldSucceed) => {
	const parser = P_UTILS.unicodeLetters().thenEof();
	testParser(parser, str, shouldSucceed);
});

describe.each([
	['a', true],
	['b', true],
	['z', true],
	['こ', true],
	['你', true],
	['1', true],
	['#', false],
	[' ', false],
	['', false],
])(`unicodeAlphanumeric`, (str, shouldSucceed) => {
	const parser = P_UTILS.unicodeAlphanumeric().thenEof();
	testParser(parser, str, shouldSucceed);
});

describe.each([
	['a', true],
	['bb', true],
	['zz', true],
	['こんにちは', true],
	['你叫什么名字', true],
	['こんにちは123', true],
	['你叫什么名字123', true],
	['#', false],
	[' ', false],
	['', false],
])(`unicodeAlphanumeric`, (str, shouldSucceed) => {
	const parser = P_UTILS.unicodeAlphanumerics().thenEof();
	testParser(parser, str, shouldSucceed);
});

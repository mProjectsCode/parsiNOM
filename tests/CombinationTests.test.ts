import { P } from '../src/ParsiNOM';
import { P_UTILS } from '../src/ParserUtils';
import { testParser } from './TestHelpers';

describe.each([
	['', true],
	['ab', true],
	['abab', true],
	['a', false],
	['aa', false],
	['aba', false],
	['baba', false],
	['bcaba', false],
])(`sequence many '%s'`, (str, shouldSucceed) => {
	const parser = P.sequence(P.string('a'), P.string('b')).many().thenEof();
	testParser(parser, str, shouldSucceed);
});

describe.each([
	['', false],
	['a', false],
	['b', false],
	['bab', true],
	['ba b', true],
	['ba  b', true],
	['b ab', true],
	['b  a b', true],
	['b abb', false],
	['bcaba', false],
])(`sequence trim '%s'`, (str, shouldSucceed) => {
	const parser = P.sequence(P.string('b'), P.string('a').trim(P_UTILS.optionalWhitespace()), P.string('b')).thenEof();
	testParser(parser, str, shouldSucceed);
});

describe.each([
	['', false],
	['thisfoo', true],
	['thatfoo', true],
	['foo', false],
	['this', false],
	['that', false],
	['bar', false],
])(`sequence or '%s'`, (str, shouldSucceed) => {
	const parser = P.sequence(P.or(P.string('this'), P.string('that')), P.string('foo'));
	testParser(parser, str, shouldSucceed);
});

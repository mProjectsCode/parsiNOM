import { P, P_UTILS } from '../src/Helpers';
import { testParse } from './TestHelpers';

describe('single string', () => {
	const parser = P.string('aba').skip(P.eof);
	const matchingTable: [string, boolean][] = [
		['aba', true],
		['a', false],
		['ab', false],
		['abab', false],
		['ababa', false],
	];

	for (const [str, result] of matchingTable) {
		testParse(parser, str, result);
	}
});

describe('many', () => {
	const parser = P.string('a').many().skip(P.eof);
	const matchingTable: [string, boolean][] = [
		['a', true],
		['aa', true],
		['aaa', true],
		['abaa', false],
	];

	for (const [str, result] of matchingTable) {
		testParse(parser, str, result);
	}
});

describe('sequence', () => {
	const parser = P.sequence(P.string('a'), P.string('b'));
	const matchingTable: [string, boolean][] = [
		['ab', true],
		['aab', false],
		['a', false],
		['aa', false],
		['baba', false],
	];

	for (const [str, result] of matchingTable) {
		testParse(parser, str, result);
	}
});

describe('sequence eof', () => {
	const parser = P.sequence(P.string('a'), P.string('b')).skip(P.eof);
	const matchingTable: [string, boolean][] = [
		['ab', true],
		['aab', false],
		['a', false],
		['aa', false],
		['baba', false],
	];

	for (const [str, result] of matchingTable) {
		testParse(parser, str, result);
	}
});

describe('sequence many', () => {
	const parser = P.sequence(P.string('a'), P.string('b')).many().skip(P.eof);
	const matchingTable: [string, boolean][] = [
		['ab', true],
		['abab', true],
		['a', false],
		['aa', false],
		['aba', false],
		['baba', false],
		['bcaba', false],
	];

	for (const [str, result] of matchingTable) {
		testParse(parser, str, result);
	}
});

describe('binary left', () => {
	const parser = P_UTILS.binaryLeft(P.string('+'), P.string('a'), (a, b, c) => [a, b, c]).skip(P.eof);
	const matchingTable: [string, boolean][] = [
		['a+a', true],
		['a + a', true],
		['a', true],
		['a + b', false],
		['ab+', false],
		['+ab', false],
		['bcaba', false],
	];

	for (const [str, result] of matchingTable) {
		testParse(parser, str, result);
	}
});

describe('binary right', () => {
	const parser = P_UTILS.binaryRight(P.string('+'), P.string('a'), (a, b, c) => [a, b, c]).skip(P.eof);
	const matchingTable: [string, boolean][] = [
		['a+a', true],
		['a + a', true],
		['a', true],
		['a + b', false],
		['ab+', false],
		['+ab', false],
		['bcaba', false],
	];

	for (const [str, result] of matchingTable) {
		testParse(parser, str, result);
	}
});

describe('prefix', () => {
	const parser = P_UTILS.prefix(P.string('-'), P.string('a'), (a, b) => [a, b]).skip(P.eof);
	const matchingTable: [string, boolean][] = [
		['a', true],
		['-a', true],
		['--a', true],
		['a - b', false],
		['ab-', false],
		['-ab', false],
		['bcaba', false],
	];

	for (const [str, result] of matchingTable) {
		testParse(parser, str, result);
	}
});

describe('postfix', () => {
	const parser = P_UTILS.postfix(P.string('-'), P.string('a'), (a, b) => [a, b]).skip(P.eof);
	const matchingTable: [string, boolean][] = [
		['a', true],
		['a-', true],
		['a--', true],
		['a- b', false],
		['ab-', false],
		['-ab', false],
		['bcaba', false],
	];

	for (const [str, result] of matchingTable) {
		testParse(parser, str, result);
	}
});

describe('trim', () => {
	const parser = P.string('a').trim(P.optWhitespace).skip(P.eof);
	const matchingTable: [string, boolean][] = [
		['a', true],
		['a ', true],
		['a  ', true],
		[' a', true],
		['  a ', true],
		[' ab', false],
		['bcaba', false],
	];

	for (const [str, result] of matchingTable) {
		testParse(parser, str, result);
	}
});

describe('sequence trim', () => {
	const parser = P.sequence(P.string('b'), P.string('a').trim(P.optWhitespace), P.string('b')).skip(P.eof);
	const matchingTable: [string, boolean][] = [
		['bab', true],
		['ba b', true],
		['ba  b', true],
		['b ab', true],
		['b  a b', true],
		['b abb', false],
		['bcaba', false],
	];

	for (const [str, result] of matchingTable) {
		testParse(parser, str, result);
	}
});

describe('lazy sequence trim', () => {
	const parser = P.lazy(() => P.sequence(P.string('b'), P.string('a').trim(P.optWhitespace), P.string('b')).skip(P.eof));
	const matchingTable: [string, boolean][] = [
		['bab', true],
		['ba b', true],
		['ba  b', true],
		['b ab', true],
		['b  a b', true],
		['b abb', false],
		['bcaba', false],
	];

	for (const [str, result] of matchingTable) {
		testParse(parser, str, result);
	}
});

describe('or', () => {
	const parser = P.or(P.string('a'), P.string('b'), P.string('c')).skip(P.eof);
	const matchingTable: [string, boolean][] = [
		['a', true],
		['b', true],
		['c', true],
		['bb', false],
		['b  a b', false],
		['b abb', false],
		['bcaba', false],
	];

	for (const [str, result] of matchingTable) {
		testParse(parser, str, result);
	}
});

describe('or sequence', () => {
	const parser = P.sequence(P.or(P.string('ab'), P.string('c')), P.string('de'));
	const matchingTable: [string, boolean][] = [
		['abde', true],
		['cde', true],
		['c', false],
		['ab', false],
		['aba', false],
		['abc', false],
		['bcaba', false],
	];

	for (const [str, result] of matchingTable) {
		testParse(parser, str, result);
	}
});

describe('regex', () => {
	const parser = P.regexp(/[0-9]+/)
		.map(str => Number.parseInt(str))
		.describe('number')
		.mark()
		.skip(P.eof);
	const matchingTable: [string, boolean][] = [
		['1', true],
		['12', true],
		['23', true],
		['4234', true],
		['234a', false],
		['a123', false],
		['a1a', false],
	];

	for (const [str, result] of matchingTable) {
		testParse(parser, str, result);
	}
});

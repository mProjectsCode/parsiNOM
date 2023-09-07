import { P } from '../src/ParsiNOM';
import { P_UTILS } from '../src/ParserUtils';

describe.each([
	['', true],
	['ab', true],
	['abab', true],
	['a', false],
	['aa', false],
	['aba', false],
	['baba', false],
	['bcaba', false],
])(`sequence many '%s'`, (str, expected) => {
	const parser = P.sequence(P.string('a'), P.string('b')).many().thenEof();
	const result = parser.tryParse(str);

	test(`success to be ${expected}`, () => {
		expect(result.success).toBe(expected);
	});

	if (expected) {
		test(`AST to match snapshot`, () => {
			expect(result.value).toMatchSnapshot();
		});
	} else {
		test(`Error to match snapshot`, () => {
			expect({
				pos: result.furthest,
				expected: result.expected,
			}).toMatchSnapshot();
		});
	}
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
])(`sequence trim '%s'`, (str, expected) => {
	const parser = P.sequence(P.string('b'), P.string('a').trim(P_UTILS.optionalWhitespace()), P.string('b')).thenEof();
	const result = parser.tryParse(str);

	test(`success to be ${expected}`, () => {
		expect(result.success).toBe(expected);
	});

	if (expected) {
		test(`AST to match snapshot`, () => {
			expect(result.value).toMatchSnapshot();
		});
	} else {
		test(`Error to match snapshot`, () => {
			expect({
				pos: result.furthest,
				expected: result.expected,
			}).toMatchSnapshot();
		});
	}
});

describe.each([
	['', false],
	['thisfoo', true],
	['thatfoo', true],
	['foo', false],
	['this', false],
	['that', false],
	['bar', false],
])(`sequence or '%s'`, (str, expected) => {
	const parser = P.sequence(P.or(P.string('this'), P.string('that')), P.string('foo'));
	const result = parser.tryParse(str);

	test(`success to be ${expected}`, () => {
		expect(result.success).toBe(expected);
	});

	if (expected) {
		test(`AST to match snapshot`, () => {
			expect(result.value).toMatchSnapshot();
		});
	} else {
		test(`Error to match snapshot`, () => {
			expect({
				pos: result.furthest,
				expected: result.expected,
			}).toMatchSnapshot();
		});
	}
});

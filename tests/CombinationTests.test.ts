import { P } from '../src/ParsiNOM';
import { P_UTILS } from '../src/ParserUtils';

describe.each([
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
	['abde', true],
	['cde', true],
	['c', false],
	['ab', false],
	['aba', false],
	['abc', false],
	['bcaba', false],
])(`sequence or '%s'`, (str, expected) => {
	const parser = P.sequence(P.or(P.string('ab'), P.string('c')), P.string('de'));
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

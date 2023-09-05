import { P } from '../../src/ParsiNOM';
import { P_UTILS } from '../../src/ParserUtils';
import { testParse } from '../TestHelpers';

describe.each([
	['a', true],
	['a+a', true],
	['a + a', true],
	['a + b', true],
	['a + b+c', true],
	['a + b + c', true],
	['ab+', false],
	['+ab', false],
	['bcaba', false],
])(`binary left '%s'`, (str, expected) => {
	const parser = P_UTILS.binaryLeft(P.string('+'), P.oneStringOf(['a', 'b', 'c']), (a, b, c) => [a, b, c]).thenEof();
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
	['a', true],
	['a+a', true],
	['a + a', true],
	['a + b', true],
	['a + b+c', true],
	['a + b + c', true],
	['ab+', false],
	['+ab', false],
	['bcaba', false],
])(`binary right '%s'`, (str, expected) => {
	const parser = P_UTILS.binaryRight(P.string('+'), P.oneStringOf(['a', 'b', 'c']), (a, b, c) => [a, b, c]).thenEof();
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
	['a', true],
	['-a', true],
	['--a', true],
	['a - b', false],
	['ab-', false],
	['-ab', false],
	['bcaba', false],
])(`prefix '%s'`, (str, expected) => {
	const parser = P_UTILS.prefix(P.string('-'), P.string('a'), (a, b) => [a, b]).thenEof();
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
	['a', true],
	['a-', true],
	['a--', true],
	['a- b', false],
	['ab-', false],
	['-ab', false],
	['bcaba', false],
])(`postfix '%s'`, (str, expected) => {
	const parser = P_UTILS.postfix(P.string('-'), P.string('a'), (a, b) => [a, b]).thenEof();
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
	['a', false],
	['a()', false],
	['a(b)', true],
	['a (b)', false],
	['(b)', false],
	['a b', false],
	['foo', false],
])(`function '%s'`, (str, expected) => {
	const parser = P_UTILS.func(P.string('a'), P.string('b'), (a, b) => [a, b]).thenEof();
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

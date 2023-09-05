import { P_UTILS } from '../../src/ParserUtils';

describe.each([
	['', false],
	[' ', true],
	['\n', true],
	['\r', true],
	['\r\n', true],
	['\r\n  \n', true],
	['b', false],
])(`whitespace '%#'`, (str, expected) => {
	const parser = P_UTILS.whitespace().thenEof();
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
	['', true],
	[' ', true],
	['\n', true],
	['\r', true],
	['\r\n', true],
	['\r\n  \n', true],
	['b', false],
])(`optional whitespace '%#'`, (str, expected) => {
	const parser = P_UTILS.optionalWhitespace().thenEof();
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
	[' ', false],
	['\n', true],
	['\r', true],
	['\r\n', true],
	['\r\n  \n', false],
	['b', false],
])(`newline '%#'`, (str, expected) => {
	const parser = P_UTILS.newline().thenEof();
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

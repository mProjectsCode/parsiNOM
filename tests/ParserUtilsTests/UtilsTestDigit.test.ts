import { P_UTILS } from '../../src/ParserUtils';

describe.each([
	['0', true],
	['2', true],
	['9', true],
	['a', false],
	['a1', false],
])(`digit '%s'`, (str, expected) => {
	const parser = P_UTILS.digit();
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
	['0', true],
	['22', true],
	['99', true],
	['a', false],
	['a12', false],
])(`digits '%s'`, (str, expected) => {
	const parser = P_UTILS.digits();
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

import { P } from '../../src/ParsiNOM';

describe.each([
	['', false],
	['a', false],
	['b', false],
	['c', false],
	['afoo', false],
	['foo', true],
])(`noneOf '%s'`, (str, expected) => {
	const parser = P.noneOf('abc');
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

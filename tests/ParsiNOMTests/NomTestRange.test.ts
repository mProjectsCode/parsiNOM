import { P } from '../../src/ParsiNOM';

describe.each([
	['', false],
	['a', true],
	['b', true],
	['m', true],
	['n', false],
	['z', false],
	['#', false],
	['A', false],
	['B', false],
	['M', false],
	['N', false],
	['Z', false],
])(`sequence '%s'`, (str, expected) => {
	const parser = P.range('a', 'm');
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

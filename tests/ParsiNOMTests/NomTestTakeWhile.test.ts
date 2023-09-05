import { P } from '../../src/ParsiNOM';

describe.each([
	['', true],
	['a', true],
	['aa', true],
	['aab', true],
	['baa', true],
	['foo', true],
])(`sequence '%s'`, (str, expected) => {
	const parser = P.takeWhile(char => char === 'a');
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

import { P } from '../../src/ParsiNOM';

describe.each([
	['', false],
	['this', true],
	['foo', false],
])(`describe '%s'`, (str, expected) => {
	const parser = P.string('this').describe('some error').skip(P.eof);
	const result = parser.parse(str);

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

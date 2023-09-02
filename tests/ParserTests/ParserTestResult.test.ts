import { P } from '../../src/ParsiNOM';

describe.each([
	['', false],
	['this', true],
	['foo', false],
])(`result '%s'`, (str, expected) => {
	const parser = P.string('this').result('result').skip(P.eof);
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

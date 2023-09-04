import { P } from '../../src/ParsiNOM';

describe.each([
	['', false],
	['this', true],
	['this,this', true],
	['this,this,this', true],
	['this, this', false],
	['foo', false],
])(`separateByNotEmpty '%s'`, (str, expected) => {
	const parser = P.separateByNotEmpty(P.string('this'), P.string(',')).skip(P.eof);
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

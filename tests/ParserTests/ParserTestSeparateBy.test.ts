import { P } from '../../src/Helpers';

describe.each([
	['', true],
	['this', true],
	['this,this', true],
	['this,this,this', true],
	['this, this', false],
	['foo', false],
])(`separateBy '%s'`, (str, expected) => {
	const parser = P.string('this').separateBy(P.string(',')).skip(P.eof);
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
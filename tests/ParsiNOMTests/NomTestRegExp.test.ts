import { P } from '../../src/ParsiNOM';

describe.each([
	['', false],
	['this', true],
	['thisthat', true],
	['2thisthat', false],
	['&foo', false],
])(`regexp '%s'`, (str, expected) => {
	const parser = P.regexp(/^[a-z]+/);
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

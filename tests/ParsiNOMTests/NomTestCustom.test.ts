import { P } from '../../src/ParsiNOM';

describe.each([
	['', true],
	['this', true],
	['that', true],
	['thisthat', true],
	['thisthatfoo', true],
	['foo', true],
])(`custom '%s'`, (str, expected) => {
	const parser = P.custom(context => context.succeed('value'));
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

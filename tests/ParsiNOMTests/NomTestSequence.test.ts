import { P } from '../../src/ParsiNOM';

describe.each([
	['', false],
	['this', false],
	['that', false],
	['thisthat', true],
	['thisthatfoo', false],
	['foo', false],
])(`sequence '%s'`, (str, expected) => {
	const parser = P.sequence(P.string('this'), P.string('that'), P.eof);
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

import { P } from '../../src/ParsiNOM';

describe.each([
	['', false],
	['thisthat', true],
	['this', false],
	['that', false],
	['thatthis', false],
	['foo', false],
])(`then '%s'`, (str, expected) => {
	const parser = P.string('this').then(P.string('that')).thenEof();
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

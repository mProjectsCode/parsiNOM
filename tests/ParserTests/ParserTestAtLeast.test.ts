import { P } from '../../src/ParsiNOM';

describe.each([
	['', false],
	['a', false],
	['aa', true],
	['aaa', true],
	['abaa', false],
])(`atLeast '%s'`, (str, expected) => {
	const parser = P.string('a').atLeast(2).skip(P.eof);
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

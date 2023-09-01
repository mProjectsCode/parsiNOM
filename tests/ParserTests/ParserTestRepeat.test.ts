import { P } from '../../src/ParsiNOM';

describe.each([
	['', false],
	['a', true],
	['aa', true],
	['aaa', false],
	['abaa', false],
])(`repeat '%s'`, (str, expected) => {
	const parser = P.string('a').repeat(1, 2).skip(P.eof);
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

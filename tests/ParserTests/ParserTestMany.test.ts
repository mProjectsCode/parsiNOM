import { P } from '../../src/ParsiNOM';

describe.each([
	['', true],
	['a', true],
	['aa', true],
	['aaa', true],
	['abaa', false],
])(`many '%s'`, (str, expected) => {
	const parser = P.string('a').many().thenEof();
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

describe('many infinite loop', () => {
	test('infinite loop to throw error', () => {
		expect(() => {
			const parser = P.string('').many();
			parser.parse('foo');
		}).toThrow('infinite loop');
	});
});

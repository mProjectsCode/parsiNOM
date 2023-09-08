import { P } from '../../src/ParsiNOM';

describe.each([
	['', false],
	['this', true],
	['thisthat', true],
	['that', false],
	['thatthis', false],
	['foo', false],
])(`optional value '%s'`, (str, expected) => {
	const parser = P.string('this').then(P.string('that').optional()).thenEof();
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

describe.each([
	['', false],
	['this', true],
	['thisthat', true],
	['that', false],
	['thatthis', false],
	['foo', false],
])(`optional no value '%s'`, (str, expected) => {
	const parser = P.string('this').then(P.string('that').optional('some fallback')).thenEof();
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

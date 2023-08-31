import { P } from '../../src/Helpers';

describe.each([
	['', false],
	['this', true],
	['thisthat', true],
	['that', false],
	['thatthis', false],
	['foo', false],
])(`optional value '%s'`, (str, expected) => {
	const parser = P.string('this').then(P.string('that').optional()).skip(P.eof);
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

describe.each([
	['', false],
	['this', true],
	['thisthat', true],
	['that', false],
	['thatthis', false],
	['foo', false],
])(`optional no value '%s'`, (str, expected) => {
	const parser = P.string('this').then(P.string('that').optional('some fallback')).skip(P.eof);
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

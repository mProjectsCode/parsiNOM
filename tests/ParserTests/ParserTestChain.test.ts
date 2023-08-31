import { P } from '../../src/Helpers';

describe.each([
	['', false],
	['thisthat', true],
	['1bar', true],
	['thisbar', false],
	['1that', false],
	['this', false],
	['1', false],
	['thatthis', false],
	['foo', false],
])(`chain '%s'`, (str, expected) => {
	const parser = P.string('this')
		.or(P.digit.map(x => Number(x)))
		.chain(res => {
			if (typeof res === 'string') {
				return P.string('that');
			} else {
				return P.string('bar');
			}
		})
		.skip(P.eof);
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

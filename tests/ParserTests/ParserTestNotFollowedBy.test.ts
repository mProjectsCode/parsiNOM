import { P } from '../../src/Helpers';

describe.each([
	['', false],
	['this', true],
	['thisfoo', true],
	['thisthat', false],
	['that', false],
	['thatthis', false],
	['foo', false],
])(`notFollowedBy '%s'`, (str, expected) => {
	const parser = P.string('this').node('before').notFollowedBy(P.string('that')).node('after');
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

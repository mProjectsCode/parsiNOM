import { P } from '../src/ParsiNOM';
import { testParse } from './TestHelpers';

describe('ab sequence many', () => {
	const parser = P.sequence(P.string('a'), P.string('b')).many().thenEof();
	const matchingTable: [string, boolean][] = [
		['ab', true],
		['abab', true],
		['a', false],
		['aa', false],
		['aba', false],
		['baba', false],
		['bcaba', false],
	];

	for (const [str, expected] of matchingTable) {
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
	}
});

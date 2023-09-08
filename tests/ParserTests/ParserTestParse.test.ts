import { P } from '../../src/ParsiNOM';
import { ParsingError } from '../../src/ParserError';

describe.each([
	['', false],
	['this', true],
	['that', false],
])(`parse '%s'`, (str, expected) => {
	const parser = P.string('this').thenEof();

	if (expected) {
		test(`result to match`, () => {
			expect(parser.parse(str)).toEqual(str);
		});
	} else {
		test(`error to match`, () => {
			expect(() => {
				parser.parse(str);
			}).toThrow(ParsingError);
		});
	}
});

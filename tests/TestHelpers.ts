import { Parser } from '../src/Parser';

export function testParse(parser: Parser<unknown>, str: string, expectedSuccess: boolean) {
	test(`'${str}'`, () => {
		const result = parser.parse(str);
		expect(result.success).toBe(expectedSuccess);

		if (expectedSuccess) {
			expect(result.value).toMatchSnapshot();
		} else {
			expect(result.expected).toMatchSnapshot();
		}
	});
}

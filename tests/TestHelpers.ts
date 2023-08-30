import { Parser } from '../src/Parser';

export function testParse(parser: Parser<unknown>, str: string, expectedSuccess: boolean) {
	test(`'${str}'`, () => {
		const result = parser.parse(str);
		expect(result.success).toBe(expectedSuccess);
		expect({
			value: result?.value,
			expected: result?.expected,
		}).toMatchSnapshot();
	});
}

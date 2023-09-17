import { Parser } from '../src/Parser';
// @ts-ignore
import { test, expect, describe } from "bun:test";

export function testParse(parser: Parser<unknown>, str: string, expected: boolean) {
	const result = parser.tryParse(str);

	describe(`'${str}'`, () => {
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
}

import { Parser } from '../src/Parser';
import { describe, test, expect } from 'bun:test';

export function testParser(parser: Parser<unknown>, str: string, shouldSucceed: boolean): void {
	const result = parser.tryParse(str);

	test(`success to be ${shouldSucceed}`, () => {
		expect(result.success).toBe(shouldSucceed);
	});

	if (shouldSucceed) {

		describe('conditional success tests', () => {
			test(`AST to match snapshot`, () => {
				expect(result.value).toMatchSnapshot();
			});
		});

	} else {

		describe('conditional failure tests', () => {
			test(`AST to be undefined`, () => {
				expect(result.value).toBe(undefined);
			});

			test(`Error to match snapshot`, () => {
				expect({
					pos: result.furthest,
					expected: result.expected,
				}).toMatchSnapshot();
			});
		});

	}
}
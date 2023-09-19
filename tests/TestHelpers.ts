import { Parser } from '../src/Parser';
import { describe, test, expect } from 'bun:test';
import { ParseResult, ParseSuccess, ParsingMarker } from '../src/HelperTypes';

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

export interface ParserTestSuccessData<T> {
	input: string;
	shouldSucceed: true;
	ast: T;
	toIndex: number;
}

export interface ParserTestFailureData {
	input: string;
	shouldSucceed: false;
	furthest: number;
	expected: string[];
}

export type ParserTestData<T> = ParserTestSuccessData<T> | ParserTestFailureData;

export function testParserAdvanced<T>(parser: Parser<T>, data: Readonly<ParserTestData<T>>): void {
	const markedResult: ParseResult<ParsingMarker<unknown>> = parser.marker().tryParse(data.input);
	const alwaysSucceedMarkerResult: ParseSuccess<ParsingMarker<unknown>> = parser.optional(undefined).marker().tryParse(data.input) as ParseSuccess<
		ParsingMarker<unknown>
	>;

	describe(`'${data.input}'`, () => {
		test(`success is ${data.shouldSucceed}`, () => {
			expect(markedResult.success).toBe(data.shouldSucceed);
		});

		if (data.shouldSucceed) {
			describe('conditional success tests', () => {
				// we test that the parse result is what we expect
				test(`AST matches`, () => {
					expect(markedResult.value?.value).toEqual(data.ast);
				});

				// we test that the parser started at index 0
				test(`Node from index is 0`, () => {
					expect(markedResult.value?.range.from.index).toBe(0);
				});

				// we test that after parsing the parser is at the position that we expect
				test(`Node to index is ${data.toIndex}`, () => {
					expect(markedResult.value?.range.to.index).toBe(data.toIndex);
				});
			});
		} else {
			describe('conditional failure tests', () => {
				// we test that the parse result is undefined
				test(`AST is undefined`, () => {
					expect(markedResult.value).toBe(undefined);
				});

				// we test that the parser started at index 0
				test(`Node from index is 0`, () => {
					expect(alwaysSucceedMarkerResult.value.range.from.index).toBe(0);
				});

				// we test that the parser hasn't advanced
				test(`Node to index is 0`, () => {
					expect(alwaysSucceedMarkerResult.value.range.to.index).toBe(0);
				});

				// we test that the furthest position is what we expect
				test(`Furthest position is ${data.furthest}`, () => {
					expect(markedResult.furthest?.index).toBe(data.furthest);
				});

				// we test that the expected values of the parser match what we expect
				test(`Expected is ${data.expected}`, () => {
					expect(markedResult.expected).toEqual(data.expected.sort());
				});
			});
		}
	});
}

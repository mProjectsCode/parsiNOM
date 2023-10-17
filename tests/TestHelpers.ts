import { Parser } from '../src/Parser';
import { describe, expect, test } from 'bun:test';
import { ParseResult, ParseSuccess, ParsingMarker } from '../src/HelperTypes';

function escapeString(str: string): string {
	return str.replace(/\n/g, '/n').replace(/\r/g, '/r').replace(/\t/g, '/t').replace(/\\/g, '/');
}

function escapeStringInObject(obj: any): any {
	if (typeof obj === 'string') {
		return escapeString(obj);
	}
	if (typeof obj === 'object') {
		if (Array.isArray(obj)) {
			let newArr: any[] = [];
			for (const objElement of obj) {
				newArr.push(escapeStringInObject(objElement));
			}
			return newArr;
		} else {
			let newObj: any = {};
			for (const [key, value] of Object.entries(obj)) {
				newObj[key] = escapeStringInObject(value);
			}
			return newObj;
		}
	}
	return obj;
}

export function testParser(parser: Parser<unknown>, str: string, shouldSucceed: boolean, testName?: string): void {
	const result = parser.tryParse(str);

	const name = escapeString(testName ?? str);

	describe(`'${name}'`, () => {
		test(`success is ${shouldSucceed}`, () => {
			expect(result.success).toBe(shouldSucceed);
		});

		if (shouldSucceed) {
			describe('conditional success tests', () => {
				test(`AST matches snapshot`, () => {
					expect(escapeStringInObject(result.value)).toMatchSnapshot();
				});
			});
		} else {
			describe('conditional failure tests', () => {
				test(`AST is undefined`, () => {
					expect(result.value).toBe(undefined);
				});

				// console.log(name, result.expected);

				test(`Error matches snapshot`, () => {
					expect({
						pos: result.furthest,
						expected: escapeStringInObject(result.expected?.sort()),
					}).toMatchSnapshot();
				});
			});
		}
	});
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

export function testParserAdvanced<T>(parser: Parser<T>, data: Readonly<ParserTestData<T>>, testName?: string): void {
	const markedResult: ParseResult<ParsingMarker<unknown>> = parser.marker().tryParse(data.input);
	const alwaysSucceedMarkerResult: ParseSuccess<ParsingMarker<unknown>> = parser.optional(undefined).marker().tryParse(data.input) as ParseSuccess<
		ParsingMarker<unknown>
	>;

	const name = (testName ?? data.input).replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');

	describe(`'${name}'`, () => {
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
					expect(markedResult.expected?.sort()).toEqual(data.expected.sort());
				});
			});
		}
	});
}

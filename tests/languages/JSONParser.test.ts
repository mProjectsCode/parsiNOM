import { P } from '../../src/ParsiNOM';
import * as JsonData from './__data__/JsonData';
import { ParseFailure } from '../../src/HelperTypes';
import { jsonParser } from '../../profiling/Json';
import { benchmark } from 'kelonio';

describe('json parser', () => {
	const testCases: unknown[] = ['1', [1, '2'], { a: 1, b: ['2', false] }, { a: { foo: '1' }, b: null, c: undefined }];

	for (const testCase of testCases) {
		const str = JSON.stringify(testCase);

		test(JSON.stringify(testCase), () => {
			const res = jsonParser.tryParse(str);
			console.log(testCase, res);

			// expect(res.success).toBe(true);
			expect(res.value).toEqual(testCase);
		});

		test(JSON.stringify(testCase) + ' multi line', () => {
			const res = jsonParser.tryParse(JSON.stringify(testCase, null, 4));
			console.log(testCase, res);

			// expect(res.success).toBe(true);
			expect(res.value).toEqual(testCase);
		});

		it(JSON.stringify(testCase) + ' performance', async () => {
			await benchmark.record(['JSON parser', str], () => {
				jsonParser.tryParse(str);
			});

			await benchmark.record(['js JSON parser', str], () => {
				JSON.parse(str);
			});
		});
	}


	// describe('json perf', () => {
	// 	// JEST:
	// 	// result optimizations ~ 8.4 ms
	// 	// index optimizations ~ 7.3 ms
	// 	// parser optimizations ~ 7.2 ms
	// 	// replace number and string parsing with regexp ~ 3.6 ms
	// 	// replace string parsing with manyNotOf ~ 5 ms
	// 	// skip and then optimizations ~ 4.7 ms
	// 	// wrap optimizations ~ 4.2 ms
	// 	it('big json file', async () => {
	// 		await benchmark.record(['parsiNOM parser'], () => {
	// 			jsonParser.tryParse(JsonData.data);
	// 		});
	//
	// 		await benchmark.record(['builtin parser'], () => {
	// 			JSON.parse(JsonData.data);
	// 		});
	// 	});
	// });

	describe('json file', () => {
		test('normal data', () => {
			const res = jsonParser.tryParse(JsonData.data);

			expect(res.success).toEqual(true);
			expect(res.value).toEqual(JSON.parse(JsonData.data));
		});

		test('minified data', () => {
			const res = jsonParser.tryParse(JsonData.data_min);

			expect(res.success).toEqual(true);
			expect(res.value).toEqual(JSON.parse(JsonData.data_min));
		});

		test('invalid data 1', () => {
			const res = jsonParser.tryParse(JsonData.data_invalid_1);

			expect(res.success).toEqual(false);
			console.log(P.createError(JsonData.data_invalid_1, res as ParseFailure));
		});

		test('invalid data 2', () => {
			const res = jsonParser.tryParse(JsonData.data_invalid_2);

			expect(res.success).toEqual(false);
			console.log(P.createError(JsonData.data_invalid_2, res as ParseFailure));
		});
	});
});

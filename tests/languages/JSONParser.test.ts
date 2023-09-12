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

	// version 0.0.6 ~ 8.4 ms
	it('big performance', async () => {
		await benchmark.record(['big JSON parser'], () => {
			jsonParser.tryParse(JsonData.data);
		});

		await benchmark.record(['big js JSON parser'], () => {
			JSON.parse(JsonData.data);
		});
	});

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

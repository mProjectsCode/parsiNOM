import { describe, test, expect } from 'bun:test';
import { MathParser } from '../../examples/Math';

describe('math test', () => {
	const testCases: string[] = ['1', '1+2', '1 + 2 + 3', '1 * 2 + 3', '1 + 2 * 3', '(1 + 2) * 3', '1 + -2', '1 + -2 ^ 2', '1 + -2 ^ 2!'];

	for (const testCase of testCases) {
		test(testCase, () => {
			const res = MathParser.tryParse(testCase);
			// console.log(testCase, res);

			expect(res.success).toBe(true);
		});
	}
});

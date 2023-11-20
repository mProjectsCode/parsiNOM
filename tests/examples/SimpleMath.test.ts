import { describe, test, expect } from 'bun:test';
import { SimpleMathParser } from '../../examples/SimpleMath';

describe('simple math test', () => {
	const testCases: string[] = ['1 + 2', '1 + 2 + 3', '1 * 2 + 3', '1 + 2 * 3', '(1 + 2) * 3', '1 + -2', '1 + -2 ^ 2', '1 + -2 ^ 2!'];

	for (const testCase of testCases) {
		test(testCase, () => {
			const res = SimpleMathParser.tryParse(testCase);
			expect(res.success).toBe(true);
			expect(res.value).toMatchSnapshot();
		});
	}
});

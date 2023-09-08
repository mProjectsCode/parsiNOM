import { P } from '../../src/ParsiNOM';

describe.each([
	['', false],
	['a', true],
	['aa', true],
	['aaa', false],
	['abaa', false],
])(`repeat '%s'`, (str, expected) => {
	const parser = P.string('a').repeat(1, 2).thenEof();
	const result = parser.tryParse(str);

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

describe('repeat invalid ranges', () => {
	test('negative range to be invalid', () => {
		expect(() => {
			P.string('a').repeat(-1, 2);
		}).toThrow('Invalid Range');
	});

	test('min > max to be invalid', () => {
		expect(() => {
			P.string('a').repeat(3, 2);
		}).toThrow('Invalid Range');
	});

	test('infinity to be invalid', () => {
		expect(() => {
			P.string('a').repeat(1, Infinity);
		}).toThrow('Invalid Range');
	});

	test('floats to be invalid', () => {
		expect(() => {
			P.string('a').repeat(1, 2.5);
		}).toThrow('Invalid Range');
	});
});

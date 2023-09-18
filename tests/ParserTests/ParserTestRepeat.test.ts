import { P } from '../../src/ParsiNOM';
import {testParser} from '../TestHelpers';
describe.each([
	['', false],
	['a', true],
	['aa', true],
	['aaa', false],
	['abaa', false],
])(`repeat '%s'`, (str, shouldSucceed) => {
	const parser = P.string('a').repeat(1, 2).thenEof();
	testParser(parser, str, shouldSucceed);
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

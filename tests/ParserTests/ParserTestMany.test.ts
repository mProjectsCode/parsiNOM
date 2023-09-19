import { P } from '../../src/ParsiNOM';
import { testParser } from '../TestHelpers';
describe.each([
	['', true],
	['a', true],
	['aa', true],
	['aaa', true],
	['abaa', false],
])(`many '%s'`, (str, shouldSucceed) => {
	const parser = P.string('a').many().thenEof();
	testParser(parser, str, shouldSucceed);
});

describe('many infinite loop', () => {
	test('infinite loop to throw error', () => {
		expect(() => {
			const parser = P.string('').many();
			parser.parse('foo');
		}).toThrow('infinite loop');
	});
});

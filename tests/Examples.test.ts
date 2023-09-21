import { P } from '../src/ParsiNOM';

describe('examples', () => {
	describe('readme', () => {
		// string matcher
		test('string matcher', () => {
			const parser = P.string('foo'); // matches the string foo

			expect(parser.parse('foo')).toEqual('foo'); // succeeds, yields 'foo'
			expect(parser.parse('foobar')).toEqual('foo'); // succeeds, yields 'foo'

			expect(() => parser.parse('')).toThrow(); // fails
			expect(() => parser.parse('bar')).toThrow(); // fails
		});

		test('string matcher then eof', () => {
			const parser = P.string('foo').thenEof(); // matches the string foo

			expect(parser.parse('foo')).toEqual('foo'); // succeeds, yields 'foo'

			expect(() => parser.parse('')).toThrow(); // fails
			expect(() => parser.parse('bar')).toThrow(); // fails
			expect(() => parser.parse('foobar')).toThrow(); // fails
		});

		// regexp matcher
		test('regexp matcher', () => {
			const parser = P.regexp(/^[0-9]+/); // matches multiple digits

			expect(parser.parse('1')).toEqual('1'); // succeeds, yields '1'
			expect(parser.parse('123')).toEqual('123'); // succeeds, yields '123'
			expect(parser.parse('123foo')).toEqual('123'); // succeeds, yields '123'

			expect(() => parser.parse('')).toThrow(); // fails
			expect(() => parser.parse('foo')).toThrow(); // fails
		});
	});
});

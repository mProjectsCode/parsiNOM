import { P } from '../src/ParsiNOM';

describe('examples', () => {
	describe('readme', () => {
		test('string matcher', () => {
			// begin-snippet: example-string-matcher
			const parser = P.string('foo'); // matches the string foo

			expect(parser.parse('foo')).toEqual('foo'); // succeeds, yields 'foo'
			expect(parser.parse('foobar')).toEqual('foo'); // succeeds, yields 'foo'

			expect(() => parser.parse('')).toThrow(); // fails
			expect(() => parser.parse('bar')).toThrow(); // fails
			// end-snippet
		});

		test('string matcher then eof', () => {
			// begin-snippet: example-string-matcher-then-eof
			const parser = P.string('foo').thenEof(); // matches the string foo

			expect(parser.parse('foo')).toEqual('foo'); // succeeds, yields 'foo'

			expect(() => parser.parse('')).toThrow(); // fails
			expect(() => parser.parse('bar')).toThrow(); // fails
			expect(() => parser.parse('foobar')).toThrow(); // fails
			// end-snippet
		});

		test('regexp matcher', () => {
			// begin-snippet: example-regexp-matcher
			const parser = P.regexp(/^[0-9]+/); // matches multiple digits

			expect(parser.parse('1')).toEqual('1'); // succeeds, yields '1'
			expect(parser.parse('123')).toEqual('123'); // succeeds, yields '123'
			expect(parser.parse('123foo')).toEqual('123'); // succeeds, yields '123'

			expect(() => parser.parse('')).toThrow(); // fails
			expect(() => parser.parse('foo')).toThrow(); // fails
			// end-snippet
		});

		test('or', () => {
			// begin-snippet: example-or
			const parser = P.or(P.string('a'), P.string('b')).thenEof(); // matches 'a' or 'b'

			expect(parser.parse('a')).toEqual('a'); // succeeds, yields 'a'
			expect(parser.parse('b')).toEqual('b'); // succeeds, yields 'b'

			expect(() => parser.parse('')).toThrow(); // fails
			expect(() => parser.parse('c')).toThrow(); // fails
			// end-snippet
		});

		test('or order wrong', () => {
			// begin-snippet: example-or-order-wrong
			const parser = P.or(P.string('a'), P.string('ab')).thenEof(); // matches only 'a'

			expect(parser.parse('a')).toEqual('a'); // succeeds, yields 'a'

			expect(() => parser.parse('ab')).toThrow(); // fails, since the parser will try to match 'a' first, succeeds and then expects the end of input
			// end-snippet
		});

		test('or order correct', () => {
			// begin-snippet: example-or-order-correct
			const parser = P.or(P.string('ab'), P.string('a')).thenEof(); // matches 'ab' or 'a'

			expect(parser.parse('a')).toEqual('a'); // succeeds, yields 'a', the parser will try to match 'ab' first but fails, then it backtracks and tries to match 'a'
			expect(parser.parse('ab')).toEqual('ab'); // succeeds, yields 'ab'
			// end-snippet
		});

		test('sequence', () => {
			// begin-snippet: example-sequence
			const parser = P.sequence(P.string('a'), P.string('b')).thenEof(); // matches 'a' then 'b'

			expect(parser.parse('ab')).toEqual(['a', 'b']); // succeeds, yields ['a', 'b']

			expect(() => parser.parse('')).toThrow(); // fails
			expect(() => parser.parse('a')).toThrow(); // fails
			expect(() => parser.parse('ba')).toThrow(); // fails
			expect(() => parser.parse('foo')).toThrow(); // fails
			// end-snippet
		});

		test('many', () => {
			// begin-snippet: example-many
			const parser = P.string('a').many().thenEof(); // matches 'a' as many times as it can

			expect(parser.parse('')).toEqual([]); // succeeds, yields []
			expect(parser.parse('a')).toEqual(['a']); // succeeds, yields ['a']
			expect(parser.parse('aaa')).toEqual(['a', 'a', 'a']); // succeeds, yields ['a', 'a', 'a']

			expect(() => parser.parse('foo')).toThrow(); // fails
			expect(() => parser.parse('aafoo')).toThrow(); // fails
			// end-snippet
		});

		test('map', () => {
			// begin-snippet: example-many
			const parser = P.regexp(/^[0-9]+/).map(x => Number(x)); // matches a number, yielding the number as a number, not a string

			expect(parser.parse('1')).toEqual(1); // succeeds, yields '1' as a number
			expect(parser.parse('123')).toEqual(123); // succeeds, yields '123' as a number

			expect(() => parser.parse('')).toThrow(); // fails
			expect(() => parser.parse('foo')).toThrow(); // fails
			// end-snippet
		});
	});
});

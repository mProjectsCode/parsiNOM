<!--
GENERATED FILE - Source File: /mdsource/README.source.md
-->

# parsiNOM

parsiNOM is a modern, optimized and typesafe parser combinator library, inspired by [parsimmon](https://github.com/jneen/parsimmon).

parsiNOM has not yet reached stable, so breaking changes can still occur in minor versions.

## What is a Parser Combinator?

The idea behind parser combinator is construct your parser out of a bunch of small parsers.
This makes building parsers easier and more readable.
On top of that, parser combinators make testing your parser easier, as every part of the parser, such as the parser for string literals, can be tested individually.

### Important Terms

- `combinator` a function that usually takes in one ore more parsers and returns a single combined parser
- `matcher` a matcher is a parser that is not constructed from other parsers
- `yield`/`yields` in this case `yield` refers to the value that a parser generates from a specific input string, if it can match. In the code a parser is generic over the value that it yields, meaning `Parser<string[]>` will yield an array of strings.

### Basic Matchers

parsiNOM provides many matchers, which are documented using doc comments. Here we will look at the two most basic matchers.

#### String Matcher

`P.string(str: string): Parser<string>`

`P.string` returns a parser that matches `str` and yields `str`.

<!-- snippet: example-string-matcher -->
<a id='snippet-example-string-matcher'></a>
```ts
const parser = P.string('foo'); // matches the string foo

expect(parser.parse('foo')).toEqual('foo'); // succeeds, yields 'foo'
expect(parser.parse('foobar')).toEqual('foo'); // succeeds, yields 'foo'

expect(() => parser.parse('')).toThrow(); // fails
expect(() => parser.parse('bar')).toThrow(); // fails
```
<sup><a href='/tests/Examples.test.ts#L7-L15' title='Snippet source file'>snippet source</a> | <a href='#snippet-example-string-matcher' title='Start of snippet'>anchor</a></sup>
<!-- endSnippet -->

To assert that the parser is at the end of input after parsing you can use `.thenEof()`.

<!-- snippet: example-string-matcher-then-eof -->
<a id='snippet-example-string-matcher-then-eof'></a>
```ts
const parser = P.string('foo').thenEof(); // matches the string foo

expect(parser.parse('foo')).toEqual('foo'); // succeeds, yields 'foo'

expect(() => parser.parse('')).toThrow(); // fails
expect(() => parser.parse('bar')).toThrow(); // fails
expect(() => parser.parse('foobar')).toThrow(); // fails
```
<sup><a href='/tests/Examples.test.ts#L19-L27' title='Snippet source file'>snippet source</a> | <a href='#snippet-example-string-matcher-then-eof' title='Start of snippet'>anchor</a></sup>
<!-- endSnippet -->

#### RegExp

`P.regexp(regexp: RegExp, group?: number | undefined): Parser<string>`

`P.regexp` returns a parser that matches the regexp `regexp` and yields the matched string or optionally a specific capture group.
Most of the time you want to use `^` to only match at the current parser position.

<!-- snippet: example-regexp-matcher -->
<a id='snippet-example-regexp-matcher'></a>
```ts
const parser = P.regexp(/^[0-9]+/); // matches multiple digits

expect(parser.parse('1')).toEqual('1'); // succeeds, yields '1'
expect(parser.parse('123')).toEqual('123'); // succeeds, yields '123'
expect(parser.parse('123foo')).toEqual('123'); // succeeds, yields '123'

expect(() => parser.parse('')).toThrow(); // fails
expect(() => parser.parse('foo')).toThrow(); // fails
```
<sup><a href='/tests/Examples.test.ts#L31-L40' title='Snippet source file'>snippet source</a> | <a href='#snippet-example-regexp-matcher' title='Start of snippet'>anchor</a></sup>
<!-- endSnippet -->

### Basic Combinators

The most important parser combinators are `or`, `sequence`, `many` and `map`, but parsiNOM provides many other combinators build on top of these.

#### Matching Multiple Options

`P.or<ParserArr extends readonly Parser<unknown>[]>(...parsers: ParserArr): Parser<TupleToUnion<DeParserArray<ParserArr>>>`

`P.or` accepts any number of parsers as arguments and yields the value of the first parser that succeeds.
Because of that the order of the parsers is important.

<!-- snippet: example-or -->
<a id='snippet-example-or'></a>
```ts
const parser = P.or(P.string('a'), P.string('b')).thenEof(); // matches 'a' or 'b'

expect(parser.parse('a')).toEqual('a'); // succeeds, yields 'a'
expect(parser.parse('b')).toEqual('b'); // succeeds, yields 'b'

expect(() => parser.parse('')).toThrow(); // fails
expect(() => parser.parse('c')).toThrow(); // fails
```
<sup><a href='/tests/Examples.test.ts#L44-L52' title='Snippet source file'>snippet source</a> | <a href='#snippet-example-or' title='Start of snippet'>anchor</a></sup>
<!-- endSnippet -->

In the following example the order of parsers matters.

<!-- snippet: example-or-order-wrong -->
<a id='snippet-example-or-order-wrong'></a>
```ts
const parser = P.or(P.string('a'), P.string('ab')).thenEof(); // matches only 'a'

expect(parser.parse('a')).toEqual('a'); // succeeds, yields 'a'

expect(() => parser.parse('ab')).toThrow(); // fails, since the parser will try to match 'a' first, succeeds and then expects the end of input
```
<sup><a href='/tests/Examples.test.ts#L56-L62' title='Snippet source file'>snippet source</a> | <a href='#snippet-example-or-order-wrong' title='Start of snippet'>anchor</a></sup>
<!-- endSnippet -->

<!-- snippet: example-or-order-correct -->
<a id='snippet-example-or-order-correct'></a>
```ts
const parser = P.or(P.string('ab'), P.string('a')).thenEof(); // matches 'ab' or 'a'

expect(parser.parse('a')).toEqual('a'); // succeeds, yields 'a', the parser will try to match 'ab' first but fails, then it backtracks and tries to match 'a'
expect(parser.parse('ab')).toEqual('ab'); // succeeds, yields 'ab'
```
<sup><a href='/tests/Examples.test.ts#L66-L71' title='Snippet source file'>snippet source</a> | <a href='#snippet-example-or-order-correct' title='Start of snippet'>anchor</a></sup>
<!-- endSnippet -->

#### Matching a Sequence

`P.sequence<ParserArr extends readonly Parser<unknown>[]>(...parsers: ParserArr): Parser<DeParserArray<ParserArr>>`

`P.sequence` accepts any number of parsers as arguments and matches them in order, yielding a tuple pf all of their results.

<!-- snippet: example-sequence -->
<a id='snippet-example-sequence'></a>
```ts
const parser = P.sequence(P.string('a'), P.string('b')).thenEof(); // matches 'a' then 'b'

expect(parser.parse('ab')).toEqual(['a', 'b']); // succeeds, yields ['a', 'b']

expect(() => parser.parse('')).toThrow(); // fails
expect(() => parser.parse('a')).toThrow(); // fails
expect(() => parser.parse('ba')).toThrow(); // fails
expect(() => parser.parse('foo')).toThrow(); // fails
```
<sup><a href='/tests/Examples.test.ts#L75-L84' title='Snippet source file'>snippet source</a> | <a href='#snippet-example-sequence' title='Start of snippet'>anchor</a></sup>
<!-- endSnippet -->

#### Matching Something Many Times

`Parser.many(): Parser<SType[]>`

`Parser.many` makes a parser match itself as many times as it can in a row, yielding an array of the parser's result.

<!-- snippet: example-many -->
<a id='snippet-example-many'></a>
```ts
const parser = P.string('a').many().thenEof(); // matches 'a' as many times as it can

expect(parser.parse('')).toEqual([]); // succeeds, yields []
expect(parser.parse('a')).toEqual(['a']); // succeeds, yields ['a']
expect(parser.parse('aaa')).toEqual(['a', 'a', 'a']); // succeeds, yields ['a', 'a', 'a']

expect(() => parser.parse('foo')).toThrow(); // fails
expect(() => parser.parse('aafoo')).toThrow(); // fails
```
<sup><a href='/tests/Examples.test.ts#L88-L97' title='Snippet source file'>snippet source</a> | <a href='#snippet-example-many' title='Start of snippet'>anchor</a></sup>
<!-- endSnippet -->

#### Transforming what a Parser Yields

`Parser.map<OtherSType extends STypeBase>(fn: (value: SType) => OtherSType): Parser<OtherSType>`

`Parser.map` allows for the transformation of the yielded value of a parser.

<!-- snippet: example-map -->
<a id='snippet-example-map'></a>
```ts
const parser = P.regexp(/^[0-9]+/).map(x => Number(x)); // matches a number, yielding the number as a number, not a string

expect(parser.parse('1')).toEqual(1); // succeeds, yields '1' as a number
expect(parser.parse('123')).toEqual(123); // succeeds, yields '123' as a number

expect(() => parser.parse('')).toThrow(); // fails
expect(() => parser.parse('foo')).toThrow(); // fails
```
<sup><a href='/tests/Examples.test.ts#L101-L109' title='Snippet source file'>snippet source</a> | <a href='#snippet-example-map' title='Start of snippet'>anchor</a></sup>
<!-- endSnippet -->

### There are More

parsiNOM has a lot more combinators and matchers, which are documented using doc comments.

parsiNOM also has `P_UTILS` which contains a lot of utility parsers, such as parsers for binary expressions, that can simplify building a parser.

### Examples

The folder `test/languages` contains a few parsers written using parsiNOM, which you can use as a reference.

## Technical Things

parsiNOM parsers are [LL(infinity)](https://en.wikipedia.org/wiki/LL_parser) parser, meaning the following.

- the parser works left to right on the input
- the parser applies the left most derivation first
- the parser is a top-down parser
- the parser is restricted to context-free languages (this might not hold true, since `Parser.chain` exists)
- the parser does not directly support left recursion (it will lead to an infinite loop), but there is a workaround using `Parser.many` and `Array.reduce`
- the parser supports infinite lookahead

## Development

parsiNOM uses `tsc` to build and `bun` to test.

Development setup

- install bun (if you don't have it already)
- run `bun install`
- run `bun run test` to test
- run `bun run build` to build parsiNOM
- run `bun run format` to reformat the code

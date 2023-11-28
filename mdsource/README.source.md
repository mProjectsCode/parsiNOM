# parsiNOM

parsiNOM is a modern, optimized and typesafe parser combinator library, inspired by [parsimmon](https://github.com/jneen/parsimmon).

parsiNOM has not yet reached stable, so breaking changes can still occur in minor versions.

## What is a Parser Combinator?

The idea behind parser combinator is to construct your parser out of a bunch of small parsers.
This makes building parsers easier and more readable.
On top of that, parser combinators make testing your parser easier, as every part of the parser, such as the parser for string literals, can be tested individually.

### Important Terms

- `combinator` a function that usually takes in one or more parsers and returns a single combined parser
- `matcher` a matcher is a parser that is not constructed from other parsers
- `yield`/`yields` in this case `yield` refers to the value that a parser generates from a specific input string, if it can match. In the code a parser is generic over the value that it yields, meaning `Parser<string[]>` will yield an array of strings.

### Basic Matchers

parsiNOM provides many matchers, which are documented using doc comments. Here we will look at the two most basic matchers.

#### String Matcher

`P.string(str: string): Parser<string>`

`P.string` returns a parser that matches `str` and yields `str`.

snippet: example-string-matcher

To assert that the parser is at the end of input after parsing you can use `.thenEof()`.

snippet: example-string-matcher-then-eof

#### RegExp

`P.regexp(regexp: RegExp, group?: number | undefined): Parser<string>`

`P.regexp` returns a parser that matches the regexp `regexp` and yields the matched string or optionally a specific capture group.
Most of the time you want to use `^` to only match at the current parser position.

snippet: example-regexp-matcher

### Basic Combinators

The most important parser combinators are `or`, `sequence`, `many` and `map`, but parsiNOM provides many other combinators build on top of these.

#### Matching Multiple Options

`P.or<ParserArr extends readonly Parser<unknown>[]>(...parsers: ParserArr): Parser<TupleToUnion<DeParserArray<ParserArr>>>`

`P.or` accepts any number of parsers as arguments and yields the value of the first parser that succeeds.
Because of that the order of the parsers is important.

snippet: example-or

In the following example the order of parsers matters.

snippet: example-or-order-wrong

snippet: example-or-order-correct

#### Matching a Sequence

`P.sequence<ParserArr extends readonly Parser<unknown>[]>(...parsers: ParserArr): Parser<DeParserArray<ParserArr>>`

`P.sequence` accepts any number of parsers as arguments and matches them in order, yielding a tuple pf all of their results.

snippet: example-sequence

#### Matching Something Many Times

`Parser.many(): Parser<SType[]>`

`Parser.many` makes a parser match itself as many times as it can in a row, yielding an array of the parser's result.

snippet: example-many

#### Transforming what a Parser Yields

`Parser.map<OtherSType extends STypeBase>(fn: (value: SType) => OtherSType): Parser<OtherSType>`

`Parser.map` allows for the transformation of the yielded value of a parser.

snippet: example-map

### There are More

parsiNOM has a lot more combinators and matchers, which are documented using doc comments.

parsiNOM also has `P_UTILS` which contains a lot of utility parsers, such as parsers for binary expressions, that can simplify building a parser.

### Examples

The folder `examples` contains a few parsers written using parsiNOM, which you can use as a reference. The tests for these parsers are located in `tests/examples`.

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

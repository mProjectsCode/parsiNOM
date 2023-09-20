# parsiNOM

parsiNOM is a modern and optimized parser combinator library, inspired by [parsimmon](https://github.com/jneen/parsimmon).

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

```ts
const parser = P.string('foo'); // matches the string foo

parser.parse('foo') // succeeds, yields 'foo'
parser.parse('foobar') // succeeds, yields 'foo'

parser.parse('') // fails
parser.parse('bar') // fails
```

#### RegExp

`P.regexp(regexp: RegExp, group?: number | undefined): Parser<string>`

`P.regexp` returns a parser that matches the regexp `regexp` and yields the matched string or optionally a specific capture group.
Most of the time you want to use `^` to only match at the current parser position.

```ts
const parser = P.regexp(/^[0-9]+/); // matches multiple digits

parser.parse('1') // succeeds, yields '1' as a string
parser.parse('123') // succeeds, yields '123' as a string

parser.parse('') // fails
parser.parse('foo') // fails
```

### Basic Combinators

The most important parser combinators are `or`, `sequence`, `many` and `map`, but parsiNOM provides many other combinators build on top of these.

#### Matching Multiple Options

#### Matching a Sequence

#### Matching Something Many Times

#### Transforming what a Parser Yields


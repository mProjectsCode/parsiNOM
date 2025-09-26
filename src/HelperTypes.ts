import type { Parser } from './Parser';
import type { ParserContext } from './ParserContext';

export type STypeBase = unknown;

export interface ParseSuccess<SType extends STypeBase> {
	success: true;
	value: SType;
	furthest?: undefined;
	expected?: undefined;
}

export interface ParseFailure {
	success: false;
	value: undefined;
	furthest: number;
	expected: string[];
}

export type ParseResult<SType extends STypeBase> = ParseSuccess<SType> | ParseFailure;

export interface InternalParseFailure {
	success: false;
	value: undefined;
}

export type InternalParseResult<SType extends STypeBase> = ParseSuccess<SType> | InternalParseFailure;

export type ParseFunction<SType extends STypeBase> = (context: ParserContext) => InternalParseResult<SType>;

export interface ParsingRange {
	from: number;
	to: number;
}

export interface ParsingMarker<SType extends STypeBase> {
	value: SType;
	range: ParsingRange;
}

export interface NamedParsingMarker<SType extends STypeBase> {
	value: SType;
	name: string;
	range: ParsingRange;
}

export type LanguageDef<RuleNames extends object> = {
	[P in keyof RuleNames]: Parser<RuleNames[P]>;
};

export type LanguageRules<RuleNames extends object> = {
	[P in keyof RuleNames]: (language: LanguageDef<RuleNames>) => Parser<RuleNames[P]>;
};

/**
 * All parsers of a language. Returned by {@link P.createLanguage}.
 */
export type NomLanguage<RulesType extends object> = {
	[P in keyof RulesType]: Parser<RulesType[P]>;
};

/**
 * All parsers of a language. Returned by {@link P.createLanguage}.
 */
export type NomLanguageRules<RulesType extends object> = {
	readonly [P in keyof RulesType]: (language: NomLanguagePartial<RulesType>, ref: NomLanguageRef<RulesType>) => Parser<RulesType[P]>;
};

/**
 * All parsers of a language wrapped in {@link P.reference}.
 */
export type NomLanguageRef<RulesType extends object> = {
	[P in keyof RulesType]: ParserRef<RulesType[P]>;
};

/**
 * Parsers of a language that came before this parser. All other parsers will be undefined.
 */
export type NomLanguagePartial<RulesType extends object> = {
	[P in keyof RulesType]: Parser<RulesType[P]>;
};

export type ParserRef<SType extends STypeBase> = Parser<SType>;

export type TupleToUnion<T extends readonly unknown[]> = T[number];

export type DeParser<T extends Parser<unknown>> = T extends Parser<infer U> ? U : never;

export type DeParserArray<T extends readonly Parser<unknown>[]> = {
	[I in keyof T]: T[I] extends Parser<infer R> ? R : never;
};

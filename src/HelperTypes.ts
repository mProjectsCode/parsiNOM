import { Parser } from './Parser';
import { ParserContext } from './ParserContext';

export type STypeBase = any;

export interface ParseSuccess<SType extends STypeBase> {
	success: true;
	position: ParsingPosition;
	value: SType;
	furthest: ParsingPosition;
	expected: string[];
}

export interface ParseFailure {
	success: false;
	position: ParsingPosition;
	value: unknown | undefined;
	furthest: ParsingPosition;
	expected: string[];
}

export type ParseResult<SType extends STypeBase> = ParseSuccess<SType> | ParseFailure;

export type ParseFunction<SType extends STypeBase> = (context: ParserContext) => ParseResult<SType>;

export interface ParsingPosition {
	readonly index: number;
	readonly line: number;
	readonly column: number;
}

export interface ParsingMarker<SType extends STypeBase> {
	start: ParsingPosition;
	value: SType;
	end: ParsingPosition;
}

export interface ParsingNode<SType extends STypeBase> {
	name: string;
	start: ParsingPosition;
	value: SType;
	end: ParsingPosition;
}

export type LanguageDef<RuleNames extends object> = {
	[P in keyof RuleNames]: Parser<RuleNames[P]>;
};

export type LanguageRules<RuleNames extends object> = {
	[P in keyof RuleNames]: (language: LanguageDef<RuleNames>) => Parser<RuleNames[P]>;
};

export type TupleToUnion<T extends readonly unknown[]> = T[number];

export type DeParser<T extends Parser<unknown>> = T extends Parser<infer U> ? U : never;

export type DeParserArray<T extends readonly Parser<unknown>[]> = {
	[I in keyof T]: T[I] extends Parser<infer R> ? R : never;
};

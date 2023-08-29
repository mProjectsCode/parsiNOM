import { Parser, STypeBase } from './Parser';

export type TupleToUnion<T extends readonly unknown[]> = T[number];

export type DeParser<T extends Parser<unknown>> = T extends Parser<infer U> ? U : never;

export type DeParserArray<T extends readonly Parser<unknown>[]> = {
	[I in keyof T]: T[I] extends Parser<infer R> ? R : never;
};

import { P } from '../src/ParsiNOM';
import { P_UTILS } from '../src/ParserUtils';

export interface JSONLanguage {
	number: number;
	string: string;
	boolean: boolean;
	null: null;

	array: unknown[];
	objectEntry: { key: string; value: unknown };
	object: Record<string, unknown>;

	value: number | string | boolean | unknown[] | unknown;
}

export const jsonLanguage = P.createLanguage<JSONLanguage>({
	number: () =>
		P.or(
			P.sequenceMap((a, b, c) => Number(a + b + c), P_UTILS.digits(), P.string('.'), P_UTILS.digits()),
			P_UTILS.digits().map(x => Number(x)),
		),
	string: () => P.manyNotOf('"').trim(P.string('"')),
	boolean: () => P.or(P.string('true').result(true), P.string('false').result(false)),
	null: () => P.string('null').result(null),

	array: (_, ref) => ref.value.separateBy(P.string(',')).wrap(P.string('['), P.string(']')),
	objectEntry: (language, ref) =>
		P.sequenceMap(
			(_1, key, _2, _3, value) => ({ key, value }),
			P_UTILS.optionalWhitespace(),
			language.string,
			P_UTILS.optionalWhitespace(),
			P.string(':'),
			ref.value,
		),
	object: (language, ref) =>
		language.objectEntry
			.separateBy(P.string(','))
			.map(x => {
				const obj = {} as Record<string, unknown>;
				for (const element of x) {
					obj[element.key] = element.value;
				}
				return obj;
			})
			.wrap(P.string('{'), P.string('}')),
	value: language =>
		P.or(language.null, language.boolean, language.number, language.string, language.array, language.object).trim(P_UTILS.optionalWhitespace()),
});

export const jsonLanguageRegexp = P.createLanguage<JSONLanguage>({
	number: () =>
		P.regexp(/^[0-9]+(\.[0-9]+)?/)
			.map(x => Number(x))
			.describe('number'),
	string: () => P.regexp(/^"([^"]*)"/, 1).describe('string'),
	boolean: () => P.or(P.string('true').result(true), P.string('false').result(false)),
	null: () => P.string('null').result(null),

	array: (_, ref) => ref.value.separateBy(P.string(',')).wrap(P.string('['), P.string(']')),
	objectEntry: (language, ref) =>
		P.sequenceMap(
			(_1, key, _2, _3, value) => ({ key, value }),
			P_UTILS.optionalWhitespace(),
			language.string,
			P_UTILS.optionalWhitespace(),
			P.string(':'),
			ref.value,
		),
	object: (language, ref) =>
		language.objectEntry
			.separateBy(P.string(','))
			.map(x => {
				const obj = {} as Record<string, unknown>;
				for (const element of x) {
					obj[element.key] = element.value;
				}
				return obj;
			})
			.wrap(P.string('{'), P.string('}')),
	value: language =>
		P.or(language.null, language.boolean, language.number, language.string, language.array, language.object).trim(P_UTILS.optionalWhitespace()),
});

export const jsonParser = jsonLanguage.value.thenEof();
export const jsonParserRegexp = jsonLanguageRegexp.value.thenEof();

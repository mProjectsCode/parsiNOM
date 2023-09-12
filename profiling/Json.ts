import { P } from '../src/ParsiNOM';
import { P_UTILS } from '../src/ParserUtils';

export interface JSONLanguage {
	number: number;
	string: string;
	boolean: boolean;
	null: null;

	array: unknown[];
	object: Record<string, unknown>;

	value: number | string | boolean | unknown[] | unknown;
}

export const jsonLanguage = P.createLanguage<JSONLanguage>({
	number: () =>
		P.sequenceMap(
			(a, b) => (b === undefined ? Number(a) : Number(a + b[0] + b[1])),
			P_UTILS.digits(),
			P.sequence(P.string('.'), P_UTILS.digits()).optional(),
		).describe('number'),
	string: () =>
		P.noneOf('"')
			.many()
			.map(x => x.join(''))
			.trim(P.string('"')),
	boolean: () => P.or(P.string('true').result(true), P.string('false').result(false)).describe('boolean'),
	null: () => P.string('null').result(null).describe('null'),

	array: (_, ref) => ref.value.separateBy(P.string(',')).wrap(P.string('['), P.string(']')),
	object: (language, ref) =>
		P.sequenceMap(
			(_1, key, _2, _3, value) => {
				return { key: key, value: value };
			},
			P_UTILS.optionalWhitespace(),
			language.string.describe('key'),
			P_UTILS.optionalWhitespace(),
			P.string(':'),
			ref.value,
		)
			.separateBy(P.string(','))
			.map(x => {
				const obj: Record<string, unknown> = {};
				for (const kvPair of x) {
					if (kvPair.value !== undefined) {
						obj[kvPair.key] = kvPair.value;
					}
				}
				return obj;
			})
			.wrap(P.string('{'), P.string('}')),
	value: language =>
		P.or(language.number, language.string, language.boolean, language.array, language.object, language.null).trim(P_UTILS.optionalWhitespace()),
});

export const jsonParser = jsonLanguage.value.thenEof();

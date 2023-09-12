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
		P.sequenceMap((a, b) => (b === undefined ? Number(a) : Number(a + b[0] + b[1])), P_UTILS.digits(), P.sequence(P.string('.'), P_UTILS.digits()).optional()),
	string: () =>
		P.noneOf('"')
			.many()
			.map(x => x.join(''))
			.trim(P.string('"')),
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
		P.or(language.number, language.string, language.boolean, language.array, language.object, language.null).trim(P_UTILS.optionalWhitespace()),
});

export const jsonParser = jsonLanguage.value.thenEof();

import { P } from '../../src/ParsiNOM';
import { P_UTILS } from '../../src/ParserUtils';

interface JSONLanguage {
	number: number;
	string: string;
	boolean: boolean;
	null: null;

	array: unknown[];
	object: Record<string, unknown>;

	value: number | string | boolean | unknown[] | unknown;
}

const jsonLanguage = P.createLanguage<JSONLanguage>({
	number: () =>
		P_UTILS.digits()
			.map(x => Number(x))
			.describe('number'),
	string: () => P.noneOf('"').trim(P.string('"')).describe('string'),
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

const jsonParser = jsonLanguage.value;

describe('json parser', () => {
	const testCases: unknown[] = ['1', [1, '2'], { a: 1, b: ['2', false] }, { a: { b: '1' }, b: null, c: undefined }];

	for (const testCase of testCases) {
		test(JSON.stringify(testCase), () => {
			const res = jsonParser.tryParse(JSON.stringify(testCase));
			console.log(testCase, res);

			// expect(res.success).toBe(true);
			expect(res.value).toEqual(testCase);
		});
	}
});

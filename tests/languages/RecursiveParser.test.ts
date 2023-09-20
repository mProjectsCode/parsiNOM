import { Parser } from '../../src/Parser';
import { P } from '../../src/ParsiNOM';

const number = P.regexp(/^[0-9]+/);
const recursiveParser: Parser<string> = P.or(P.reference(() => recursiveParser).wrap(P.string('('), P.string(')')), number);
const recursiveParser2: Parser<string> = P.or(P.reference(() => recursiveParser).wrap(P.string('('), P.string(')')), number);

interface Rec3Lang {
	number: string;
	a: string;
	b: string;
}

const lParen = P.string('(');
const rParen = P.string(')');
const lBracket = P.string('[');
const rBracket = P.string(']');

const recursiveParser3 = P.createLanguage<Rec3Lang>({
	number: () => P.regexp(/^[0-9]+/),
	a: (l, r) => P.or(l.number, r.b.wrap(lParen, rParen)),
	b: l => l.a.wrap(lBracket, rBracket),
});

describe('recursive parser test', () => {
	const testCases: string[] = ['1', '(1)', '((1))'];

	for (const testCase of testCases) {
		test(testCase, () => {
			const res = recursiveParser.tryParse(testCase);
			// console.log(testCase, res);

			expect(res.success).toBe(true);
		});
	}
});

describe('recursive parser 2 test', () => {
	const testCases: string[] = ['1', '(1)', '((1))'];

	for (const testCase of testCases) {
		test(testCase, () => {
			const res = recursiveParser2.tryParse(testCase);
			// console.log(testCase, res);

			expect(res.success).toBe(true);
		});
	}
});

describe('recursive parser 3 test', () => {
	const testCases: string[] = ['1', '([1])', '([([1])])'];

	for (const testCase of testCases) {
		test(testCase, () => {
			const res = recursiveParser3.a.tryParse(testCase);
			// console.log(testCase, res);

			expect(res.success).toBe(true);
		});
	}
});

describe('recursive parser language def fail', () => {
	test('invalid rule access to fail', () => {
		expect(() => {
			P.createLanguage<Rec3Lang>({
				number: () => P.regexp(/^[0-9]+/),
				a: (l, r) => P.or(l.number, l.b.wrap(lParen, rParen)),
				b: l => l.a.wrap(lBracket, rBracket),
			});
		}).toThrow("Can not access rule 'b' in language");
	});
});

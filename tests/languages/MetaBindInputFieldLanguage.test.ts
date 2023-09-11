import { Parser } from '../../src/Parser';
import { P } from '../../src/ParsiNOM';
import { P_UTILS } from '../../src/ParserUtils';
import { ParseFailure } from '../../src/HelperTypes';

interface InputFieldArgument {
	name: string;
	value: string[];
}

interface BindTarget {
	file: string | undefined;
	path: string;
}

interface InputFieldDeclaration {
	type: string;
	args: InputFieldArgument[];
	bindTarget: BindTarget | undefined;
}

const quote = `'`;

const ident = P.regexp(/^[a-z]+/i)
	.map(x => {
		// console.log('ident', x);
		return x;
	})
	.describe('identifier');

const spaceIdent = P.sequenceMap(
	(a, b) => {
		return a + b.map(x => x[0] + x[1]).join();
	},
	ident,
	P.sequence(P_UTILS.optionalWhitespace(), ident).many(),
).describe('identifier with spaces');

const str = P.string(quote)
	.then(
		P.noneOf(quote)
			.many()
			.map(x => x.join('')),
	)
	.skip(P.string(quote));

const specialIdent = P.regexp(/^[^ \t\n\r()',]+/).describe('any character except whitespace, parentheses, single quotation marks and commas');

const specialSpaceIdent = P.sequenceMap(
	(a, b) => {
		return a + b.map(x => x[0] + x[1]).join();
	},
	specialIdent,
	P.sequence(P_UTILS.optionalWhitespace(), specialIdent).many(),
).describe('any character except parentheses');

const value = P.or(specialSpaceIdent, str);

const bindTarget: Parser<BindTarget> = P.sequenceMap(
	(a, b) => {
		if (a === undefined) {
			return {
				file: undefined,
				path: b,
			};
		} else {
			return {
				file: a[0],
				path: b,
			};
		}
	},
	P.sequence(ident, P.string('#')).optional(),
	ident,
);

const inputFieldArgumentValue = P.separateBy(value, P.string(',').trim(P_UTILS.optionalWhitespace()));

const inputFieldArgument = P.sequenceMap(
	(name, value): InputFieldArgument => {
		return {
			name: name,
			value: value,
		};
	},
	ident,
	inputFieldArgumentValue
		.trim(P_UTILS.optionalWhitespace())
		.wrap(P.string('('), P.string(')'))
		.optional([] as string[]),
);

const inputFieldArguments = P.separateBy(inputFieldArgument, P.string(',').trim(P_UTILS.optionalWhitespace()));

const declaration: Parser<InputFieldDeclaration> = P.sequenceMap(
	(type, args, b) => {
		const bindTarget = b === undefined ? undefined : b[1];
		return {
			type: type,
			args: args,
			bindTarget: bindTarget,
		};
	},
	ident.describe('input field type'),
	inputFieldArguments
		.trim(P_UTILS.optionalWhitespace())
		.wrap(P.string('('), P.string(')'))
		.optional([] as InputFieldArgument[]),
	P.sequence(P.string(':'), bindTarget).optional(),
);

const fullDeclaration = P.sequenceMap(
	(_1, _2, declaration, _3) => {
		return declaration;
	},
	P.string('INPUT'),
	P.string('['),
	declaration,
	P.string(']'),
);

describe('input fields', () => {
	const testCases: [string, boolean][] = [
		['INPUT[toggle():togg]', true],
		['INPUT[list(option):file#somethings]', true],
		['INPUT[list(option()):file#somethings]', true],
		['INPUT[list(option(test)):file#somethings]', true],
		['INPUT[list(option( test foo bar , baz )):file#somethings]', true],
		["INPUT[list(option('asd asd ()')):file#somethings]", true],
		["INPUT[list(option('asd asd ()',asd,'ab')):file#somethings]", true],
		["INPUT[list(option('asd asd (),asd,'ab')):file#somethings]", false],
		["INPUT[list(option('asd asd (),asd,)):file#somethings]", false],
	];

	for (const [testCase, expected] of testCases) {
		test(testCase, () => {
			const res = fullDeclaration.tryParse(testCase);
			console.log(testCase, JSON.stringify(res, undefined, 4));

			expect(res.success).toBe(expected);
			if (!res.success) {
				console.log(P.createError(testCase, res as ParseFailure));
			}
		});
	}
});

import { P } from '../../src/ParsiNOM';
import { ParsingRange } from '../../src/HelperTypes';

class NodeClass<T> {
	value: T;
	range: ParsingRange;

	constructor(value: T, range: ParsingRange) {
		this.value = value;
		this.range = range;
	}
}

describe.each([
	['', false],
	['this', true],
	['foo', false],
])(`node '%s'`, (str, expected) => {
	const parser = P.string('this')
		.node((value, range) => new NodeClass(value, range))
		.thenEof();
	const result = parser.tryParse(str);

	test(`success to be ${expected}`, () => {
		expect(result.success).toBe(expected);
	});

	if (expected) {
		test(`AST to match snapshot`, () => {
			expect(result.value).toMatchSnapshot();
		});
	} else {
		test(`Error to match snapshot`, () => {
			expect({
				pos: result.furthest,
				expected: result.expected,
			}).toMatchSnapshot();
		});
	}
});

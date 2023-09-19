import { P } from '../../src/ParsiNOM';
import { ParsingRange } from '../../src/HelperTypes';
import { testParser } from '../TestHelpers';
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
])(`node '%s'`, (str, shouldSucceed) => {
	const parser = P.string('this')
		.node((value, range) => new NodeClass(value, range))
		.thenEof();
	testParser(parser, str, shouldSucceed);
});

import { P } from '../../src/ParsiNOM';
import { P_UTILS } from '../../src/ParserUtils';
import { testParser } from '../TestHelpers';

describe.each([
	['a', true],
	['a+a', true],
	['a + a', true],
	['a + b', true],
	['a + b+c', true],
	['a + b + c', true],
	['ab+', false],
	['+ab', false],
	['bcaba', false],
])(`binary left`, (str, shouldSucceed) => {
	const parser = P_UTILS.binaryLeft(P.string('+'), P.oneStringOf(['a', 'b', 'c']), (a, b, c) => [a, b, c]).thenEof();
	testParser(parser, str, shouldSucceed);
});

describe.each([
	['a', true],
	['a+a', true],
	['a + a', true],
	['a + b', true],
	['a + b+c', true],
	['a + b + c', true],
	['ab+', false],
	['+ab', false],
	['bcaba', false],
])(`binary right`, (str, shouldSucceed) => {
	const parser = P_UTILS.binaryRight(P.string('+'), P.oneStringOf(['a', 'b', 'c']), (a, b, c) => [a, b, c]).thenEof();
	testParser(parser, str, shouldSucceed);
});

describe.each([
	['a', true],
	['-a', true],
	['--a', true],
	['a - b', false],
	['ab-', false],
	['-ab', false],
	['bcaba', false],
])(`prefix`, (str, shouldSucceed) => {
	const parser = P_UTILS.prefix(P.string('-'), P.string('a'), (a, b) => [a, b]).thenEof();
	testParser(parser, str, shouldSucceed);
});

describe.each([
	['a', true],
	['a-', true],
	['a--', true],
	['a- b', false],
	['ab-', false],
	['-ab', false],
	['bcaba', false],
])(`postfix`, (str, shouldSucceed) => {
	const parser = P_UTILS.postfix(P.string('-'), P.string('a'), (a, b) => [a, b]).thenEof();
	testParser(parser, str, shouldSucceed);
});

describe.each([
	['a', false],
	['a()', false],
	['a(b)', true],
	['a (b)', false],
	['(b)', false],
	['a b', false],
	['foo', false],
])(`function`, (str, shouldSucceed) => {
	const parser = P_UTILS.func(P.string('a'), P.string('b'), (a, b) => [a, b]).thenEof();
	testParser(parser, str, shouldSucceed);
});

// describe('binary perf', () => {
// 	const binLeft = P_UTILS.binaryLeft(P.string('+'), P_UTILS.digits(), (a, op, b) => ({ op: op, lhs: a, rhs: b }));
// 	const binRight = P_UTILS.binaryRight(P.string('+'), P_UTILS.digits(), (a, op, b) => ({ op: op, lhs: a, rhs: b }));
//
// 	const str = '1 + 20 + 3 + 40 + 5 + 60 + 7 + 80 + 9 + 100';
//
// 	it('long expression', async () => {
// 		await benchmark.record(
// 			['binary left'],
// 			() => {
// 				for (let i = 0; i < 1000; i++) {
// 					binLeft.tryParse(str);
// 				}
// 			},
// 			{ iterations: 100 },
// 		);
//
// 		await benchmark.record(
// 			['binary right'],
// 			() => {
// 				for (let i = 0; i < 1000; i++) {
// 					binRight.tryParse(str);
// 				}
// 			},
// 			{ iterations: 100 },
// 		);
// 	});
// });

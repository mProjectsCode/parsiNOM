import { P } from '../../src/ParsiNOM';
import { testParser } from '../TestHelpers';
describe.each([
	['', false],
	['a', true],
	['b', true],
	['m', true],
	['n', false],
	['z', false],
	['#', false],
	['A', false],
	['B', false],
	['M', false],
	['N', false],
	['Z', false],
])(`sequence`, (str, shouldSucceed) => {
	const parser = P.range('a', 'm');
	testParser(parser, str, shouldSucceed);
});

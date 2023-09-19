import { P } from '../../src/ParsiNOM';
import { testParser } from '../TestHelpers';
describe.each([
	['', true],
	['this', true],
	['that', true],
	['thisthat', true],
	['thisthatfoo', true],
	['foo', true],
])(`succeed '%s'`, (str, shouldSucceed) => {
	const parser = P.succeed('value');
	testParser(parser, str, shouldSucceed);
});

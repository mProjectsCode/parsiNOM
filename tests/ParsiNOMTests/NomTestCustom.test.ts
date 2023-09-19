import { P } from '../../src/ParsiNOM';
import { testParser } from '../TestHelpers';
describe.each([
	['', true],
	['this', true],
	['that', true],
	['thisthat', true],
	['thisthatfoo', true],
	['foo', true],
])(`custom '%s'`, (str, shouldSucceed) => {
	const parser = P.custom(context => context.succeed('value'));
	testParser(parser, str, shouldSucceed);
});

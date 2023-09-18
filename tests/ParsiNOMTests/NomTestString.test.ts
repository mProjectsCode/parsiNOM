import { P } from '../../src/ParsiNOM';
import {testParser} from '../TestHelpers';
describe.each([
	['', false],
	['this', true],
	['thisthat', true],
	['foo', false],
])(`string '%s'`, (str, shouldSucceed) => {
	const parser = P.string('this');
	testParser(parser, str, shouldSucceed);
});

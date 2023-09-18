import { P } from '../../src/ParsiNOM';
import {testParser} from '../TestHelpers';
describe.each([
	['', false],
	['this', true],
	['thisfoo', true],
	['thisthat', false],
	['that', false],
	['thatthis', false],
	['foo', false],
])(`notFollowedBy '%s'`, (str, shouldSucceed) => {
	const parser = P.string('this').namedMarker('before').notFollowedBy(P.string('that')).namedMarker('after');
	testParser(parser, str, shouldSucceed);
});

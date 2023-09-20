import { P } from '../../src/ParsiNOM';
import { testParser } from '../TestHelpers';
describe.each([
	['', false],
	['thisthat', true],
	['this', false],
	['that', false],
	['thatthis', false],
	['foo', false],
])(`followedBy`, (str, shouldSucceed) => {
	const parser = P.string('this').namedMarker('before').followedBy(P.string('that')).namedMarker('after');
	testParser(parser, str, shouldSucceed);
});

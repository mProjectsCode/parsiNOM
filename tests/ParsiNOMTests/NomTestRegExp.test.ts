import { P } from '../../src/ParsiNOM';
import {testParser} from '../TestHelpers';
describe.each([
	['', false],
	['this', true],
	['thisthat', true],
	['2thisthat', false],
	['&foo', false],
])(`regexp '%s'`, (str, shouldSucceed) => {
	const parser = P.regexp(/^[a-z]+/);
	testParser(parser, str, shouldSucceed);
});

describe('regexp invalid flag', () => {
	test(`'g' flag to be invalid`, () => {
		expect(() => {
			P.regexp(/a/g);
		}).toThrow('not allowed');
	});

	test(`'y' flag to be invalid`, () => {
		expect(() => {
			P.regexp(/a/y);
		}).toThrow('not allowed');
	});
});

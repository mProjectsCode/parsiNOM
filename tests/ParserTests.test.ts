import { P } from '../src/Helpers';
import { testParse } from './TestHelpers';

describe('or', () => {
	const parser = P.string('this').or(P.string('that')).skip(P.eof);
	const matchingTable: [string, boolean][] = [
		['', false],
		['this', true],
		['that', true],
		['thisthat', false],
		['thatthis', false],
		['foo', false],
	];

	for (const [str, result] of matchingTable) {
		testParse(parser, str, result);
	}
});

describe('trim', () => {
	describe('fixed length', () => {
		const parser = P.string('this').trim(P.string(' ')).skip(P.eof);
		const matchingTable: [string, boolean][] = [
			['', false],
			[' this ', true],
			['this ', false],
			[' this', false],
			['  this', false],
			['foo', false],
		];

		for (const [str, result] of matchingTable) {
			testParse(parser, str, result);
		}
	});

	describe('variable length', () => {
		const parser = P.string('this').trim(P.optWhitespace).skip(P.eof);
		const matchingTable: [string, boolean][] = [
			['', false],
			[' this ', true],
			['this ', true],
			[' this', true],
			['  this', true],
			['foo', false],
		];

		for (const [str, result] of matchingTable) {
			testParse(parser, str, result);
		}
	});
});

describe('wrap', () => {
	const parser = P.string('this').wrap(P.string('('), P.string(')')).skip(P.eof);
	const matchingTable: [string, boolean][] = [
		['', false],
		['(this)', true],
		['this)', false],
		['(this', false],
		[')this(', false],
		['foo', false],
	];

	for (const [str, result] of matchingTable) {
		testParse(parser, str, result);
	}
});

describe('then', () => {
	const parser = P.string('this').then(P.string('that')).skip(P.eof);
	const matchingTable: [string, boolean][] = [
		['', false],
		['thisthat', true],
		['this', false],
		['that', false],
		['thatthis', false],
		['foo', false],
	];

	for (const [str, result] of matchingTable) {
		testParse(parser, str, result);
	}
});

describe('many', () => {
	const parser = P.string('a').many().skip(P.eof);
	const matchingTable: [string, boolean][] = [
		['', true],
		['a', true],
		['aa', true],
		['aaa', true],
		['abaa', false],
	];

	for (const [str, result] of matchingTable) {
		testParse(parser, str, result);
	}
});

describe('repeat', () => {
	const parser = P.string('a').repeat(1, 2).skip(P.eof);
	const matchingTable: [string, boolean][] = [
		['', false],
		['a', true],
		['aa', true],
		['aaa', false],
		['abaa', false],
	];

	for (const [str, result] of matchingTable) {
		testParse(parser, str, result);
	}
});

describe('result', () => {
	const parser = P.string('this').result('result').skip(P.eof);
	const matchingTable: [string, boolean][] = [
		['', false],
		['this', true],
		['foo', false],
	];

	for (const [str, result] of matchingTable) {
		testParse(parser, str, result);
	}
});

describe('atMost', () => {
	const parser = P.string('a').atMost(2).skip(P.eof);
	const matchingTable: [string, boolean][] = [
		['', true],
		['a', true],
		['aa', true],
		['aaa', false],
		['abaa', false],
	];

	for (const [str, result] of matchingTable) {
		testParse(parser, str, result);
	}
});

describe('atLeast', () => {
	const parser = P.string('a').atLeast(2).skip(P.eof);
	const matchingTable: [string, boolean][] = [
		['', false],
		['a', false],
		['aa', true],
		['aaa', true],
		['abaa', false],
	];

	for (const [str, result] of matchingTable) {
		testParse(parser, str, result);
	}
});

describe('map', () => {
	const parser = P.string('this')
		.map(x => x + ' is the result')
		.skip(P.eof);
	const matchingTable: [string, boolean][] = [
		['', false],
		['this', true],
		['foo', false],
	];

	for (const [str, result] of matchingTable) {
		testParse(parser, str, result);
	}
});

describe('skip', () => {
	const parser = P.string('this').skip(P.eof);
	const matchingTable: [string, boolean][] = [
		['', false],
		['this', true],
		['foo', false],
	];

	for (const [str, result] of matchingTable) {
		testParse(parser, str, result);
	}
});

describe('mark', () => {
	const parser = P.string('this').mark().skip(P.eof);
	const matchingTable: [string, boolean][] = [
		['', false],
		['this', true],
		['foo', false],
	];

	for (const [str, result] of matchingTable) {
		testParse(parser, str, result);
	}
});

describe('node', () => {
	const parser = P.string('this').node('fancy node').skip(P.eof);
	const matchingTable: [string, boolean][] = [
		['', false],
		['this', true],
		['foo', false],
	];

	for (const [str, result] of matchingTable) {
		testParse(parser, str, result);
	}
});

describe('separateBy', () => {
	const parser = P.string('this').separateBy(P.string(',')).skip(P.eof);
	const matchingTable: [string, boolean][] = [
		['', true],
		['this', true],
		['this,this', true],
		['this,this,this', true],
		['this, this', false],
		['foo', false],
	];

	for (const [str, result] of matchingTable) {
		testParse(parser, str, result);
	}
});

describe('separateByNotEmpty', () => {
	const parser = P.string('this').separateByNotEmpty(P.string(',')).skip(P.eof);
	const matchingTable: [string, boolean][] = [
		['', false],
		['this', true],
		['this,this', true],
		['this,this,this', true],
		['this, this', false],
		['foo', false],
	];

	for (const [str, result] of matchingTable) {
		testParse(parser, str, result);
	}
});

describe('lookahead', () => {
	const parser = P.string('this').node('before').lookahead('that').node('after');
	const matchingTable: [string, boolean][] = [
		['', false],
		['thisthat', true],
		['this', false],
		['that', false],
		['thatthis', false],
		['foo', false],
	];

	for (const [str, result] of matchingTable) {
		testParse(parser, str, result);
	}
});

describe('notFollowedBy', () => {
	const parser = P.string('this').node('before').notFollowedBy(P.string('that')).node('after');
	const matchingTable: [string, boolean][] = [
		['', false],
		['this', true],
		['thisfoo', true],
		['thisthat', false],
		['that', false],
		['thatthis', false],
		['foo', false],
	];

	for (const [str, result] of matchingTable) {
		testParse(parser, str, result);
	}
});

describe('describe', () => {
	const parser = P.string('this').describe('some error').skip(P.eof);
	const matchingTable: [string, boolean][] = [
		['', false],
		['this', true],
		['foo', false],
	];

	for (const [str, result] of matchingTable) {
		testParse(parser, str, result);
	}
});

describe('fallback', () => {
	const parser = P.string('this').then(P.string('that').fallback('some fallback')).skip(P.eof);
	const matchingTable: [string, boolean][] = [
		['', false],
		['this', true],
		['thisthat', true],
		['that', false],
		['thatthis', false],
		['foo', false],
	];

	for (const [str, result] of matchingTable) {
		testParse(parser, str, result);
	}
});

describe('chain', () => {
	const parser = P.string('this')
		.or(P.digit.map(x => Number(x)))
		.chain(res => {
			if (typeof res === 'string') {
				return P.string('that');
			} else {
				return P.string('bar');
			}
		})
		.skip(P.eof);
	const matchingTable: [string, boolean][] = [
		['', false],
		['thisthat', true],
		['1bar', true],
		['thisbar', false],
		['1that', false],
		['this', false],
		['1', false],
		['thatthis', false],
		['foo', false],
	];

	for (const [str, result] of matchingTable) {
		testParse(parser, str, result);
	}
});

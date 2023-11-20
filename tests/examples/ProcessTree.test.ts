import { describe } from 'bun:test';
import { testParser } from '../TestHelpers';
import { ProcessTreeParser } from '../../examples/ProcessTree';

describe.each([
	// basic trees
	['a', true],
	['\\tau', true],
	['\\rightarrow(a)', true],
	['\\rightarrow(\\tau)', true],

	// smoke tests - a few process trees
	['\\rightarrow(a,\\circlearrowleft(\\rightarrow(\\wedge(\\times(b, c), d), e ), f ), \\times(g, h))', true],

	// Incorrect trees: empty tree
	['', false],
	// Numbers are not valid event names
	['1', false],
	// Incomplete/typoed sequence operation
	['\\rightarrow', false],
	['\\rightarrow(', false],
	['\\rightarrow)', false],
	['\\rightarrow(a', false],
	['\\rightarrowa)', false],
	// Disallowed starting operations
	['\\wedge(a)', false],
	['\\circlearrowleft(a)', false],
	['\\times(a)', false],
])(`Process Tree Testsuite`, (str, shouldSucceed) => {
	testParser(ProcessTreeParser, str, shouldSucceed);
});

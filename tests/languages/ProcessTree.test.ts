import { P } from '../../src/ParsiNOM';
import { P_UTILS } from '../../src/ParserUtils';
import { Parser } from '../../src/Parser';

import { describe, test, expect } from 'bun:test';
import { testParser } from '../TestHelpers';

type Action = string;

const silentAction = '\\tau';
type SilentAction = typeof silentAction;

const sequence = "\\rightarrow";
type Sequence = typeof sequence;

const loop = "\\circlearrowleft";
type Loop = typeof loop;

const choice = "\\wedge";
type Choice = typeof choice;

const parallel = "\\times";
type Parallel = typeof parallel;

type Operator = Sequence | Loop | Choice | Parallel;

type ElementaryProcessTree = Action | SilentAction;
type ProcessTree = ElementaryProcessTree | Operation<Operator>;

class Operation<OperatorType extends Operator> {
    operator: OperatorType;
    subTrees: ProcessTree[];

    constructor(operator: OperatorType, subTrees: ProcessTree[]) {
        this.operator = operator;
        this.subTrees = subTrees;
    }
}

export interface ProcessTreeLanguage {
    operator: Operator;
    operation: Operation<Operator>;
    simpleTree: ElementaryProcessTree;
    tree: ProcessTree;
    root: Operation<Sequence> | ElementaryProcessTree,
}

export const processTreeLanguage = P.createLanguage<ProcessTreeLanguage>({
    operator: () => P.or(
        P.string(sequence),
        P.string(loop),
        P.string(choice),
        P.string(parallel)
    ) as Parser<Operator>,
    operation: (lang, ref) => P_UTILS.func(
        lang.operator,
        ref.tree.separateBy(P.string(",").trim(P_UTILS.optionalWhitespace())),
        (a, b) => new Operation(a as Operator, b)
    ),
    simpleTree: () => P.or(
        P.string(silentAction),
        P_UTILS.letters().describe('action name')
    ),
    tree: (lang, _) => P.or(
        lang.simpleTree,
        lang.operation
    ),
    root: (lang, _) => P.or(
        P_UTILS.func(
            P.string(sequence),
            lang.tree.separateBy(P.string(",").trim(P_UTILS.optionalWhitespace())),
            (a, b) => new Operation(a as Sequence, b)
        ),
        lang.simpleTree
    )
})

export const processTreeParser = processTreeLanguage.root.thenEof();


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
    testParser(processTreeParser, str, shouldSucceed);
});

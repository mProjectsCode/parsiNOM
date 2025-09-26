import type { ParseFailure } from './HelperTypes';

/**
 * Generate an error message string for a parse failure on a specific string.
 *
 * @param str the input string that the parse failure occurred on
 * @param parseFailure the failure to generate the error message for
 * @param verbose will underline the failure position in the input string, if set to true
 */
export function createParsingErrorMessage(str: string, parseFailure: ParseFailure, verbose: boolean): string {
	const { line, column } = mapIndexToLineColumn(str, parseFailure.furthest);

	const expectedMessage = `Expected ${parseFailure.expected.sort().join(' or ')}`;
	let message = `Parse Failure: ${expectedMessage} at index ${parseFailure.furthest}, line ${line}, column ${column}.`;

	if (verbose) {
		const lines = str.split('\n');
		const failedLine = lines[line - 1]; // line is a one based index

		const linePrefix = `${line} |   `;
		message += `\n\n${linePrefix}${failedLine}`;
		message += `\n${' '.repeat(column - 1 + linePrefix.length)}^ (${expectedMessage})`;
	}

	return message;
}

/**
 * Will be thrown if parsiNOM fails to parse an input string.
 */
export class ParsingError extends Error {
	constructor(str: string, parseFailure: ParseFailure) {
		super(createParsingErrorMessage(str, parseFailure, true));
	}
}

export function mapIndexToLineColumn(str: string, index: number): { line: number; column: number } {
	let line = 1;
	let column = 1;

	for (let i = 0; i < index && i < str.length; i++) {
		if (str[i] === '\n') {
			line++;
			column = 1;
		} else {
			column++;
		}
	}

	return { line, column };
}

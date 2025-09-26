import type {ParseFailure} from './HelperTypes';

/**
 * Generate an error message string for a parse failure on a specific string.
 *
 * @param str the input string that the parse failure occurred on
 * @param parseFailure the failure to generate the error message for
 * @param verbose will underline the failure position in the input string, if set to true
 */
export function createParsingErrorMessage(str: string, parseFailure: ParseFailure, verbose: boolean): string {
	const expectedMessage = `Expected ${parseFailure.expected.sort().join(' or ')}`;
	let message = `Parse Failure: ${expectedMessage} at index ${parseFailure.furthest.index}, line ${parseFailure.furthest.line}, column ${parseFailure.furthest.column}.`;

	if (verbose) {
		const lines = str.split('\n');
		const failedLine = lines[parseFailure.furthest.line - 1]; // line is a one based index

		const linePrefix = `${parseFailure.furthest.line} |   `;
		message += `\n\n${linePrefix}${failedLine}`;
		message += `\n${' '.repeat(parseFailure.furthest.column - 1 + linePrefix.length)}^ (${expectedMessage})`;
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

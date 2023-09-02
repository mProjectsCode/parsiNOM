import { ParseFailure } from './HelperTypes';

function generateMessage(str: string, parseFailure: ParseFailure, verbose: boolean): string {
	const expectedMessage = `Expected ${parseFailure.expected.join(' or ')}`;
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

export class ParsingError extends Error {
	constructor(str: string, parseFailure: ParseFailure) {
		super(generateMessage(str, parseFailure, true));
	}
}

import { ParseResult, ParsingPosition, STypeBase } from './HelperTypes';
import { Parser } from './Parser';

export function arrayUnion(a: string[] | undefined, b: string[] | undefined): string[] {
	if (a === undefined && b === undefined) {
		return [];
	}
	if (a === undefined) {
		return (b as string[]).sort();
	}
	if (b === undefined) {
		return (a as string[]).sort();
	}

	const ret: string[] = [...a];
	for (const bElement of b) {
		let alreadyIncluded = false;
		for (const retElement of ret) {
			if (bElement === retElement) {
				alreadyIncluded = true;
			}
		}
		if (!alreadyIncluded) {
			ret.push(bElement);
		}
	}
	ret.sort();
	return ret;
}

export function getIndex(position: ParsingPosition | undefined): number {
	return position === undefined ? -1 : position.index;
}

export function validateRange(min: number, max: number): void {
	if (max < min) {
		throw new Error(`Invalid Range: max might not be smaller than min. Received [${min}, ${max}].`);
	}

	if (min < 0 || max < 0) {
		throw new Error(`Invalid Range: max and min might not be smaller than 0. Received [${min}, ${max}].`);
	}

	if (min === Infinity || max === Infinity) {
		throw new Error(`Invalid Range: max and min might not be infinity. Received [${min}, ${max}].`);
	}

	if (!Number.isInteger(min) || !Number.isInteger(max)) {
		throw new Error(`Invalid Range: max and min must be integers. Received [${min}, ${max}].`);
	}
}

export function validateRegexFlags(flags: string): void {
	for (const flag of flags) {
		if (flag !== 'i' && flag !== 'm' && flag !== 's' && flag !== 'u') {
			throw new Error(`RegExp flag '${flag}' is not allowed. The only allowed flags are 'i', 'm', 's' and 'u'.`);
		}
	}
}

// Parser Helpers

export class ParserHelpers {
	followedBy<SType extends STypeBase>(x: Parser<SType>): Parser<SType> {
		return new Parser<SType>(function _followedBy(context): ParseResult<SType> {
			const result = x.p(context.copy());
			// result.position = context.position; TODO: can this be removed?
			return result;
		});
	}

	/**
	 * Returns a parser that yields undefined if the input parser fails, and fails if the input parser accepts. Consumes no input.
	 * More or less an inverse lookahead.
	 *
	 * @param parser
	 */
	notFollowedBy(parser: Parser<unknown>): Parser<undefined> {
		return new Parser(function _notFollowedBy(context): ParseResult<undefined> {
			const contextCopy = context.copy();
			const result = parser.p(contextCopy);
			const text = context.sliceTo(contextCopy.position.index);
			return result.success ? context.fail(`not '` + text + `'`) : context.succeed(undefined);
		});
	}

	/**
	 * Returns a parser that passes the next character into `fn` and yields the character if `fn` returns true.
	 *
	 * @param fn
	 */
	test(fn: (char: string) => boolean): Parser<string> {
		return new Parser<string>(function _test(context): ParseResult<string> {
			const char = context.input[context.position.index];
			if (!context.atEOF() && fn(char)) {
				return context.succeedOffset(1, char);
			} else {
				return context.fail(`a character matching ${fn}`);
			}
		});
	}
}

export const P_HELPERS = new ParserHelpers();

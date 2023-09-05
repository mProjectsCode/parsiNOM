import { ParseResult, STypeBase } from './HelperTypes';
import { Parser } from './Parser';

export function arrayUnion(a: string[] | never[], b: string[] | never[]): string[] {
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

// Parser Helpers

export class ParserHelpers {
	followedBy<SType extends STypeBase>(x: Parser<SType>): Parser<SType> {
		return new Parser<SType>(context => {
			const result = x.p(context.copy());
			result.position = context.position;
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
		return new Parser((context): ParseResult<undefined> => {
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
		return new Parser<string>((context): ParseResult<string> => {
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

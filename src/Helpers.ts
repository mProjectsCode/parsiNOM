export function arrayUnion(a: string[] | never[], b: string[] | never[]): string[] {
	const ret: string[] = [];
	for (const aElement of a) {
		for (const bElement of b) {
			if (aElement === bElement) {
				ret.push(aElement);
			}
		}
	}
	ret.sort();
	return ret;
}

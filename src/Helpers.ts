export function arrayUnion(a: string[] | never[], b: string[] | never[]): string[] {
	const ret: string[] = [...a];
	for (const bElement of b) {
		for (const retElement of ret) {
			if (bElement !== retElement) {
				ret.push(bElement);
			}
		}
	}
	ret.sort();
	return ret;
}

import { describe, test, expect } from 'bun:test';
import { BaseType, interpreterParser } from '../../examples/Interpreter';

describe('prog lang', () => {
	test('1 + 2;', () => {
		const ast = interpreterParser.parse('1 + 2;');
		const type = ast.validateType();
		const res = ast.evaluate();

		expect(type.type).toEqual(BaseType.NUMBER);
		expect(res).toBe(3);
	});

	test('function def', () => {
		const ast = interpreterParser.parse(`
fn hello(): string {
	"hello world";
};
hello();
		`);
		// console.log(ast);
		const type = ast.validateType();
		// console.log('--- evaluate ---');
		const res = ast.evaluate();

		expect(type.type).toEqual(BaseType.STRING);
		expect(res).toBe('hello world');
	});

	test('nested function def', () => {
		const ast = interpreterParser.parse(`
fn get2squared(): number {
	fn pow(x: number): number {
		x * x;
	};
	pow(2);
};
get2squared() + 1;
		`);
		const type = ast.validateType();
		// console.log('--- evaluate ---');
		const res = ast.evaluate();

		expect(type.type).toEqual(BaseType.NUMBER);
		expect(res).toBe(5);
	});

	test('variable def', () => {
		const ast = interpreterParser.parse(`
fn get2squared(): number {
	var num: number = 2;
	fn pow(x: number): number {
		x * x;
	};
	pow(num);
};
get2squared() + 1;
		`);
		const type = ast.validateType();
		// console.log('--- evaluate ---');
		const res = ast.evaluate();

		expect(type.type).toEqual(BaseType.NUMBER);
		expect(res).toBe(5);
	});

	// currently not implemented
	// 	test('variable access over scope', () => {
	// 		const ast = progParser.parse(`
	// var num: number = 2;
	// fn get2squared(): number {
	// 	fn pow(x: number): number {
	// 		x * x;
	// 	};
	// 	pow(num);
	// };
	// get2squared() + 1;
	// 		`);
	// 		const type = ast.validateType();
	// 		console.log('--- evaluate ---');
	// 		const res = ast.evaluate();
	//
	// 		expect(type).toEqual(TypeC.NUMBER);
	// 		expect(res).toBe(5);
	// 	});
});

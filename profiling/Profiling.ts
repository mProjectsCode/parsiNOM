import * as JsonData from '../tests/languages/__data__/JsonData';
import { jsonParser } from './Json';
import { Benchmark } from 'kelonio';

let arr = [];

function parsiNomJsonTest() {
	arr = [];

	for (let i = 0; i < 1; i++) {
		arr.push(jsonParser.tryParse(JsonData.data));
	}

	// console.log(arr);
}

function jsJsonTest() {
	arr = [];

	for (let i = 0; i < 1; i++) {
		arr.push(JSON.parse(JsonData.data));
	}

	// console.log(arr);
}

async function profile() {
	const benchmark = new Benchmark();

	await benchmark.record('parsinom', () => {
		parsiNomJsonTest();
	});

	await benchmark.record('built-in', () => {
		jsJsonTest();
	});

	console.log(benchmark.report());
}

profile();

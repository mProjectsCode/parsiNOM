import * as JsonData from '../tests/__data__/JsonData';
import { jsonParserRegexp } from '../examples/JSON';
import { bench, run } from 'mitata';

function parsiNomJsonTest() {
	return jsonParserRegexp.tryParse(JsonData.data);
}

function jsJsonTest() {
	return JSON.parse(JsonData.data);
}

(async () => {
	bench('built-in', () => {
		jsJsonTest();
	});

	bench('parsinom', () => {
		parsiNomJsonTest();
	});

	await run();
})();

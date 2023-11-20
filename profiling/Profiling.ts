import * as JsonData from '../tests/__data__/JsonData';
import { jsonParserRegexp } from '../examples/JSON';
import { baseline, bench, run } from 'mitata';

function parsiNomJsonTest() {
	return jsonParserRegexp.tryParse(JsonData.data);
}

function jsJsonTest() {
	return JSON.parse(JsonData.data);
}

(async () => {
	baseline('built-in', () => {
		jsJsonTest();
	});

	bench('parsinom', () => {
		parsiNomJsonTest();
	});

	await run({
		avg: true, // enable/disable avg column (default: true)
		json: false, // enable/disable json output (default: false)
		colors: true, // enable/disable colors (default: true)
		min_max: true, // enable/disable min/max column (default: true)
		collect: false, // enable/disable collecting returned values into an array during the benchmark (default: false)
		percentiles: true, // enable/disable percentiles column (default: true)
	});
})();

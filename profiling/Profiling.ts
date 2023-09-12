import * as JsonData from '../tests/languages/__data__/JsonData';
import { jsonParser } from './Json';

let arr = [];

function jsonTest() {
	arr = [];

	for (let i = 0; i < 1000; i++) {
		arr.push(jsonParser.tryParse(JsonData.data));
	}

	console.log(arr);
}

jsonTest();

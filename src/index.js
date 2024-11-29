import {authorize, sendMessage, listLabels} from './googleAPI.js'
import {csvToJSON} from './csvToJSON.js'

authorize().then(listLabels).catch(console.error);

console.log(csvToJSON('../datasets/data.csv'))


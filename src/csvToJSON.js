import * as convertCSV from "convert-csv-to-json";

export function csvToJSON(filename) {
  return convertCSV
    .fieldDelimiter(",")
    .formatValueByType()
    .parseSubArray("*", ",")
    .supportQuotedField(true)
    .getJsonFromCsv(filename);
}


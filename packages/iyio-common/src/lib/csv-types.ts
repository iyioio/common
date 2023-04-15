export interface Csv
{
    header:string[];
    rows:CsvRow[];
}

export type CsvRow={[col:string]:string}

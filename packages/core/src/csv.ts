/** RFC 4180 records. Nested curriculum fields use JSON encoded inside quoted cells. */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [],
    cell = '',
    quoted = false;
  const input = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < input.length; i++) {
    const char = input[i]!;
    if (quoted) {
      if (char === '"' && input[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') {
      if (cell) throw new Error('Unexpected quote');
      quoted = true;
    } else if (char === ',') {
      row.push(cell);
      cell = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && input[i + 1] === '\n') i++;
      row.push(cell);
      if (row.some((v) => v.length)) rows.push(row);
      row = [];
      cell = '';
    } else cell += char;
  }
  if (quoted) throw new Error('Unclosed CSV quote');
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  const header = rows.shift();
  if (!header?.length) throw new Error('CSV header required');
  if (new Set(header).size !== header.length) throw new Error('Duplicate CSV header');
  return rows.map((values, i) => {
    if (values.length !== header.length)
      throw new Error(`CSV row ${i + 2}: expected ${header.length} columns`);
    return Object.fromEntries(header.map((name, j) => [name, values[j]!]));
  });
}

/**
 * Minimal RFC 4180-style CSV parser for catalog import.
 * Handles quoted fields (commas, newlines, double quotes).
 */

/**
 * Parse a single line respecting quoted fields. Double quotes inside quoted
 * fields are escaped as "".
 */
function parseCsvLine(line: string): Array<string> {
  const out: Array<string> = []
  let i = 0
  while (i < line.length) {
    if (line[i] === ',') {
      out.push('')
      i += 1
      continue
    }
    if (line[i] === '"') {
      let field = ''
      i += 1
      while (i < line.length) {
        if (line[i] === '"') {
          i += 1
          if (i < line.length && line[i] === '"') {
            field += '"'
            i += 1
          } else {
            break
          }
        } else {
          field += line[i]
          i += 1
        }
      }
      out.push(field)
      if (i < line.length && line[i] === ',') i += 1
    } else {
      let field = ''
      while (i < line.length && line[i] !== ',') {
        field += line[i]
        i += 1
      }
      out.push(field.trim())
      if (i < line.length && line[i] === ',') i += 1
    }
  }
  if (line.length > 0 && line[line.length - 1] === ',') out.push('')
  return out
}

/**
 * Split CSV text into lines (handles \r\n, \n, \r). First line is header.
 * Returns { header: string[], rows: string[][] }. Empty rows skipped.
 */
export function parseCsv(csvText: string): {
  header: Array<string>
  rows: Array<Array<string>>
} {
  const normalized = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = normalized.split('\n').filter((l) => l.trim().length > 0)
  if (lines.length === 0) {
    return { header: [], rows: [] }
  }
  const header = parseCsvLine(lines[0].trim())
  const rows: Array<Array<string>> = []
  for (let r = 1; r < lines.length; r++) {
    rows.push(parseCsvLine(lines[r]))
  }
  return { header, rows }
}

/**
 * Build an object from a row using header keys (lowercase). Trims values.
 * Keys not present in the row are undefined.
 */
export function rowToObject(
  header: Array<string>,
  row: Array<string>,
): Record<string, string | undefined> {
  const obj: Record<string, string | undefined> = {}
  for (let i = 0; i < header.length; i++) {
    const key = header[i].trim().toLowerCase()
    const value = i < row.length ? row[i].trim() : ''
    if (key) obj[key] = value
  }
  return obj
}

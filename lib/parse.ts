import Papa from 'papaparse'
import * as XLSX from 'xlsx'

export interface ParseResult {
  rows: Record<string, unknown>[]
  columns: string[]
  rowCount: number
  columnCount: number
}

// Coerce string numbers to actual numbers, clean nulls
function coerceRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(row)) {
    if (v === null || v === undefined || v === '') {
      out[k] = null
    } else if (typeof v === 'string') {
      // Remove currency symbols, commas, percent signs
      const cleaned = v.replace(/[$€%,\s]/g, '').trim()
      const n = Number(cleaned)
      out[k] = !isNaN(n) && cleaned !== '' ? n : v
    } else {
      out[k] = v
    }
  }
  return out
}

// Detect first row that looks like real data headers (not merged title rows)
// A good header row has many non-null, non-numeric string cells
function detectHeaderRow(rawRows: unknown[][]): number {
  let bestRow = 0
  let bestScore = -1
  for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
    const row = rawRows[i]
    const strings = row.filter(c => typeof c === 'string' && c.trim() !== '' && isNaN(Number(c))).length
    const coverage = row.filter(c => c !== null && c !== undefined && c !== '').length
    const score = strings * 2 + coverage
    if (score > bestScore) {
      bestScore = score
      bestRow = i
    }
  }
  return bestRow
}

export function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (result) => {
        const rows = (result.data as Record<string, unknown>[]).map(coerceRow)
        const columns = (result.meta.fields ?? []).filter(f => f && !f.startsWith('__'))
        const filteredRows = rows.map(r => {
          const out: Record<string, unknown> = {}
          for (const c of columns) out[c] = r[c]
          return out
        })
        resolve({ rows: filteredRows, columns, rowCount: filteredRows.length, columnCount: columns.length })
      },
      error: reject,
    })
  })
}

export async function parseExcel(file: File): Promise<ParseResult> {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheet = wb.Sheets[wb.SheetNames[0]]

  // Get all raw data as array of arrays to detect header row
  const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null })
  const headerRowIdx = detectHeaderRow(raw)

  // Re-read with correct header row
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
    range: headerRowIdx,
  })

  // Clean column names (remove __EMPTY* columns from bad header detection)
  const allCols = rows.length > 0 ? Object.keys(rows[0]) : []
  const goodCols = allCols.filter(c => !c.startsWith('__EMPTY') && c.trim() !== '')

  const cleanRows = rows
    .filter(r => {
      // Skip rows that are all null or look like sub-headers
      const vals = goodCols.map(c => r[c]).filter(v => v !== null && v !== undefined && v !== '')
      return vals.length > 0
    })
    .map(r => {
      const out: Record<string, unknown> = {}
      for (const c of goodCols) out[c] = r[c]
      return coerceRow(out)
    })

  return {
    rows: cleanRows,
    columns: goodCols,
    rowCount: cleanRows.length,
    columnCount: goodCols.length,
  }
}

export async function parseFile(file: File): Promise<ParseResult> {
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext === 'csv') return parseCSV(file)
  if (ext === 'xlsx' || ext === 'xls') return parseExcel(file)
  throw new Error(`Formato no soportado: .${ext}`)
}

import Papa from 'papaparse'
import * as XLSX from 'xlsx'

export interface ParseResult {
  rows: Record<string, unknown>[]
  columns: string[]
  rowCount: number
  columnCount: number
}

export function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const rows = result.data as Record<string, unknown>[]
        const columns = result.meta.fields ?? []
        resolve({ rows, columns, rowCount: rows.length, columnCount: columns.length })
      },
      error: reject,
    })
  })
}

export async function parseExcel(file: File): Promise<ParseResult> {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null })
  const columns = rows.length > 0 ? Object.keys(rows[0]) : []
  return { rows, columns, rowCount: rows.length, columnCount: columns.length }
}

export async function parseFile(file: File): Promise<ParseResult> {
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext === 'csv') return parseCSV(file)
  if (ext === 'xlsx' || ext === 'xls') return parseExcel(file)
  throw new Error(`Formato no soportado: .${ext}`)
}

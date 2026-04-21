import { NextRequest, NextResponse } from 'next/server'

const GEMINI_FLASH_3   = 'gemini-2.5-flash-preview-05-20'
const GEMINI_FLASH_2_5 = 'gemini-2.0-flash'
const GEMINI_BASE_URL  = 'https://generativelanguage.googleapis.com/v1beta/models'

interface AnalyzeRequest {
  query: string
  columns: string[]
  sampleRows: Record<string, unknown>[]
  rowCount: number
}

async function callGemini(model: string, prompt: string, apiKey: string) {
  const res = await fetch(`${GEMINI_BASE_URL}/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
    }),
  })
  if (!res.ok) throw new Error(`${model} error: ${res.status}`)
  const json = await res.json()
  return json.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY no configurada' }, { status: 500 })

  const body: AnalyzeRequest = await request.json()
  const { query, columns, sampleRows, rowCount } = body

  const prompt = `Eres un analista de datos experto. El usuario tiene un dataset con ${rowCount} filas y las siguientes columnas: ${columns.join(', ')}.

Muestra de datos (primeras filas):
${JSON.stringify(sampleRows.slice(0, 5), null, 2)}

Pregunta del usuario: "${query}"

Responde en español con:
1. Un análisis conciso y accionable (2-3 oraciones)
2. Qué tipo de gráfico recomiendas (bar, line, area, donut, pie, scatter)
3. Qué columna usar como eje X y cuáles como eje Y (nombres exactos de las columnas)

Formato de respuesta JSON:
{
  "analysis": "texto del análisis",
  "chartType": "bar|line|area|donut|pie|scatter",
  "xKey": "nombre_columna",
  "yKeys": ["col1", "col2"],
  "title": "título del gráfico",
  "subtitle": "subtítulo corto"
}`

  let text = ''
  try {
    text = await callGemini(GEMINI_FLASH_3, prompt, apiKey)
  } catch {
    try {
      text = await callGemini(GEMINI_FLASH_2_5, prompt, apiKey)
    } catch (e2) {
      return NextResponse.json({ error: String(e2) }, { status: 500 })
    }
  }

  // Parse JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0])
      return NextResponse.json(parsed)
    } catch {
      // Fallback if JSON parse fails
    }
  }

  return NextResponse.json({
    analysis: text,
    chartType: 'bar',
    xKey: columns[0],
    yKeys: columns.filter((_, i) => i > 0 && i <= 2),
    title: query.slice(0, 50),
    subtitle: `${rowCount.toLocaleString()} filas`,
  })
}

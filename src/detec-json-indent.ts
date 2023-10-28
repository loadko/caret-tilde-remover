export default function detectJsonIndent(raw: string): number | string {
  if (raw === '{}') return 2

  const lines = raw.split('\n')
  if (lines.length < 2) return 2

  const [, secondLine] = lines
  const indent = secondLine.match(/^(\s*)/)
  if (!indent) return 2

  return indent[0]
}

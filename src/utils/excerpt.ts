export function excerpt(body: string | undefined, description?: string): string {
  if (description) return description
  const text = (body ?? '')
    .replace(/[#>*_`[\]]/g, '')
    .replace(/\n+/g, ' ')
    .trim()
  return text.length > 160 ? text.slice(0, 160) + '…' : text
}

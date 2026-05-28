/** Display label for event location (title-cases each word). */
export function formatLocationLabel(location: string | null | undefined): string {
  const trimmed = location?.trim()
  if (!trimmed) return 'Location TBA'
  return trimmed
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

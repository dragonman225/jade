/** Convert an url to another one that's more suitable for embed. */
export function getEmbedUrl(url: string): string {
  if (url.startsWith('https://www.youtube.com/watch?v=')) {
    const urlObj = new URL(url)
    return `https://www.youtube.com/embed/${urlObj.searchParams.get('v')}`
  }
  return url
}

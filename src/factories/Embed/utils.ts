function getYoutubeVideoStart(urlObj: URL): string | undefined {
  const t = urlObj.searchParams.get('t')
  if (!t) return undefined
  /** Remove trailing 's', if exists. */
  const numberMatches = /\d+/.exec(t)
  return numberMatches && numberMatches[0]
}

/** Convert an url to another one that's more suitable for embedding. */
export function getEmbedUrl(url: string): string {
  if (url.startsWith('https://www.youtube.com/watch?v=')) {
    const urlObj = new URL(url)
    const videoId = urlObj.searchParams.get('v')
    const startSeconds = getYoutubeVideoStart(urlObj)
    return `https://www.youtube.com/embed/${videoId}${
      startSeconds ? `?start=${startSeconds}` : ''
    }`
  } else if (url.startsWith('https://youtu.be/')) {
    const urlObj = new URL(url)
    const videoId = urlObj.pathname.split('/').pop()
    const startSeconds = getYoutubeVideoStart(urlObj)
    return `https://www.youtube.com/embed/${videoId}${
      startSeconds ? `?start=${startSeconds}` : ''
    }`
  }
  return url
}

function getYoutubeVideoStart(urlObj: URL): string | undefined {
  const t = urlObj.searchParams.get('t')
  if (!t) return undefined
  /** Remove trailing 's', if exists. */
  const numberMatches = /\d+/.exec(t)
  return numberMatches ? numberMatches[0] : undefined
}

/** Convert an url to another one that's designed for embedding. */
export function getEmbedUrl(url: string): string | undefined {
  if (url.startsWith('https://www.youtube.com/watch?v=')) {
    const urlObj = new URL(url)
    const videoId = urlObj.searchParams.get('v')
    const startSeconds = getYoutubeVideoStart(urlObj)
    return videoId
      ? `https://www.youtube.com/embed/${videoId}${
          startSeconds ? `?start=${startSeconds}` : ''
        }`
      : undefined
  } else if (url.startsWith('https://youtu.be/')) {
    const urlObj = new URL(url)
    const videoId = urlObj.pathname.split('/').pop()
    const startSeconds = getYoutubeVideoStart(urlObj)
    return videoId
      ? `https://www.youtube.com/embed/${videoId}${
          startSeconds ? `?start=${startSeconds}` : ''
        }`
      : undefined
  }
  return url
}

export function isTweetUrl(url: string): boolean {
  return url.startsWith('https://twitter.com/')
}

export function getTweetId(url: string): string | undefined {
  if (!isTweetUrl(url)) return undefined
  const urlObj = new URL(url)
  return urlObj.pathname.split('/').pop()
}

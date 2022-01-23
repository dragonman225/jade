/**
 * This is the hooks/functional version of
 * https://github.com/capaj/react-tweet-embed
 *
 * It was built because the original class component version caused
 * TypeScript errors.
 */
import * as React from 'react'
import { useState, useRef, useEffect } from 'react'

interface TwitterAPI {
  widgets: {
    /**
     * @see https://developer.twitter.com/en/docs/twitter-for-websites/embedded-tweets/guides/embedded-tweet-javascript-factory-function
     */
    createTweetEmbed: (
      tweetId: string,
      targetEl: HTMLElement | null,
      options?: TwitterOptions
    ) => Promise<HTMLElement>
  }
}

interface TwitterLoader {
  ready: () => Promise<TwitterAPI>
}

/**
 * @see https://developer.twitter.com/en/docs/twitter-for-websites/embedded-tweets/guides/embedded-tweet-parameter-reference
 */
interface TwitterOptions {
  id?: number
  cards?: string
  conversation?: string
  theme?: string
  width?: number
  align?: string
  lang?: string
  dnt?: boolean
  [key: string]: unknown
}

export interface TwitterEmbedProps {
  id: string | undefined
  options?: TwitterOptions
  placeholder?: string | React.ReactNode
  protocol?: string
  onTweetLoadSuccess?: (twitterWidgetElement: HTMLElement) => void
  onTweetLoadError?: (err: Error) => void
  className?: string
}

const callbacks: (() => unknown)[] = []

export function TweetEmbed({
  id,
  options,
  placeholder,
  className,
  protocol: suggestedProtocol = 'https:',
  onTweetLoadSuccess,
  onTweetLoadError,
}: TwitterEmbedProps): JSX.Element {
  const [isLoading /*, setIsLoading*/] = useState(true)
  const containerElRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const renderTweet = () => {
      if (!id) return

      const twttr = window['twttr'] as TwitterLoader
      twttr
        .ready()
        .then(({ widgets }) => {
          // Clear previously rendered tweet before rendering the updated tweet id
          if (containerElRef.current) {
            console.log('clear')
            containerElRef.current.innerHTML = ''
          }

          widgets
            .createTweetEmbed(id, containerElRef.current, options)
            .then(twitterWidgetElement => {
              /** No need to set state since the content has been replaced. */
              /** Setting the state removes the Tweet embed. */
              // setIsLoading(false)
              twitterWidgetElement.style.marginTop = '0px'
              twitterWidgetElement.style.marginBottom = '0px'
              onTweetLoadSuccess && onTweetLoadSuccess(twitterWidgetElement)
            })
            .catch(onTweetLoadError)
        })
        .catch(onTweetLoadError)
    }

    const twttr = window['twttr'] as TwitterLoader
    if (!(twttr && twttr.ready)) {
      const isLocal = window.location.protocol.indexOf('file') >= 0
      const protocol = isLocal ? suggestedProtocol : ''

      addScript(`${protocol}//platform.twitter.com/widgets.js`, renderTweet)
    } else {
      renderTweet()
    }

    // Only reload on id change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  return (
    <div ref={containerElRef} className={className}>
      {isLoading && placeholder}
    </div>
  )
}

function addScript(src: string, cb: () => unknown) {
  if (callbacks.length === 0) {
    callbacks.push(cb)
    const s = document.createElement('script')
    s.setAttribute('src', src)
    s.onload = () => callbacks.forEach(cb => cb())
    document.body.appendChild(s)
  } else {
    callbacks.push(cb)
  }
}

import * as React from 'react'
import { useRef, useEffect, useState } from 'react'

import { styles } from './index.styles'
import {
  ConceptDisplayProps,
  Factory,
  TypedConcept,
} from '../../core/interfaces'

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', event => {
      const img = event.target.result.toString() // a data-url
      resolve(img)
    })
    reader.addEventListener('error', e => {
      reject(e)
    })
    reader.readAsDataURL(file)
  })
}

const IMAGE_STATE = {
  NOT_LOADED: Symbol('notloaded'),
  LOADED: Symbol('loaded'),
  ERROR: Symbol('error'),
}

interface ImageContent {
  imgSrc?: string
  imgData?: string // Legacy prop, for backward compatibility.
}

type Props = ConceptDisplayProps<ImageContent>

function Image(props: Props): JSX.Element {
  const {
    viewMode,
    concept,
    onInteractionStart,
    onInteractionEnd,
    onChange,
  } = props
  const content = concept.summary.data

  /** Migrate the legacy format to the new one. */
  if (content.imgData) {
    onChange({ imgSrc: content.imgData })
  }

  const [imgState, setImgState] = useState(
    content.imgSrc ? IMAGE_STATE.LOADED : IMAGE_STATE.NOT_LOADED
  )
  const [img, setImg] = useState(content.imgSrc)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  /** Update state on content change. */
  useEffect(() => {
    setImgState(content.imgSrc ? IMAGE_STATE.LOADED : IMAGE_STATE.NOT_LOADED)
    setImg(content.imgSrc)
  }, [content])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const files = e.target.files
    if (!files) {
      console.log('"e.target.files" is null.')
      return
    }
    const file = files[0]
    if (file.type && file.type.indexOf('image') === -1) {
      console.log('File is not an image.', file.type, file)
      return
    }
    readAsDataUrl(file)
      .then(img => {
        onChange({ imgSrc: img })
      })
      .catch(err => {
        setError(err)
        setImgState(IMAGE_STATE.ERROR)
      })
  }

  switch (viewMode) {
    case 'NavItem': {
      if (imgState === IMAGE_STATE.LOADED) {
        return (
          <div className={styles.ImageNavItem}>
            <img src={img} draggable={false} />
          </div>
        )
      } else if (error) {
        return <div className={styles.ImageErrorMsg}>{error}</div>
      } else {
        return <div className={styles.ImageErrorMsg}>An empty image</div>
      }
    }
    default: {
      switch (imgState) {
        case IMAGE_STATE.LOADED:
          return (
            <div className={styles.ImageBlockViewer}>
              <img src={img} draggable={false} data-view-mode={viewMode} />
              <button onClick={() => onChange({ imgSrc: '' })}>Replace</button>
            </div>
          )
        case IMAGE_STATE.NOT_LOADED:
          return (
            <div className={styles.ImageBlockChooser}>
              <div className={styles.Title}>From the Web</div>
              <input
                ref={inputRef}
                className={styles.ImgLinkInput}
                placeholder="Paste the image link..."
                type="url"
                onFocus={onInteractionStart}
                onBlur={onInteractionEnd}
              />
              <button
                className={styles.ImgLinkButton}
                onClick={() => {
                  onChange({ imgSrc: inputRef.current.value })
                }}>
                Embed image
              </button>
              <div className={styles.Title}>From your computer</div>
              <div className={styles.sizeWarning}>
                Don&apos;t upload large images, currently the database
                (window.localStorage) only have 5MB quota for everything.
              </div>
              <label className={styles.ChooseImgBtn}>
                <input
                  type="file"
                  accept=".apng, .avif, .gif,image/jpeg, .png, .svg, .webp, .bmp"
                  onChange={handleFileSelect}
                />
                <span>Choose an image</span>
              </label>
            </div>
          )
        default:
          return <div className={styles.ImageErrorMsg}>{error}</div>
      }
    }
  }
}

export const ImageFactory: Factory = {
  id: 'image',
  name: 'Image',
  component: Image,
  toText: (concept: TypedConcept<ImageContent>) => {
    const imgSrc = concept.summary.data.imgSrc
    return `image ${imgSrc || ''}`
  },
}

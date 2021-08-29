import * as React from 'react'
import { stylesheet } from 'typestyle'

import theme from '../../theme'
import { buttonPrimary, input } from '../../lightComponents'
import { ConceptDisplayProps, Factory } from '../../core/interfaces'

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

const ImgState = {
  NotLoaded: Symbol('notloaded'),
  Loaded: Symbol('loaded'),
  Error: Symbol('error'),
}

const styles = stylesheet({
  ImageNavItem: {
    height: '100%',
    maxHeight: 'inherit',
    overflow: 'hidden',
    $nest: {
      '&>img': {
        width: '100%',
        height: '100%',
        maxHeight: 'inherit',
        objectFit: 'contain',
      },
    },
  },
  ImageErrorMsg: {
    fontSize: '.8rem',
    padding: '.5rem',
    maxHeight: '100%',
  },
  ImageBlockViewer: {
    display: 'flex' /* Remove extra space below img. */,
    height: '100%',
    overflow: 'hidden',
    $nest: {
      '&>img': {
        width: '100%',
      },
      "&>img[data-view-mode='CardTitle']": {
        height: '100%',
        objectFit: 'contain',
        objectPosition: 'left center',
      },
    },
  },
  ImageBlockChooser: {
    padding: theme.paddings.blockComfort,
    paddingBottom: '.7rem',
    $nest: {
      '&>input': {
        width: '100%',
      },
    },
  },
  Title: {
    fontWeight: 600,
    marginBottom: '.3rem',
  },
  ImgLinkInput: {
    ...input,
    marginBottom: '.5rem',
  },
  ImgLinkButton: {
    ...buttonPrimary,
    marginBottom: '.7rem',
  },
  ChooseImgBtn: {
    ...buttonPrimary,
    $nest: {
      ...buttonPrimary.$nest,
      '& > input': { display: 'none' },
    },
  },
})

interface ImageContent {
  initialized?: boolean
  valid?: boolean
  imgData?: string
}

type Props = ConceptDisplayProps<ImageContent>

const Image: React.FunctionComponent<Props> = props => {
  const { onInteractionStart, onInteractionEnd, onChange } = props
  const content = props.concept.summary.data
  const [imgState, setImgState] = React.useState(ImgState.NotLoaded)
  const [img, setImg] = React.useState('')
  const [error, setError] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)

  function setImage(img: string) {
    setImg(img)
    setImgState(ImgState.Loaded)
    onChange({
      initialized: true,
      valid: true,
      imgData: img,
    })
  }

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
        setImage(img)
      })
      .catch(err => {
        setError(err)
        setImgState(ImgState.Error)
      })
  }

  /** Load image on first render or props change. */
  React.useEffect(() => {
    if (content.initialized && content.valid) {
      setImg(content.imgData)
      setImgState(ImgState.Loaded)
    }
  }, [content.imgData, content.initialized, content.valid])

  switch (props.viewMode) {
    case 'NavItem': {
      if (imgState === ImgState.Loaded)
        return (
          <div className={styles.ImageNavItem}>
            <img src={img} draggable={false} />
          </div>
        )
      else
        return (
          <div className={styles.ImageErrorMsg}>
            Image not loaded or error occurred.
          </div>
        )
    }
    default: {
      switch (imgState) {
        case ImgState.Loaded:
          return (
            <div className={styles.ImageBlockViewer}>
              <img
                src={img}
                draggable={false}
                data-view-mode={props.viewMode}
              />
            </div>
          )
        case ImgState.NotLoaded:
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
                  setImage(inputRef.current.value)
                }}>
                Embed image
              </button>
              <div className={styles.Title}>From your computer</div>
              <label className={styles.ChooseImgBtn}>
                <input
                  type="file"
                  accept=".jpg, .jpeg, .png"
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
}

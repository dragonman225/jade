import * as React from 'react'
import { ContentProps } from '../interfaces'

interface Content {
  valid: boolean
  imgData: string
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', (event) => {
      const img = event.target.result.toString() // a data-url
      resolve(img)
    })
    reader.addEventListener('error', (e) => {
      reject(e)
    })
    reader.readAsDataURL(file)
  })
}

const ImgState = {
  NotLoaded: Symbol('notloaded'),
  Loaded: Symbol('loaded'),
  Error: Symbol('error')
}

export const Image: React.FunctionComponent<ContentProps<unknown>> = (props) => {
  const content = props.content as Content
  const [imgState, setImgState] = React.useState(ImgState.NotLoaded)
  const [img, setImg] = React.useState('')
  const [error, setError] = React.useState('')

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files[0]
    console.log(file)
    if (file.type && file.type.indexOf('image') === -1) {
      console.log('File is not an image.', file.type, file)
      return
    }
    readAsDataUrl(file)
      .then((img) => {
        setImg(img)
        setImgState(ImgState.Loaded)
        props.onChange({
          valid: true,
          imgData: img
        })
      })
      .catch((err) => {
        setError(err)
        setImgState(ImgState.Error)
      })
  }

  /** Load image on first render or props change. */
  React.useEffect(() => {
    if (content && content.valid) {
      setImg(content.imgData)
      setImgState(ImgState.Loaded)
    }
  }, [props.content])

  switch (props.viewMode) {
    case 'nav_item':
      return (
        <>
          <style jsx>{`
            div {
              height: 100%;
              max-height: inherit;
              overflow: hidden;
            }

            img {
              width: 100%;
              height: 100%;
              max-height: inherit;
              object-fit: contain;
            }

            span {
              font-size: 0.8rem;
              padding: 0.5rem;
              max-height: 100%;
            }
          `}</style>
          {
            imgState === ImgState.Loaded
              ? <div><img src={img} draggable={false} /></div>
              : <span>Image not loaded or error occurred.</span>
          }
        </>
      )
    default:
      return (
        <>
          <style jsx>{`
            .ImgViewer {
              height: 100%;
              overflow: hidden;
            }
            
            .ImgChooser {
              padding: 0.3rem 1.5rem;
            }

            .ImgChooser > input {
              width: 250px;
            }

            img {
              width: 100%;
            }

            img[data-view-mode='card'] {
              height: 100%;
              object-fit: contain;
              object-position: left center;
            }
          `}</style>
          {
            imgState === ImgState.Loaded ? (
              <div className="ImgViewer">
                <img
                  src={img}
                  draggable={false}
                  data-view-mode={props.viewMode} />
              </div>
            ) : imgState === ImgState.NotLoaded ? (
              <div className="ImgChooser">
                <input type="file" accept=".jpg, .jpeg, .png"
                  onChange={handleFileSelect} />
              </div>
            ) : <span>{error}</span>
          }
        </>
      )
  }
}
import * as React from 'react'
import { ContentProps } from '../interfaces'

interface ImageContent {
  loaded: boolean
  imgSrc: string
}

interface State {
  loaded: boolean
  imgSrc: string
}

/**
 * BUG: When props change after instantiated, state doesn't update.
 */

export class Image extends React.Component<ContentProps<unknown>, State> {
  constructor(props: ContentProps<unknown>) {
    super(props)
    if (props.content === null) {
      this.state = { loaded: false, imgSrc: '' }
    } else {
      this.state = props.content as ImageContent
    }
  }

  handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files[0]
    console.log(file)
    if (file.type && file.type.indexOf('image') === -1) {
      console.log('File is not an image.', file.type, file)
      return
    }
    const reader = new FileReader()
    reader.addEventListener('load', (event) => {
      const img = event.target.result.toString() // a data-url
      const newContent = {
        loaded: true,
        imgSrc: img
      }
      this.props.onChange(newContent)
      this.setState(newContent)
    })
    reader.readAsDataURL(file)
  }

  render(): JSX.Element {
    switch (this.props.viewMode) {
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
            `}</style>
            {
              this.state.loaded
                ? <div><img src={this.state.imgSrc} draggable={false} /></div>
                : <span>Image not loaded.</span>
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
              this.state.loaded
                ? (
                  <div className="ImgViewer">
                    <img
                      src={this.state.imgSrc}
                      draggable={false}
                      data-view-mode={this.props.viewMode} />
                  </div>
                )
                : (
                  <div className="ImgChooser">
                    <input type="file" accept=".jpg, .jpeg, .png"
                      onChange={this.handleFileSelect} />
                  </div>
                )
            }
          </>
        )
    }
  }
}
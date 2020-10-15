import * as React from 'react'
import { BlockContentProps } from '../interfaces'

interface ImageContent {
  loaded: boolean
  imgSrc: string
}

interface State {
  loaded: boolean
  imgSrc: string
}

export class Image extends React.Component<BlockContentProps<unknown>, State> {
  constructor(props: BlockContentProps<unknown>) {
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
    return (
      <>
        <style jsx>{`
          .ImgChooser {
            padding: 0.3rem 1.5rem;
          }
        `}</style>
        {
          this.state.loaded
            ? <img src={this.state.imgSrc} draggable={false} width="100%" />
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
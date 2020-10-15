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

export class Image extends React.Component<BlockContentProps<ImageContent>, State> {
  constructor(props: BlockContentProps<ImageContent>) {
    super(props)
    this.state = {
      loaded: props.content.loaded,
      imgSrc: props.content.loaded ? props.content.imgSrc : ''
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
        {
          this.state.loaded
            ? <img src={this.state.imgSrc} draggable={false} width="100%" />
            : <input type="file" accept=".jpg, .jpeg, .png"
              onChange={this.handleFileSelect} />
        }
      </>
    )
  }
}
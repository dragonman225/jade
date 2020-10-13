import * as React from 'react'
import { BlockContentProps } from '../interfaces'

interface State {
  imgSrc: string
}

export class Image extends React.Component<BlockContentProps, State> {
  constructor(props: BlockContentProps) {
    super(props)
    this.state = {
      imgSrc: props.content as string
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
      this.props.onChange(img)
      this.setState({
        imgSrc: img
      })
    })
    reader.readAsDataURL(file)
  }

  render(): JSX.Element {
    return (
      <>
        {
          this.state.imgSrc
            ? <img src={this.state.imgSrc} draggable={false} width="100%" />
            : <input type="file" accept=".jpg, .jpeg, .png"
              onChange={this.handleFileSelect} />
        }
      </>
    )
  }
}
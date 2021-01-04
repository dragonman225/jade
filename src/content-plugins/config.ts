import { Baby } from './Baby'
import { Image } from './Image'
import { PMText } from './PMText'
import { Status } from './Status'
import { Text } from './Text'

interface ContentType {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  name: string
  component: React.ComponentClass<any> | React.FunctionComponent<any>
}

interface ContentConfig {
  defaultType: string
  contentTypeRegistry: {
    [key: string]: ContentType
  }
}

export const config: ContentConfig = {
  defaultType: 'pmtext',
  contentTypeRegistry: {
    'image': {
      name: 'Image',
      component: Image
    },
    'pmtext': {
      name: 'PMText',
      component: PMText
    },
    'status': {
      name: 'Status',
      component: Status
    },
    'text': {
      name: 'Text',
      component: Text
    },
    'baby': {
      name: 'Baby',
      component: Baby
    }
  }
}
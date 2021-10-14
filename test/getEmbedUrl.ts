import { getEmbedUrl } from '../src/factories/Embed/utils'

const tests = [
  'https://www.youtube.com/watch?v=PUv66718DII',
  'https://www.youtube.com/watch?v=PUv66718DII&t=133s',
  'https://youtu.be/PUv66718DII',
  'https://youtu.be/PUv66718DII?t=2',
]

tests.forEach(t => console.log(getEmbedUrl(t)))

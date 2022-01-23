/**
 * Generate a data URL representing a file with a string as content.
 * @param data The string.
 * @param mime MIME of param `data`. Default: `text/plain`.
 */
export function generateDataUrl(data: string, mime = 'text/plain'): string {
  return `data:${mime};charset=utf-8,` + encodeURIComponent(data)
}

export function withDateSuffix(str: string): string {
  const date = new Date()
  return `${str}-${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

/**
 * Creates a fake link element.
 * Adapted from https://github.com/zenorocha/clipboard.js/blob/master/src/common/create-fake-element.js
 */
export function createFakeLink(): HTMLAnchorElement {
  const isRTL = document.documentElement.getAttribute('dir') === 'rtl'
  const fakeElement = document.createElement('a')
  // Prevent zooming on iOS
  fakeElement.style.fontSize = '12pt'
  // Reset box model
  fakeElement.style.border = '0'
  fakeElement.style.padding = '0'
  fakeElement.style.margin = '0'
  // Move element out of screen horizontally
  fakeElement.style.position = 'absolute'
  fakeElement.style[isRTL ? 'right' : 'left'] = '-9999px'
  // Move element to the same position vertically
  const yPosition = window.pageYOffset || document.documentElement.scrollTop
  fakeElement.style.top = `${yPosition}px`

  return fakeElement
}

export function readAsObject<T>(file: File): Promise<T> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', event => {
      const jsonString = event.target?.result?.toString() || ''
      try {
        const obj = JSON.parse(jsonString) as T
        resolve(obj)
      } catch (e) {
        reject(e)
      }
    })
    reader.addEventListener('error', e => {
      reject(e)
    })
    reader.readAsText(file)
  })
}

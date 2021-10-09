/**
 * Creates a fake textarea element with a value.
 * Adapted from https://github.com/zenorocha/clipboard.js/blob/master/src/common/create-fake-element.js
 */
function createFakeElement(value: string): HTMLTextAreaElement {
  const isRTL = document.documentElement.getAttribute('dir') === 'rtl'
  const fakeElement = document.createElement('textarea')
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

  fakeElement.setAttribute('readonly', '')
  fakeElement.value = value

  return fakeElement
}

/**
 * Save a text string to clipboard.
 * @see https://stackoverflow.com/questions/3436102/copy-to-clipboard-in-chrome-extension
 * Adapted from BrowserPlus2
 */
export function saveTextToClipboard(text: string): void {
  const fakeElement = createFakeElement(text)
  document.body.appendChild(fakeElement)
  fakeElement.select()
  fakeElement.setSelectionRange(0, fakeElement.value.length)
  document.execCommand('copy')
  fakeElement.remove()
}

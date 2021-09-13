export function openExternal(link: string): void {
  const newTab = window.open()
  newTab.opener = null
  newTab.location.assign(link)
}

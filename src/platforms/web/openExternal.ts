export function openExternal(link: string): void {
  const newTab = window.open()
  if (!newTab) return
  newTab.opener = null
  newTab.location.assign(link)
}

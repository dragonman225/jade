import { ipcRenderer } from 'electron'

import { IpcRendererEvent } from './ipc'

export function openExternal(link: string): void {
  ipcRenderer.send(IpcRendererEvent.OpenExternal, link)
}

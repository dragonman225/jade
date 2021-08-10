import * as path from 'path'
import { app, BrowserWindow } from 'electron'

function createWindow() {
  console.log(`Jade runs from dir "${__dirname}", \
and the entry script is "${__filename}".`)
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.resolve(__dirname, '../512x512.png'),
    webPreferences: {
      nodeIntegration: true,
    },
    autoHideMenuBar: true,
  })

  void win.loadFile('index.html')
}

void app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

import * as createDebug from 'debug'
import * as isDevMode from 'electron-is-dev'
import { app, BrowserWindow } from 'electron'
import { enableLiveReload } from 'electron-compile'
import * as background from './background'

const debug = createDebug('makane:main')

// Keep a global reference of the window object, if don't, the window will
// be closed automatically when the JavaScript object is garbage collected
let mainWindow: Electron.BrowserWindow | undefined

if (isDevMode) enableLiveReload()

const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
  })

  mainWindow.loadURL(`file://${__dirname}/view/index.html`)

  if (isDevMode) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows in an
    // array if your app supports multi windows, this is the time when you
    // should delete the corresponding element
    mainWindow = undefined
  })
}

// This method will be called when Electron has finished initialization and
// is ready to create browser windows
// Some APIs can only be used after this event occurs
app.on('ready', () => {
  background.initialize({
    sendToRenderer: (channel, action) => {
      if (mainWindow) {
        mainWindow.webContents.send(channel, action)
        // debug('send to renderer via channel [%s]: %s', channel, JSON.stringify(action, undefined, 2))
      } else {
        // debug('can not send to closed renderer with channel [%s]: %s', channel, JSON.stringify(action, undefined, 2))
      }
    }
  })
  createMainWindow()
})

app.on('activate', () => {
  // On OS X it is common to re-create a window in the app when the dock icon
  // is clicked and there are no other windows open
  if (!mainWindow) {
    createMainWindow()
  }
})

app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar to stay active
  // until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('quit', () => {
  background.terminate()
})

// In this file you can include the rest of app's specific main process code
// You can also put them in separate files and import them here

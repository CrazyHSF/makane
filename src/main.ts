import * as createDebug from 'debug'
import { app, BrowserWindow } from 'electron'
import { enableLiveReload } from 'electron-compile'
import * as background from './background'

const debug = createDebug('makane:main')

// Keep a global reference of the window object, if don't, the window will
// be closed automatically when the JavaScript object is garbage collected
let mainWindow: Electron.BrowserWindow | undefined

const isDevMode = process.execPath.match(/[\\/]electron/)

if (isDevMode) enableLiveReload()

const createMainWindow = async () => {
  mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
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
    sendToRenderer: (channel, ...args) => {
      if (mainWindow) mainWindow.webContents.send(channel, ...args)
      // debug('do send %s <> %s', channel, JSON.stringify(args, undefined, 2))
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

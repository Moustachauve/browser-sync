'use strict'

const log = require('electron-log')
const {app, ipcMain} = require('electron')
const {autoUpdater} = require('electron-updater')
const isDev = require('electron-is-dev')
const mkdirp = require('mkdirp')
const windowManager = require('./lib/windowManager')

if (isDev) {
  mkdirp.sync('./dist')
  log.transports.file.file = 'dist/log-dev.log'
}

// console.log = log.info
autoUpdater.logger = log
autoUpdater.logger.transports.file.level = 'info'

app.on('window-all-closed', function () {
  // TODO: Quit the window for real on all platform and re-create it when needed
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  windowManager.createWindow()
})

app.on('ready', function () {
  console.log('App is ready.')

  windowManager.init()
  windowManager.createWindow()

  // TODO: Create a module to handle the autoUpdater
  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for update...')
  })
  autoUpdater.on('update-available', (ev) => {
    console.log('Update available.', ev)
  })
  autoUpdater.on('update-not-available', (ev, info) => {
    console.log('Update not available.')
    windowManager.sendToRenderer('updateNotAvailable')
  })
  autoUpdater.on('error', (ev, err) => {
    console.log('Error in auto-updater.')
  })
  autoUpdater.on('download-progress', (progressObj) => {
    let logMessage = 'Download speed: ' + progressObj.bytesPerSecond
    logMessage = logMessage + ' - Downloaded ' + progressObj.percent + '%'
    logMessage = logMessage + ' (' + progressObj.transferred + '/' + progressObj.total + ')'
    console.log(logMessage)
  })
  autoUpdater.on('update-downloaded', (ev) => {
    console.log('Update downloaded')
    windowManager.sendToRenderer('updateDownloaded', ev)
  })

  ipcMain.on('checkForUpdates', (event, title) => {
    console.log('Checking for updates (manually)...')
    autoUpdater.checkForUpdates()
  })

  ipcMain.on('installUpdate', (event, title, content) => {
    console.log('restarting...')
    autoUpdater.quitAndInstall()
  })

  ipcMain.on('windowMinimize', (event) => {
    windowManager.browserWindow.minimize()
  })

  ipcMain.on('windowMaximize', (event) => {
    if (windowManager.browserWindow.isMaximized()) {
      windowManager.browserWindow.unmaximize()
    } else {
      windowManager.browserWindow.maximize()
    }
  })

  ipcMain.on('windowClose', (event) => {
    windowManager.closeWindow()
  })
/*
  if (!isDev) {
    autoUpdater.checkForUpdates()

    setInterval(function () {
      autoUpdater.checkForUpdates()
    }, 21600000) // 6hrs
  }
  */
  console.log('App is ready and running!')
})

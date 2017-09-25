'use strict'

/* global angular */
require('angular')
require('angular-material')
require('angular-animate')
require('angular-aria')
const {ipcRenderer, remote, shell} = require('electron')
const log = require('electron-log')
const drag = require('electron-drag')
const URL = require('url-parse')

var titleBarDrag = drag('#titleBar')

// var oldConsoleLog = console.log
/* console.log = function (...args) {
  if (args && args[0]) {
    args[0] = '[renderer] ' + args[0]
  } else {
    args = ['[renderer]']
  }

  log.info(...args)
} */

// eslint-disable-next-line no-undef
var app = angular.module('browsersync', ['ngMaterial'])

app.config(function ($mdThemingProvider) {
  $mdThemingProvider.theme('default')
    .dark()
    .primaryPalette('red', {default: '900'})
    .accentPalette('blue')
  $mdThemingProvider.theme('updateAlert')
    .backgroundPalette('grey')
    .primaryPalette('red')
    .accentPalette('blue')
})

app.config(function ($mdDateLocaleProvider) {
  $mdDateLocaleProvider.firstDayOfWeek = 1
})

app.controller('indexController', ['$scope', '$interval', '$mdDialog', '$mdToast', '$sce', function ($scope, $interval, $mdDialog, $mdToast, $sce) {
  var hello = 'world'
  console.log(hello)

  $scope.isUpdateAvailable = false
  $scope.checkingForUpdates = false
  $scope.showUpdateNotAvailable = false

  $scope.urlLeft = 'https://redtube.com/'
  $scope.domainLeft = 'redtube.com'
  $scope.loadingLeft = true
  $scope.pageTitleLeft = ''
  $scope.urlRight = 'https://redtube.dev/'
  $scope.domainRight = 'redtube.dev'
  $scope.loadingRight = true
  $scope.pageTitleRight = ''

  var firstLoadLeft = true
  var firstLoadRight = true

  var shouldShowUpdateDialog = true

  var webviewLeft = document.querySelector('#webview-left')
  var webviewRight = document.querySelector('#webview-right')

  webviewLeft.addEventListener('dom-ready', () => {
    if (firstLoadLeft) {
      firstLoadLeft = false
      webviewLeft.loadURL($scope.urlLeft)
    }
  })
  webviewRight.addEventListener('dom-ready', () => {
    if (firstLoadRight) {
      firstLoadRight = false
      webviewRight.loadURL($scope.urlRight)
    }
  })

  webviewLeft.addEventListener('did-start-loading', function () {
    $scope.loadingLeft = true
    $scope.$apply()
  })
  webviewLeft.addEventListener('did-stop-loading', function () {
    $scope.loadingLeft = false
    $scope.$apply()
  })
  webviewRight.addEventListener('did-start-loading', function () {
    $scope.loadingRight = true
    $scope.$apply()
  })
  webviewRight.addEventListener('did-stop-loading', function () {
    $scope.loadingRight = false
    $scope.$apply()
  })

  webviewLeft.addEventListener('page-title-updated', function (title) {
    $scope.pageTitleLeft = title.title
    $scope.$apply()
  })
  webviewRight.addEventListener('page-title-updated', function (title) {
    $scope.pageTitleRight = title.title
    $scope.$apply()
  })  
  
  webviewLeft.addEventListener('will-navigate', function (url) {
    url = new URL(url.url)

    $scope.urlLeft = url.toString()
    url.set('hostname', $scope.domainRight)
    $scope.urlRight = url.toString()
    webviewRight.loadURL($scope.urlRight)
    $scope.$apply()
  })
  webviewRight.addEventListener('will-navigate', function (url) {
    url = new URL(url.url)

    $scope.urlRight = url.toString()
    url.set('hostname', $scope.domainLeft)
    $scope.urlLeft = url.toString()
    webviewLeft.loadURL($scope.urlLeft)
    $scope.$apply()
  })

  $scope.navigateLeft = function () {
    console.log('left')
    navigateToUrl($scope.urlLeft)
  }

  $scope.navigateRight = function () {
    console.log('right')
    navigateToUrl($scope.urlRight)
  }

  $scope.windowMinimize = function () {
    ipcRenderer.send('windowMinimize')
  }

  $scope.windowMaximize = function () {
    ipcRenderer.send('windowMaximize')
  }

  $scope.windowClose = function () {
    ipcRenderer.send('windowClose')
  }

  $scope.showUpdateDialog = function () {
    $mdDialog.show({
      controller: UpdateAvailableController,
      templateUrl: 'updateAvailable.dialog.html',
      scope: $scope,
      preserveScope: true,
      parent: angular.element(document.body),
      targetEvent: null,
      clickOutsideToClose: false
    }).then(function () {
      ipcRenderer.send('installUpdate')
    }, function () {
      shouldShowUpdateDialog = false
      $mdToast.show($mdToast.simple()
        .textContent('You will be asked again next time you open the app.')
        .hideDelay(3000)
      )
    })
  }

  $scope.checkForUpdates = function () {
    $scope.showUpdateNotAvailable = false
    $scope.checkingForUpdates = true
    shouldShowUpdateDialog = true

    ipcRenderer.send('checkForUpdates')
  }

  function navigateToUrl (url) {
    console.log('navigate to ' + url)
    url = new URL(url)

    url.set('hostname', $scope.domainLeft)
    $scope.urlLeft = url.toString()
    webviewLeft.loadURL($scope.urlLeft)
    url.set('hostname', $scope.domainRight)
    $scope.urlRight = url.toString()
    webviewRight.loadURL($scope.urlRight)
  }

  ipcRenderer.on('updateDownloaded', function (event, info) {
    console.log('new update', info)
    $scope.isUpdateAvailable = true
    $scope.checkingForUpdates = false

    $scope.updateInfo = info
    $scope.updateInfo.releaseNotes = $sce.trustAsHtml(info.releaseNotes)

    if (shouldShowUpdateDialog) {
      shouldShowUpdateDialog = false
      $scope.showUpdateDialog()
    }
  })

  ipcRenderer.on('updateNotAvailable', function (event, info) {
    console.log('no updates available', info)
    $scope.isUpdateAvailable = false
    $scope.checkingForUpdates = false
    $scope.showUpdateNotAvailable = true
  })

  ipcRenderer.on('windowMaximize', function () {
    $scope.isWindowMaximized = true
    titleBarDrag()
  })

  ipcRenderer.on('windowUnmaximize', function () {
    $scope.isWindowMaximized = false
    titleBarDrag = drag('#titleBar')
  })
}])

/* UPDATE AVAILABLE */

function UpdateAvailableController ($scope, $mdDialog) {
  $scope.cancel = function () {
    $mdDialog.cancel()
  }

  $scope.confirm = function () {
    $mdDialog.hide()
  }
}

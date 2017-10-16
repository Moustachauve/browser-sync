'use strict'

/* global angular */
require('angular')
require('angular-material')
require('angular-animate')
require('angular-aria')
const {ipcRenderer} = require('electron')
// const log = require('electron-log')
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

// Load directives
require('./directives/syncBrowserWindow')

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
  $scope.isUpdateAvailable = false
  $scope.checkingForUpdates = false
  $scope.showUpdateNotAvailable = false

  var shouldShowUpdateDialog = true

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

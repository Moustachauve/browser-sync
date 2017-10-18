'use strict'

/* global angular */
const URL = require('url-parse')
const {shell} = require('electron')

// eslint-disable-next-line no-undef
angular.module('browsersync')
  .directive('syncBrowserWindow', function () {
    var controller = ['$scope', '$rootScope', '$mdDialog', function ($scope, $rootScope, $mdDialog) {
      $scope.url = ''
      $scope.loading = true
      $scope.pageTitle = ''
      $scope.statusbarText = ''
      $scope.webview = null
      var firstLoad = true
      var forceNavigation = false

      $scope.initWebview = function (webview) {
        $scope.webview = webview
        $scope.webview.addEventListener('dom-ready', () => {
          if (firstLoad) {
            firstLoad = false
            $scope.loadUrl($scope.url)
          }
        })

        $scope.webview.addEventListener('did-start-loading', function () {
          $scope.loading = true
          if (!$scope.$$phase) {
            $scope.$apply()
          }
        })

        $scope.webview.addEventListener('did-stop-loading', function () {
          $scope.loading = false
          if (!$scope.$$phase) {
            $scope.$apply()
          }
        })

        $scope.webview.addEventListener('page-title-updated', function (title) {
          $scope.pageTitle = title.title
          if (!$scope.$$phase) {
            $scope.$apply()
          }
        })

        $scope.webview.addEventListener('did-fail-load', function (data) {
          console.log('fail to load', data)
          $scope.loading = false
        })

        $scope.webview.addEventListener('will-navigate', function (data) {
          $scope.loadUrl(data.url)
        })

        $scope.webview.addEventListener('did-navigate', function (data) {
          $scope.url = data.url
        })

        $scope.webview.addEventListener('did-navigate-in-page', function (data) {
          $scope.url = data.url
          notifyUrlChanged()
        })

        $scope.webview.addEventListener('update-target-url', function (data) {
          $scope.statusbarText = data.url
          if ($scope.statusbarText.length > 80) {
            $scope.statusbarText = $scope.statusbarText.slice(0, 80)
            $scope.statusbarText += '...'
          }
          if (!$scope.$$phase) {
            $scope.$apply()
          }
        })

        require('electron-context-menu')({
          window: webview,
          prepend: (params, browserWindow) => [{
            label: 'Open in Browser',
            visible: !!params.linkURL,
            click () {
              shell.openExternal(params.linkURL)
            }
          }]
        })
      }

      $scope.navigate = function () {
        console.log('navigating...')
        forceNavigation = true
        $scope.loadUrl($scope.url)
      }

      $scope.openSetDomainDialog = function (event) {
        $mdDialog.show({
          controller: 'setDomainDialog',
          templateUrl: 'setDomain.dialog.html',
          scope: $scope,
          preserveScope: true,
          parent: angular.element(document.body),
          targetEvent: event,
          clickOutsideToClose: false
        }).then(function () {
          // Dialog 'confirmed'
        }, function () {
          // Dialog dismissed
        })
      }

      $scope.openDevTool = function () {
        console.log('Opening dev tools')
        $scope.webview.openDevTools()
      }

      $rootScope.$on('syncBrowserUrlChanged', function (e, url) {
        console.log('url changed: ' + url)
        $scope.loadUrl(url)
      })

      $scope.$on('getCookies', function (e, data) {
        if (!$scope.webview) {
          $scope.$emit('getCookiesResponse', {from: $scope.side, cookies: []})
        }

        var cookiesManager = $scope.webview.getWebContents().session.cookies
        cookiesManager.get({url: $scope.url}, function (err, cookies) {
          if (err) {
            console.err(err)
            $scope.$emit('getCookiesResponse', {from: $scope.side, cookies: []})
          }
          $scope.$emit('getCookiesResponse', {from: $scope.side, cookies: cookies})
        })
      })

      $scope.$on('createCookie', function (e, data) {
        if (data.side !== $scope.side) {
          return
        }

        var cookiesManager = $scope.webview.getWebContents().session.cookies
        cookiesManager.set({
          url: $scope.url,
          name: data.name,
          value: data.value
        }, function (err) {
          if (err) {
            console.err(err)
            throw err()
          }

          console.log('cookie [' + data.name + '] was created')
          $scope.$emit('createCookieResponse')
        })
      })

      $scope.$on('deleteCookie', function (e, data) {
        if (data.side !== $scope.side) {
          return
        }

        var cookiesManager = $scope.webview.getWebContents().session.cookies
        cookiesManager.remove($scope.url, data.cookie.name, function () {
          console.log('cookie [' + data.cookie.name + '] was deleted')
          $scope.$emit('deleteCookieResponse')
        })
      })

      $scope.$on('editCookie', function (e, data) {
        if (data.side !== $scope.side) {
          return
        }

        var cookiesManager = $scope.webview.getWebContents().session.cookies
        cookiesManager.remove($scope.url, data.oldCookie.name, function () {
          console.log('cookie [' + data.oldCookie.name + '] was deleted')
          cookiesManager.set({
            url: $scope.url,
            name: data.newCookie.name,
            value: data.newCookie.value
          }, function (err) {
            if (err) {
              console.err(err)
              throw err()
            }

            console.log('cookie [' + data.newCookie.name + '] was created')
            $scope.$emit('editCookieResponse')
          })
        })
      })

      $scope.$on('deleteAllCookies', function (e, data) {
        if (data.side !== $scope.side) {
          return
        }

        var session = $scope.webview.getWebContents().session
        session.clearStorageData({storages: ['cookies']}, function () {
          console.log('all cookies were deleted')
          $scope.$emit('deleteAllCookiesResponse')
        })
      })

      function notifyUrlChanged () {
        console.log('notifying...')
        $rootScope.$broadcast('syncBrowserUrlChanged', $scope.url)
      }

      $scope.loadUrl = function (url) {
        if (!$scope.domain) {
          return
        }
        url = new URL(checkUrlProtocol(url))
        url.set('hostname', $scope.domain)
        if ($scope.url === url.toString() && !forceNavigation) {
          return
        }
        forceNavigation = false
        $scope.url = url.toString()
        $scope.webview.loadURL($scope.url)
        notifyUrlChanged()
      }

      $scope.$watch('domain', function () {
        console.log('Domain changed, reloading web view')
        $scope.loadUrl($scope.url)
      }, true)
    }]

    function link (scope, element, attrs) {
      var webview = document.createElement('webview')
      webview.src = '/'
      webview.partition = scope.side
      element[0].querySelector('.webview-container').appendChild(webview)

      scope.initWebview(webview)
    }

    function checkUrlProtocol (url) {
      if (!/^(?:f|ht)tps?:\/\//.test(url)) {
        url = 'http://' + url
      }
      return url
    }

    return {
      restrict: 'E',
      templateUrl: 'directives/syncBrowserWindow.html',
      controller: controller,
      scope: {
        domain: '=',
        side: '@'
      },
      link: link
    }
  })

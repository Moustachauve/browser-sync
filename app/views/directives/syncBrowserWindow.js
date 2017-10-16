'use strict'

/* global angular */
const URL = require('url-parse')

// eslint-disable-next-line no-undef
angular.module('browsersync')
  .directive('syncBrowserWindow', function () {
    var controller = ['$scope', '$rootScope', '$mdDialog', function ($scope, $rootScope, $mdDialog) {
      $scope.url = ''
      $scope.loading = true
      $scope.pageTitle = ''
      $scope.statusbarText = ''
      var firstLoad = true
      var webview

      $scope.initWebview = function (element) {
        webview = element[0].querySelector('webview')
        webview.addEventListener('dom-ready', () => {
          if (firstLoad) {
            firstLoad = false
            $scope.loadUrl($scope.url)
          }
        })

        webview.addEventListener('did-start-loading', function () {
          $scope.loading = true
          if (!$scope.$$phase) {
            $scope.$apply()
          }
        })

        webview.addEventListener('did-stop-loading', function () {
          $scope.loading = false
          if (!$scope.$$phase) {
            $scope.$apply()
          }
        })

        webview.addEventListener('page-title-updated', function (title) {
          $scope.pageTitle = title.title
          if (!$scope.$$phase) {
            $scope.$apply()
          }
        })

        webview.addEventListener('did-fail-load', function (data) {
          console.log('fail to load', data)
          $scope.loading = false
        })

        webview.addEventListener('will-navigate', function (data) {
          $scope.loadUrl(data.url)
        })

        webview.addEventListener('did-navigate', function (data) {
          $scope.url = data.url
        })

        webview.addEventListener('did-navigate-in-page', function (data) {
          $scope.url = data.url
          notifyUrlChanged()
        })

        webview.addEventListener('update-target-url', function (data) {
          $scope.statusbarText = data.url
          if ($scope.statusbarText.length > 80) {
            $scope.statusbarText = $scope.statusbarText.slice(0, 80)
            $scope.statusbarText += '...'
          }
          if (!$scope.$$phase) {
            $scope.$apply()
          }
        })
      }

      $scope.navigate = function () {
        console.log('navigating...')
        webview.loadURL($scope.url)
        notifyUrlChanged()
      }

      $scope.openSetDomainDialog = function () {
        $mdDialog.show({
          controller: 'setDomainDialog',
          templateUrl: 'setDomain.dialog.html',
          scope: $scope,
          preserveScope: true,
          parent: angular.element(document.body),
          targetEvent: null,
          clickOutsideToClose: false
        }).then(function () {
          // Dialog 'confirmed'
        }, function () {
          // Dialog dismissed
        })
      }

      $scope.openDevTool = function () {
        console.log('Opening dev tools')
        webview.openDevTools()
      }

      $rootScope.$on('syncBrowserUrlChanged', function (e, url) {
        console.log('url changed: ' + url)
        $scope.loadUrl(url)
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
        if ($scope.url === url.toString()) {
          return
        }
        $scope.url = url.toString()
        webview.loadURL($scope.url)
        notifyUrlChanged()
      }

      $scope.$watch('domain', function () {
        console.log('Domain changed, reloading web view')
        $scope.loadUrl($scope.url)
      }, true)
    }]

    function link (scope, element, attrs) {
      scope.initWebview(element)
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

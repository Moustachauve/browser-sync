const URL = require('url-parse')

// eslint-disable-next-line no-undef
angular.module('browsersync')
  .directive('syncBrowserWindow', function () {
    var controller = ['$scope', '$rootScope', function ($scope, $rootScope) {
      $scope.url = 'https://home.com/'
      $scope.loading = true
      $scope.pageTitle = ''
      var firstLoad = true
      var webview

      $scope.initWebview = function (element) {
        webview = element[0].querySelector('webview')
        webview.addEventListener('dom-ready', () => {
          if (firstLoad) {
            firstLoad = false
            loadUrl($scope.url)
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
          loadUrl(data.url)
        })

        webview.addEventListener('did-navigate', function (data) {
          $scope.url = data.url
        })

        webview.addEventListener('did-navigate-in-page', function (data) {
          $scope.url = data.url
          notifyUrlChanged()
        })
      }

      $scope.navigate = function () {
        console.log('navigating...')
        webview.loadURL($scope.url)
        notifyUrlChanged()
      }

      $rootScope.$on('syncBrowserUrlChanged', function (e, url) {
        console.log('url changed: ' + url)
        loadUrl(url)
      })

      function notifyUrlChanged () {
        console.log('notifying...')
        $rootScope.$broadcast('syncBrowserUrlChanged', $scope.url)
      }

      function loadUrl (url) {
        url = new URL(checkUrlProtocol(url))
        url.set('hostname', $scope.domain)
        if ($scope.url === url.toString()) {
          return
        }
        $scope.url = url.toString()
        webview.loadURL($scope.url)
        notifyUrlChanged()
      }
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
        domain: '@'
      },
      link: link
    }
  })

'use strict'
/* global angular */

angular.module('browsersync')
  .controller('cookieEditorDialog', ['$scope', '$rootScope', '$mdDialog', function ($scope, $rootScope, $mdDialog) {
    $scope.newDomain = $scope.domain
    $scope.cookies = {}

    $rootScope.$on('getCookiesResponse', function (e, result) {
      $scope.cookies[result.from] = result.cookies
      if (!$scope.$$phase) {
        $scope.$apply()
      }
    })

    $rootScope.$on('deleteCookieResponse', function (e, result) {
      $scope.refresh()
    })

    $scope.cancel = function () {
      $mdDialog.cancel()
    }

    $scope.deleteCookie = function (side, cookie) {
      console.log('deleting cookie...')
      $rootScope.$broadcast('deleteCookie', {side: side, cookie: cookie})
    }

    $scope.editCookie = function (side, cookie) {
      console.log('opening cookieCreatorDialog - edit')
    }

    $scope.createCookie = function (event, side) {
      console.log('opening cookieCreatorDialog - create')
      $mdDialog.show({
        controller: 'cookieCreatorDialog',
        templateUrl: 'cookieCreator.dialog.html',
        preserveScope: false,
        targetEvent: event,
        multiple: true,
        clickOutsideToClose: true
      }).then(function () {
        // Save/submit/whatever
      }, function () {
        // Cancel
      })
    }

    $scope.refresh = function () {
      $rootScope.$broadcast('getCookies')
    }

    $scope.refresh()
  }])

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

    $rootScope.$on('deleteAllCookiesResponse', function (e, result) {
      $scope.refresh()
    })

    $rootScope.$on('addCookiesResponse', function (e, result) {
      $scope.refresh()
    })

    $scope.cancel = function () {
      $mdDialog.cancel()
    }

    $scope.deleteCookie = function (side, cookie) {
      console.log('deleting cookie...')
      $rootScope.$broadcast('deleteCookie', { side: side, cookie: cookie })
    }

    $scope.deleteAllCookies = function (side) {
      console.log('deleting all cookies...')
      $rootScope.$broadcast('deleteAllCookies', { side: side })
    }

    $scope.editCookie = function (event, side, cookie) {
      console.log('opening cookieCreatorDialog - edit')
      $mdDialog.show({
        controller: 'cookieCreatorDialog',
        templateUrl: 'cookieCreator.dialog.html',
        locals: {
          originalCookie: { name: cookie.name, value: cookie.value },
          isEditingCookie: true,
          side: side
        },
        preserveScope: false,
        targetEvent: event,
        multiple: true,
        clickOutsideToClose: true
      })
    }

    $scope.createCookie = function (event, side) {
      console.log('opening cookieCreatorDialog - create')
      $mdDialog.show({
        controller: 'cookieCreatorDialog',
        templateUrl: 'cookieCreator.dialog.html',
        locals: {
          isEditingCookie: false,
          originalCookie: { name: '', value: '' },
          side: side
        },
        preserveScope: false,
        targetEvent: event,
        multiple: true,
        clickOutsideToClose: true
      })
    }

    $scope.refresh = function () {
      $rootScope.$broadcast('getCookies')
    }

    $scope.refresh()
  }])

'use strict'
/* global angular */

angular.module('browsersync')
  .controller('cookieCreatorDialog', ['$scope', '$rootScope', '$mdDialog', function ($scope, $rootScope, $mdDialog) {
    $scope.side = 'left'
    $scope.newCookie = {name: '', value: ''}
    $scope.btnDisabled = false
    $scope.isClosed = false

    var createCookieListener = $rootScope.$on('createCookieResponse', function (e) {
      // Temporary fix because this gets called more than once..
      if ($scope.isClosed) {
        return
      }
      $mdDialog.cancel()
      $scope.isClosed = true
    })

    $scope.cancel = function () {
      $mdDialog.cancel()
    }

    $scope.createCookie = function () {
      if (!$scope.newCookie.name || !$scope.newCookie.value) {
        return
      }
      $scope.btnDisabled = true
      $rootScope.$broadcast('createCookie', { side: $scope.side, name: $scope.newCookie.name, value: $scope.newCookie.value })
    }

    $scope.$on('$destroy', function () {
      createCookieListener()
    })
  }])

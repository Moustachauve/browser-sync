'use strict'
/* global angular */

angular.module('browsersync')
  .controller('cookieCreatorDialog', ['$scope', '$rootScope', '$mdDialog', 'originalCookie', 'isEditingCookie', 'side', function ($scope, $rootScope, $mdDialog, originalCookie, isEditingCookie, side) {
    $scope.side = side
    $scope.newCookie = {name: originalCookie.name, value: originalCookie.value}
    $scope.isEditingCookie = isEditingCookie
    $scope.btnDisabled = false

    console.log($scope.isEditingCookie)

    var createCookieListener = $rootScope.$on('createCookieResponse', function (e) {
      $scope.$emit('addCookiesResponse')
      $mdDialog.cancel()
    })

    var editCookieListener = $rootScope.$on('editCookieResponse', function (e, result) {
      $scope.$emit('addCookiesResponse')
      $mdDialog.cancel()
    })

    $scope.cancel = function () {
      $mdDialog.cancel()
    }

    $scope.save = function () {
      if ($scope.isEditingCookie) {
        editCookie()
      } else {
        createCookie()
      }
    }

    $scope.$on('$destroy', function () {
      createCookieListener()
      editCookieListener()
    })

    function createCookie () {
      if (!$scope.newCookie.name || !$scope.newCookie.value) {
        return
      }
      $scope.btnDisabled = true
      $rootScope.$broadcast('createCookie', { side: $scope.side, name: $scope.newCookie.name, value: $scope.newCookie.value })
    }

    function editCookie () {
      if (!$scope.newCookie.name || !$scope.newCookie.value) {
        return
      }

      console.log('editing cookie...')
      $scope.btnDisabled = true
      $rootScope.$broadcast('editCookie', { side: side, oldCookie: originalCookie, newCookie: $scope.newCookie })
    }
  }])

'use strict'
/* global angular */
const globalSettings = require('./../lib/globalSettings')

angular.module('browsersync')
  .controller('setDomainDialog', ['$scope', '$mdDialog', function ($scope, $mdDialog) {
    $scope.newDomain = $scope.domain
    $scope.btnDisabled = false

    $scope.cancel = function () {
      $mdDialog.cancel()
    }

    $scope.confirm = function () {
      $scope.btnDisabled = true
      globalSettings.setKey('domain_' + $scope.side, $scope.newDomain, function (err) {
        if (err) {
          throw err
        }
        $mdDialog.hide()
      })
    }
  }])

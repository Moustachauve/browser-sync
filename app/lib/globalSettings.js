'use strict'

var jsonfile = require('jsonfile')
var fs = require('fs')
var path = require('path')
var mkdirp = require('mkdirp')
var EventEmitter = require('events').EventEmitter
var os = require('os')
const isDev = require('electron-is-dev')

var globalSettings = new EventEmitter()
module.exports = globalSettings

var folder = path.join(os.homedir(), 'browser-sync/')

globalSettings.setKey = function (key, value, callback) {
  getFilePath(function (err, filePath) {
    if (err) { return callback(err) }

    globalSettings.load(function (err, data) {
      if (err) { return callback(err) }

      if (!data[key]) {
        data = getDefaultObject()
      }
      data[key] = value

      saveData(data, function (err) {
        if (err) { return callback(err) }
        return callback(null, true)
      })
    })
  })
}

globalSettings.load = function (callback) {
  getFilePath(function (err, filePath) {
    if (err) { return callback(err) }

    fs.access(filePath, function (err) {
      if (err && err.code === 'ENOENT') {
        console.log('Creating new file with name: ', getFileName())
        return callback(null, getDefaultObject())
      }

      jsonfile.readFile(filePath, function (err, data) {
        return callback(err, data)
      })
    })
  })
}

function getDefaultObject () {
  var defaultObject = {
    version: 1,
    domainLeft: 'google.com',
    domainRight: 'google.dev'
  }

  return defaultObject
}

function saveData (data, callback) {
  getFilePath(function (err, filePath) {
    if (err) { return callback(err) }

    jsonfile.writeFile(filePath, data, {spaces: 2}, function (err) {
      if (err) { return callback(err) }
      globalSettings.emit('dataChange', data)
      return callback()
    })
  })
}

function getFilePath (callback) {
  var filename = getFileName()
  mkdirp(folder, function (err) {
    if (err) { return callback(err) }

    return callback(null, path.join(folder, filename))
  })
}

function getFileName () {
  if (isDev) {
    return 'settings-dev.json'
  }
  return 'settings.json'
}

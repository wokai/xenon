'use strict';
/*******************************************************************************
 * The MIT License
 * Copyright 2023, Wolfgang Kaisers
 * Permission is hereby granted, free of charge, to any person obtaining a 
 * copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the 
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included 
 * in all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. 
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR 
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
 * USE OR OTHER DEALINGS IN THE SOFTWARE.
 ******************************************************************************/
 
const express = require('express');
const path    = require('path');

const medibus         = require(path.join(__dirname, '..', 'config', 'medibus'));
const { ventilation } = require(path.join(__dirname, '..', 'model', 'data', 'ventilation'));
const { device }      = require(path.join(__dirname, '..', 'model', 'data', 'device'));
const { dateTime }    = require(path.join(__dirname, '..', 'model', 'data', 'dateTime'));
const { text }        = require(path.join(__dirname, '..', 'model', 'data', 'text'));
const { settings }    = require(path.join(__dirname, '..', 'model', 'data', 'settings'));
const { cache }       = require(path.join(__dirname, '..', 'model', 'data', 'cache'));

const { alarmLimits, expiredAlarms, cp1Alarms } = require(path.join(__dirname, '..', 'model', 'data', 'alarm'));

const router = express.Router();

router.get('/device', function(request, result, next){
  result.status(200).json(device.dataObject);
});

router.get('/datetime', function(request, result, next) {
  result.status(200).json({ date: dateTime.date, time: dateTime.time });
});

router.get('/vent', function(request, result, next){
  result.status(200).json(ventilation.getValueObject());
});

router.get('/alarm/definition', function(request, result, next) {
  result.status(200).json(medibus.alarms);
});

router.get('/alarm/limits', function(request, result, next){
  result.status(200).json(alarmLimits.dataObject);
});

router.get('/alarm/expired', function(request, result, next){
  result.status(200).json(expiredAlarms.getArray());
});

router.get('/alarm/cp1', function(request, result, next){
  result.status(200).json(cp1Alarms.getAlarmArray());
});

router.get('/text/text', function(request, result, next) {
  result.status(200).json(text.dataObject);
});

router.get('/text/param', function(request, result, next) {
  result.status(200).json(text.paramObject);
});

router.get('/text/current', function(request, result, next) {
  result.status(200).json(text.paramMap.current);
});

router.get('/text/expired', function(request, result, next) {
  result.status(200).json(text.paramMap.expired);
});

router.get('/settings', function(request, result, next) {
  result.status(200).json(settings.dataObject);
});

router.get('/cache', function(request, result, next) {
  result.status(200).json(cache.consumeVentData());
});



module.exports = router;

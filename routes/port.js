'use strict';
/*******************************************************************************
 * The MIT License
 * Copyright 2021, Wolfgang Kaisers
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

const config  = require(path.join(__dirname, '..', 'config', 'port'));
const win     = require(path.join(__dirname, '..', 'logger', 'logger'));

const status = require(path.join(__dirname, '..', 'controller', 'statusController'));
const { port       } = require(path.join(__dirname, '..', 'controller', 'portController'));
const { protocol   } = require(path.join(__dirname, '..', 'controller', 'protocolController'));

const router  = express.Router();

/// //////////////////////////////////////////////////////////////////////// ///
/// Get complete list of all parameters
/// //////////////////////////////////////////////////////////////////////// ///


router.get('/paths', function(request, result, next){
  port.pathList()
    .then((paths) => { result.status(200).json(paths.filter(p => p.manufacturer !== undefined)) });
});

/// //////////////////////////////////////////////////////////////////////// ///
/// Port default parameter
/// - config
///   + current : Object with default parameters
///   + select  : Parameter selection list 
///   + devices : Dräger devices (Evita, Primus) with default parameters
/// - paths
///   + path          : /dev/ttyUSB0
///   + manufacturer  : Prolific
/// //////////////////////////////////////////////////////////////////////// ///

router.get('/defaults', function(request, result, next){
  result.status(200).json(config);
});

router.get('/status', function(request, result, next) {
  result.status(200).json(port.status);
});

router.get('/params', function(request, result, next){
  /// open, path, baudRate, dataBits, parity, stopBits
  result.status(200).json(port.parameters);
});


/// //////////////////////////////////////////////////////////////////////// ///
/// Port must be open. Otherwise update rejects
/// Parameters: baudRate, dataBits, parity, stopBits
/// //////////////////////////////////////////////////////////////////////// ///

  /**
   * @usedBy{port.service.uploadParams} - {serialPortConfig.html - Init Button}
   **/

router.post('/params', function(request, result, next){
  port.update(request.body)
    .then((resolve) => {
      /// { result, message, status }
      result.status(200).json(resolve);
      }, (reject) => {
      result.status(400).json(reject);
    })
});


/// //////////////////////////////////////////////////////////////////////// ///
/// (Re-)Initalises Port instance using a (new) set of port parameters
/// Can also be done when port is not open
/// //////////////////////////////////////////////////////////////////////// ///

  /**
   * @usedBy{port.service.initialisePort} - {serialPortConfig.html - Init Button}
   **/

router.post('/init', function(request, result, next) {
  // ToDo: request.body.path present?
  console.log('/init', request.body)
  
  port.setParameters(request.body)
    .then(res => { return port.initializePort(request.body.path); })
    .then(res => { result.status(200).json(port.status) })
    .catch(error => { result.status(400).json(port.status) })
})


/// //////////////////////////////////////////////////////////////////////// ///
/// OPEN routine:
/// 1) Open port (portController.open)
/// 2) portController sets Status is set to 'Listen'.
/// 3) Upon incoming ICC command, a reply is sent by protocolController
/// 4) ProtocolController sets Status to 'Initialising'
/// 5) Upon Status.Initialising, MessageController does:
///   5.1 Set status to 'Protocol'
///   5.2 Fill Action schedule (initial messages + message cycle)
///   5.3 Executes doNextAction which triggers transmission of first command.
/// //////////////////////////////////////////////////////////////////////// ///

router.get('/open', function(request, result, next){
  port.open()
    .then(res => { result.status(200).json(res); }, 
      reject => { result.status(400).json(reject); })
});


/// //////////////////////////////////////////////////////////////////////// ///
/// STOP routine:
/// 1) Set Status to stopping.
/// 2) NextMessage calls ProtocolController.stop() which sends STOP command
/// 3) Reply is caught by EventLoop React which calls ProtocolController.shutdown
/// 4) Shutdown closes port
/// //////////////////////////////////////////////////////////////////////// ///

router.get('/stop', function(request, result, next){
  if(status.controller.sending) {
    win.def.log({ level: 'verbose', file: 'port', func: 'get /stop', message: 'Init com STOP'});
    status.controller.setStatus(status.status.stopping);
    port.endEpisode();
  }
  result.status(200).json(port.status);  
});


router.get('/close', function(request, result, next){
  port.close()
    .then((resolve) => { result.status(200).json(resolve); }, 
      reject => { result.status(409).json(reject); })
});


module.exports = router;

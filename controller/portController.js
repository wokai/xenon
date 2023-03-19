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

const { SerialPort } = require('serialport');
const Stream     = require('stream');
const colors     = require('colors');
const crypto     = require("crypto"); /// Generates 'Episode' UUID.
const path       = require('path');

const config  = require(path.join(__dirname, '..', 'config', 'port'));
const general = require(path.join(__dirname, '..', 'config', 'general'));
const win     = require(path.join(__dirname, '..', 'logger', 'logger'));
const status  = require(path.join(__dirname, '..', 'controller', 'statusController'));
const monitor = require(path.join(__dirname, '..', 'monitor', 'monitor'));
const { episode } = require(path.join(__dirname, 'episodeController'));

/// ////////////////////////////////////////////////////////////////////////////
/// Wrapper class around SerialPort object
/// Allows maintenance of event listeners, even when SerialPort object
/// is newly established
/// 
/// Software based change of path (of serial port) is not intended
/// (as it depeds on hardware configuration, i.e. wired). 
/// Can only be done by changing default values (config object)
///
/// Change of path can be done by 
///   i) Close port
///  ii) Update port parameters
/// iii) Create new SerialPort object using new parameters
/// ////////////////////////////////////////////////////////////////////////////

class PortController extends Stream.Readable {
  
  #path
  #port
  #params
  #message    /// String: Status message from last action
  #episode    /// Episode: { begin: Date , uuid: randomBytes(16) }
  
  constructor() {
    super()
    this.setDefaultParameters();
    this.initializePort();
    this.#message = '';
    
    this.#episode = {
      nEpisodes: 0,
      begin: general.empty.time,
      uuid:  general.empty.uuid,
      end:   null
    }
    
  }
  
  _read(size) {
   if(this.#port){ return this.#port.read(size) }
   this.push(null);
  }
  
  /// ////////////////////////////////////////////////////////////////////// ///
  /// Episode 
  /// ////////////////////////////////////////////////////////////////////// ///
  
  /// Called by portController inside open() which then returns the current
  /// episode data
  startEpisode = () => {
    this.#episode.nEpisodes++;
    this.#episode.begin = new Date().toISOString();
    this.#episode.uuid  = crypto.randomBytes(16).toString("hex");
    this.#episode.end   = null;
    episode.init();
  }
  
  endEpisode = () => { 
    this.#episode.end = new Date().toISOString();
    episode.terminate();
  }
  
  
  get episode () { return this.#episode; }
  
  /// //////////////////////////////////////////////////////////////////////////
  /// Parameter accessors
  /// //////////////////////////////////////////////////////////////////////////
  
  /// Single serial port parameter
  get path () { return this.#params.path; }  
  get baudRate () { return this.#params.baudRate; }
  get dataBits () { return this.#params.dataBits; }
  get parity   () { return this.#params.parity;   }
  get stopBits () { return this.#params.stopBits; }
  get message  () { return this.#message;  }

  get parameters () { return this.#params; }
  async pathList() { return await SerialPort.list(); }
  
  get isOpen    () { 
    if(!this.#port) 
      return false;
    return this.#port.isOpen;
  }
  
  get status () {
    return {
      open: this.isOpen,
      openText : this.isOpen ? 'Open' : 'Closed',
      path: this.#params.path,
      baudRate: this.#params.baudRate,
      dataBits: this.#params.dataBits,
      parity: this.#params.parity,
      stopBits: this.#params.stopBits,
      message: this.#message,
      busStatus: status.controller.status.val,
      busStatusText: status.controller.label,
      episode: this.#episode, ///status.controller.episode,
      summary: status.controller.summary
    };
  }
  
  /// ////////////////////////////////////////////////////////////////////// ///
  /// Serial port transmission parameters
  /// ////////////////////////////////////////////////////////////////////// ///
  setDefaultParameters = () => {
    win.def.log({ level: 'verbose', file: 'portController.js', func: 'setDefaultParameters', message: 'Set default parameters'});
    this.#params = {
      path     : config.preset.path,
      baudRate : config.preset.baudRate,
      parity   : config.preset.parity,
      dataBits : config.preset.dataBits,
      stopBits : config.preset.stopBits,
      autoOpen : config.preset.autoOpen
    };
  }
  
  /// ////////////////////////////////////////////////////////////////////// ///
  /// Check against list of valid parameter settings as defined by config.select
  /// Throws an error when incorrect settings are detected
  /// ////////////////////////////////////////////////////////////////////// ///
  async checkParamValidity(params) {
    return new Promise((resolve, reject) => {
      
      const p = config.select;
      /// Result object
      const res = {
        ok: true,
        incorrect: []
      }
      
      /// //////////////////////////////////////////////////////////////////// ///
      /// indexOf uses strict equality comparison (===) which returns false
      /// - when object types are different ('1' === 1)
      /// - when compared against *undefined* ( 1 === o.does_not_exist)
      /// - _.toInteger converts missing value to 0
      /// //////////////////////////////////////////////////////////////////// ///
      
      if(p.baudRate.indexOf(params.baudRate) < 0){
        res.ok = false;
        res.incorrect.push('baudRate');
      }
      if(p.dataBits.indexOf(params.dataBits) < 0){
        res.ok = false;
        res.incorrect.push('dataBits');
      }
      if(p.parity.indexOf(params.parity)     < 0){
        res.ok = false;
        res.incorrect.push('parity');
      }
      if(p.stopBits.indexOf(params.stopBits) < 0){
        res.ok = false;
        res.incorrect.push('stopBits');
      }
      
      if(!res) {
        this.#message = `Incorrect Port parameters: ${res.incorrect.join(', ')}`;
        reject(this.status);
      } else {
        resolve(params);
      }
          
    });
  }
  
  /// Propagates thrown error when incorrect parameters are provided:
  /**
   * @usedBy{post('/init')} - (/routes/port)
   **/
  async setParameters(params) {
    return this.checkParamValidity(params)
      .then(params => {
        /// Maintain parameters object (therewith: autoOpen)
        this.#params.path     = params.path;
        this.#params.baudRate = params.baudRate;
        this.#params.dataBits = params.dataBits;      
        this.#params.parity   = params.parity;
        this.#params.stopBits = params.stopBits;
        this.#params.autoOpen = params.autoOpen;
      })
  }
  
  /// //////////////////////////////////////////////////////////////////////////
  /// Initialisation of SerialPort object.
  /// //////////////////////////////////////////////////////////////////////////
  
  handlePortOpened = () => {
    monitor.portMsg('Port opened', `Opened path ${this.status.path}`, this.status);
    /// Will be caught by protocolController ??
    this.emit('open', { source: 'port', status: 'open' });
    this.#message = 'Port has been opened';
    status.controller.setStatus(status.status.listen);
  }
  handlePortClosed = () => {
    monitor.portMsg('Port closed', `Closed path ${this.status.path}`, this.status);
    /// Will be caught by protocolController ??
    this.emit('close', { source: 'port', status: 'closed' });
    this.#message = 'Port has been closed';
    status.controller.setStatus(status.status.closed);
  }
  
  /// Pass data to external stream listener
  handleData = (data) => { this.emit('data', data); }
  
  
  /**
   * @usedBy{post('/init')} - (/routes/port)
   **/
  async initializePort() {
    return new Promise((resolve, reject) => {
      /// Eventually do cleanup
      if(this.#port){
        if(this.#port.isOpen){
          this.#port.close((err) => {
            win.def.log({ level: 'warn', file: 'portController', func: 'initializePort (port closing)', message: err.message });
          });
        }
        this.#port.removeListener('open', this.handlePortOpened);
        this.#port.removeListener('close', this.handlePortClosed);
        this.#port.removeListener('data', this.handleData);
      }
      
      this.#port = new SerialPort(this.#params);
      
      this.#port.on('open', this.handlePortOpened);
      this.#port.on('close', this.handlePortClosed);
      /// Pass data to external stream listener
      this.#port.on('data', this.handleData);
      this.#message = 'initializePort success';
      
      monitor.portMsg('Port initialized', `New Serial-Port instance`, this.status);
      win.def.log({ level: 'info', file: 'portController', func: 'initializePort', message: 'Success: New Serial-Port instance.' });   
      resolve(this.status);
    });
  }

  
  /// //////////////////////////////////////////////////////////////////////////
  /// Write
  /// //////////////////////////////////////////////////////////////////////////
  async write(data) {
    return new Promise((resolve, reject) => {
      if(!this.isOpen){
        win.def.log({ level: 'warn', file: 'portController', func: 'write', message: 'Port is not open' });
        this.#message = 'write(data) failed. Port is not open.';
        reject('Port is not open');
      } else {
        this.#port.write(data, function(err) {
          if(err){
            win.def.log({ level: 'error', file: 'portController', func: 'write', message: err.message });
            this.#message = `write(data) failed: ${err.message}`;
            reject('Error while writing to port: ' + err.message);
          } else {
            this.#message = 'write(data) success';
            resolve('Data written');
          }
        }.bind(this)); /// Allows assignment to this.#message
      }
    });
  }
  
  /// //////////////////////////////////////////////////////////////////////////
  /// Open port
  /// //////////////////////////////////////////////////////////////////////////
  async open() {
    return await new Promise((resolve, reject) => {
      if(this.isOpen){
        this.#message = 'open: Port is already open.';
        resolve(this.status);
      } else if(!this.#port) {
        win.def.log({ level: 'warn', file: 'portController', func: 'open', message: 'No port instance present.'} );
        this.#message = 'open: No port instance present';
        reject(this.status);
      } else {
        /// portController.open
        this.#port.open((err) => {
          if(err){
            //console.log('[Port open error]');
            win.def.log({ level: 'error', file: 'portController', func: 'open', message: err.message });
            this.#message = `Port open failed: ${err.message}`;
            reject(this.status);
          } else {
            this.startEpisode();
            win.msg.log({ level: 'debug', file: 'portController', func: 'Port open', message: 'Port opened'});
            this.#message = 'Port open success';
            resolve(this.status);
          }
        });
      }
    })
  }
  
  /// //////////////////////////////////////////////////////////////////////////
  /// Close port
  /// //////////////////////////////////////////////////////////////////////////
  async close() {
    return await new Promise((resolve, reject) => {
      if(!this.isOpen){
        win.def.log({ level: 'verbose', file: 'portController', func: 'close', message: 'Port is already closed' });
        this.#message = 'Port close: Port is already closed';
        resolve({ result: 'Notification', text: 'Port is already closed', status: this.status });
      } else {
        this.#port.close((err) => {
          if(err){
            win.def.log({ level: 'error', file: 'portController', func: 'close', message: err.message });
            this.#message = `Port close error: ${err.message}`;
            reject({ result: 'Error', text: err.message, status: this.status });
          } else {
            win.def.log({ level: 'verbose', file: 'portController', func: 'close', message: 'Port closed' });
            this.#message = 'Port close: success';
            this.endEpisode();
            resolve({ result: 'Success', text: 'Port closed', status: this.status });
          }
        });
      }
    });
  }
  
  /// https://serialport.io/docs/api-stream#serialportupdate
  /// Alternative: Close port and re-create port object with new parameters and re-open
  async update(params) {
    return await new Promise((resolve, reject) => {
      
      try {
        this.setParameters(params)
      } catch(error) {
        reject(error);
        win.def.log({ level: 'warn', file: 'portController', func: 'update', message: error });
      }
      
      if(!this.isOpen){
        win.def.log({ level: 'error', file: 'portController', func: 'update', message: 'Port is not open' });
        monitor.portMsg('Update Port', `Port parameters NOT updated (Port is not open)`, this.status);
        reject({ result: 'Error', message: 'Port is not open', status: this.status });
      } else {
        this.#port.update(this.#params, (err) => {
          if(err){
            win.def.log({ level: 'error', file: 'portController', func: 'update', message: err.message });
            reject({ result: 'Error', message: err.message, status: this.status });
          } else {
            win.def.log({ level: 'info', file: 'portController', func: 'update', message: 'Parameters updated' });
            monitor.portMsg('Port', `Port parameters updated`, this.status);
            resolve({ result: 'Success', message: 'Success', status: this.status });
          }
        })
      }
    });
  }
  
  async reset() {
    return await new Promise((resolve, reject) => {
      this.initializePort();
      resolve(this.status);
    });
  }
  
  
  /// ////////////////////////////////////////////////////////////////////// ///
  ///
  /// ////////////////////////////////////////////////////////////////////// ///
  
  async sendMessage(msg) {
    return new Promise((resolve, reject) => {
      this.write(msg.buffer)
        .then(result => {
          win.def.log({ level: 'verbose', file: 'portController', func: 'sendMessage', message: `MSG | id ${msg.id} | type ${msg.typestr} | code ${msg.code}`});
          resolve('OK');
        })
        .catch(err => {
           win.def.log({ level: 'warn', file: 'portController', func: 'sendMessage', message: `Error | id ${msg.id} | ${msg.code} | Reason: ${err}`});
           reject(err);
        });
    });
  }
  
  
}

const controller = new PortController();

module.exports = {
  port: controller
}

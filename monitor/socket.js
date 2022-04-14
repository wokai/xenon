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

const { Server }   = require('socket.io');
const EventEmitter = require('events');
const win          = require('../logger/logger'); 
const monitor      = require('./monitor');

/// ////////////////////////////////////////////////////////////////////////////
/// Deliver Port related events
/// ////////////////////////////////////////////////////////////////////////////

/// No disconnection provided as port-controller is expected to be always
/// existent.

class SocketController {
  
  #httpServer
  #io             /// Messages are forwarded to http-client via this server.
  #monitor
  #sockets        /// Socket objects
  
  constructor(httpServer){
    this.#sockets = [];
    this.#httpServer = null;
    this.#monitor = null;
  }
  
  get status() { 
    return {
      clients: this.#io.engine.clientsCount,
      ids : this.#sockets.map(s => s.id)
    }
  }  
  
  /// Configure messages: Must be arrow function in order to retain local *this* 
  emitPortEvent   = (event) => { this.#io.emit('io:port', event); };
  emitComEvent    = (event) => { this.#io.emit('io:com', event); };
  emitDataEvent   = (event) => { this.#io.emit('io:data', event); };
  emitDeviceEvent = (event) => { this.#io.emit('io:device', event); };

  
  /// ////////////////////////////////////////////////////////////////////// ///
  /// Connect and disconnect clients
  /// ////////////////////////////////////////////////////////////////////// ///
  connect = (httpServer) => {
    
    this.#httpServer = httpServer;
    this.#io = new Server(httpServer);
    
    this.#io.on('connection', (socket) => {
      this.#sockets.push(socket);
      if(this.#io.engine.clientsCount == 1) { this.connectMonitor(monitor); }
      
      var n = this.#io.engine.clientsCount;
      win.def.log({ level: 'info', file: 'socket', func: 'Connect', message: `N: ${n} | Socket: ${socket.id}`});
      
      
      /// ////////////////////////////////////////////////////////////////// ///
      /// Register disconnection
      /// ////////////////////////////////////////////////////////////////// ///
      socket.on('disconnect', () => {
        /// Remove socket from array
        var i = this.#sockets.indexOf(socket);
        this.#sockets.splice(i, 1);
        
        var n = this.#io.engine.clientsCount;
        win.def.log({ level: 'info', file: 'socket', func: 'Disconnect', message: `N: ${n} | Socket: ${socket.id}` });
        if(this.#sockets.length == 0) { this.disconnnectMonitor(); }
      });
      
    })
  }
  
  connectMonitor(mon) {
    this.#monitor = mon;
    monitor.on('port',   this.emitPortEvent);
    monitor.on('com',    this.emitComEvent);
    monitor.on('data',   this.emitDataEvent);
    monitor.on('device', this.emitDeviceEvent);
  }
  
  disconnnectMonitor() {
    if(this.#monitor){
      this.#monitor.removeListener('port',   this.emitPortEvent);
      this.#monitor.removeListener('com',    this.emitComEvent);
      this.#monitor.removeListener('data',   this.emitDataEvent);
      this.#monitor.removeListener('device', this.emitDeviceEvent);
      this.#monitor = null;
    }
  }
}


const controller = new SocketController();

module.exports = controller;

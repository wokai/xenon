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

const EventEmitter   = require('events');
const path           = require('path'); 
const { dateformat } = require(path.join(__dirname, '..', 'logger', 'dateformat'));
const config         = require(path.join(__dirname, '..', 'config', 'general'));


/// //////////////////////////////////////////////////////////////////////// ///
/// Monitor is an interface for dynamic data:
/// Only notifies upon changes of status or newly incoming data
///
/// No interface for querying static status or stored data
/// //////////////////////////////////////////////////////////////////////// ///

class Monitor extends EventEmitter {
  
  constructor(){ super(); }
  
  /// ////////////////////////////////////////////////////////////////////// ///
  /// source : port, medibus or data
  /// action : open, close
  /// message: Exampe: Port opened
  /// ////////////////////////////////////////////////////////////////////// ///

  /// ////////////////////////////////////////////////////////////////////// ///
  /// Port message:
  /// Informs about status changes of port.
  ///
  /// Port status changes (open, close, parameter change) occur infrequently.
  /// Thus, status is mostly constant and thus should be queried via REST.
  ///
  /// source : port, bus or data
  /// action : open, close, update
  /// message: Exampe: Port opened
  /// ////////////////////////////////////////////////////////////////////// ///
  
  
  /// ////////////////////////////////////////////////////////////////////// ///
  /// Data Message:
  /// 
  /// ////////////////////////////////////////////////////////////////////// ///
  
  emitMsg  = (source, action, message, data) => {
    var d = new Date(); 
    this.emit(source, {
      date    : d.toISOString().substr(0, 10),  
      time    : dateformat(d, config.monitor.dateformat),
      action  : action,
      message : message,
      data    : data
    });
  }
  
  /**
   * @usedBy{PortController.handlePortOpened}
   * @usedBy{PortController.handlePortClosed} (/controller)
   **/
  portMsg   = (action, msg, data={}) => { this.emitMsg('port', action, msg, data); }
  
  /**
   * @usedBy{StatusController.setStatus}      (/controller)
   **/
  comMsg    = (action, msg, data={}) => { this.emitMsg('com',  action, msg, data); }
  
  /**
   * @usedBy{MessageController.doNextAction}  (/controller)
   * @target{index.html} - (socket.on | io:data)
   **/
  dataMsg   = (action, msg, data={}) => { this.emitMsg('data',   action, msg, data); }
  deviceMsg = (action, msg, data={}) => { this.emitMsg('device', action, msg, data); }
  
  /**
   * @usedBy{ExspiredAlarms.push(period)} - (model/data/alarm)
   * @target{index.html} - (socket.on | io:info | Will be fed into message table)
   **/
  infoMsg   = (action, msg)          => { this.emitMsg('info',   action, msg,    {}); }
}

const monitor = new Monitor();
module.exports = monitor;

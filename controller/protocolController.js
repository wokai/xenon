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

const path        = require('path');
const config      = require(path.join(__dirname, '..', 'config', 'medibus'));
const win         = require(path.join(__dirname, '..', 'logger', 'logger'));
const responses   = require(path.join(__dirname, '..', 'model', 'medibus', 'responses'));
const commands    = require(path.join(__dirname, '..', 'model', 'medibus', 'commands'));

const status      = require(path.join(__dirname, 'statusController'));
const { port }    = require(path.join(__dirname, 'portController'));
const { episode } = require(path.join(__dirname, '..', 'model', 'episode'));


/// //////////////////////////////////////////////////////////////////////// ///
/// Rejecting a promise, when not resolved within a given timespan
///
/// Dräger RS 232 MEDIBUS (Revision Level 6.00): Time-out (p.5)
/// Any pause in the data flow exceeding 3 seconds leads to a time-out.
/// ////////////////////////////////////////////////////////////////////// ///

class CommandTimeout {
  
  #msg
  #promise
  #reject
  #resolve
  
  constructor(msg) {
    
    this.#msg = msg;
    this.#promise = new Promise((resolve, reject) => {
        
      setTimeout(() => {
          reject({ status: 'Timeout', message: msg })
      }, config.time.timeout); /// Limit: 3 sec
      
      this.#resolve = resolve;
      this.#reject = reject;
    });
  }
  
  /// ////////////////////////////////////////////////////////////////////// ///
  /// The promise is the only connection to downstream processing of reply
  /// to a pending command.
  /// ////////////////////////////////////////////////////////////////////// ///
  get promise() { return this.#promise; }
  
  
  /**
   * @usedBy{ProtocolController.receiveMessage} - (Triggered by React)
   * @param {msg} - (Message) - (/model/medibus/message)
   **/
  onReply = (msg) => {
    if(msg.hexCode == this.#msg.hexCode){
      win.def.log({ level: 'verbose', file: 'protocolController', func: 'CommandTimeout.onReply', message: `Resolving reply: ID ${msg.id} | Code ${msg.code}`});
      this.#resolve(msg);
    } else {
      /// This may be a NAK ...
      this.#reject(msg);
      win.def.log({ level: 'verbose', file: 'protocolController', func: 'CommandTimeout.onReply', message: `Non resolving reply: ID ${msg.id} | Code ${msg.code}`});
    }
  }
  
  /**
   * @usedBy{ProtocolController.sendCommand} - (Triggered by Action.sendCommand)
   * @descr{Required here in order to re-throw Promise rejection}
   **/
  sendCommand = () => {
    port.sendMessage(this.#msg)
      .then((res) => { /** Should be 'OK' **/ })
      .catch((err) => { this.#reject({ id: 0, code: err }); });
  }
  
}


/// //////////////////////////////////////////////////////////////////////// ///
/// Manages part of Medibus communication requirements not covered by
/// EventLoop:
/// - Initialisation and stopping of commmunication
/// - Sending and receiving NOP commands at appropriate timepoints
/// - Sending Commands and receiving appropriate replies
///
/// Intermediate between EventLoop and MessageLayer
/// //////////////////////////////////////////////////////////////////////// ///

class ProtocolController {
  
  #cmdTimeout /// {CommandTimeout}
  
  constructor() {
    this.#cmdTimeout = null;
  }


  /**
   * @usedBy{React._transform} - (/bus/react) - (event-loop)
   **/
  /// ToDo: Retry | recovery strategy ?
  initCom = () => {
    if(status.controller.listen) {
      port.sendMessage(responses.icc)
        .then(res => {
          /// ////////////////////////////////////////////////////////////// ///
          /// Communication is initialized after having received a response to a
          /// transmitted ICC (p.4).
          /// Setting status triggers first action of messageController
          /// ////////////////////////////////////////////////////////////// ///
          status.controller.setStatus(status.status.initialising);
        })
        .catch(err => {
          win.def.log({ level: 'warn', file: 'protocolController', func: 'initCom', message: `Port closed.`});
          console.log('[ProtocolController.initCom]', err);
        })
    }
  }

  
  /**
   * @usedBy{React._transform} - (/bus/react) - (event-loop)
   * @param {msg}              - (Message)    - (/model/medibus/message)
   * @descr {Will be called as default when React catches an incoming reply to a previously sent command}
   **/
  receiveMessage = (msg) => {
    win.def.log({ level: 'debug', file: 'protocolController', func: 'receiveMessage', message: `Id: ${msg.id} | Code: ${msg.code}`});
    if(this.#cmdTimeout){ 
      this.#cmdTimeout.onReply(msg);
    } 
  }
  
  /// MessageLayer sends Messages and receives replies via the same function
  /// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ ///
  /// ToDo: A Timeout is unexpected and should therefore trigger
  /// a retry or a schutdown ....
  /// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ ///
  
  /**
   * @usedBy{Action.sendCommand}
   **/
  
  async sendCommand(msg) {
    this.#cmdTimeout = new CommandTimeout(msg);
    this.#cmdTimeout.sendCommand();
    return this.#cmdTimeout.promise
  }
  
  
  /// ////////////////////////////////////////////////////////////////////// ///
  /// Terminatation of Medibus communication via STOP command
  /// ////////////////////////////////////////////////////////////////////// ///
  
  /**
   * @usedBy{React._transform} - (/bus/react) - (event-loop)
   * @usedBy{this.stop}        - (sending stop failed)
   **/
  
  shutdown = () => {
    port.close()
      .then(res => {
        win.def.log({ level: 'verbose', file: 'protocolController', func: 'shutdown', message: `${res.text} | Status: ${res.status.openText} | Path: ${res.status.path.path}`});
      })
      .catch(err => {
        win.def.log({ level: 'warn', file: 'protocolController', func: 'shutdown', message: err.message });
      })
  }
    
  /**
   * @usedBy{NextMessage._write} - (/bus/nextMessage)
   * @descr{Called when NextMessage is reached while Status is stopping}
   **/
  stop = () => {
    port.sendMessage(commands.stop)
      .then((resp) => {
        status.controller.setStatus(status.status.inactive);
        win.def.log({ level: 'verbose', file: 'protocolController', func: 'stop', message: 'Sent STOP command'});
      }).catch(err => {
        this.shutdown();
        win.def.log({ level: 'warn', file: 'protocolController', func: 'stop', message: err.message });
      });
  }
  
}

const protocolController = new ProtocolController();

module.exports = {
  protocol : protocolController
}

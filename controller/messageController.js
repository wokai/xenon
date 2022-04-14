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

const path = require('path');
const win     = require(path.join(__dirname, '..', 'logger', 'logger'));
const status  = require(path.join(__dirname, 'statusController'));
const config  = require(path.join(__dirname, '..', 'config', 'medibus'));
const action  = require(path.join(__dirname, '..', 'bus', 'action'));
const monitor = require(path.join(__dirname, '..', 'monitor', 'monitor'));
const { ventilation } = require(path.join(__dirname, '..','model', 'data', 'ventilation'));
const { temporal }    = require(path.join(__dirname, '..','model', 'data', 'temporal'));


/// //////////////////////////////////////////////////////////////////////// ///
/// Manages scheduled messages
/// - First messages: Device-id, Datetime
/// - Cycles sets of data requests
/// //////////////////////////////////////////////////////////////////////// ///


class MessageController {
  
  #schedule
  
  constructor() {
    
    this.#schedule = [];
    
    /// //////////////////////////////////////////////////////////////////// ///
    /// 
    /// //////////////////////////////////////////////////////////////////// ///
    
    status.controller.on('initialising', (data) => {
      status.controller.setStatus(status.status.protocol);
      this.loadInitialMessages();
      this.loadCycle();
      this.doNextAction();
    });
  }
  
  loadInitialMessages = () => {
    this.#schedule.unshift(action.devid);
    this.#schedule.unshift(action.time);
  }
  
  loadCycle = () => {
    this.#schedule.unshift(action.dat1);
    this.#schedule.unshift(action.alarm.ll);
    this.#schedule.unshift(action.alarm.hl);
    this.#schedule.unshift(action.alarm.cp1);
    this.#schedule.unshift(action.alarm.cp2);
  }

  doNextAction = (id) => {
    win.def.log({ level: 'debug', file: 'messageController', func: 'doNextAction', message: `Length: ${this.#schedule.length} | From Message: ${id}`});
    if(status.controller.sending) {
      if(!this.#schedule.length) {
        monitor.dataMsg('cycle', `Message cycle finished. Message id ${id}.`, ventilation.getValueObject());
        temporal.addVentData(ventilation.getValueObject());
        this.loadCycle();
      }
      this.#schedule.pop().sendCommand()
    }
  }
  
  stop = () => { action.stop.sendCommand(); }
  
}

const messageController = new MessageController();

module.exports = {
  messageController : messageController
}

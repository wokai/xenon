'use strict';
/*******************************************************************************
 * The MIT License
 * Copyright 2022, Wolfgang Kaisers
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
 
const win = require(path.join(__dirname, '..', 'logger', 'logger'));

const { protocol }      = require(path.join(__dirname, '..', 'controller', 'protocolController'));
const status            = require(path.join(__dirname, '..', 'controller', 'statusController'));

const commands          = require(path.join(__dirname, '..', 'model', 'medibus', 'commands'));
const DataResponse      = require(path.join(__dirname, '..', 'model', 'medibus', 'dataResponse'));

const { device }        = require(path.join(__dirname, '..', 'model', 'data', 'device'));
const { dateTime }      = require(path.join(__dirname, '..', 'model', 'data', 'dateTime'));
const { ventilation }   = require(path.join(__dirname, '..', 'model', 'data', 'ventilation'));

const { alarmLimits, cp1Alarms, cp2Alarms }
                        = require(path.join(__dirname, '..', 'model', 'data', 'alarm'));
                        
const { text }          = require(path.join(__dirname, '..', 'model', 'data', 'text'));
const { settings }      = require(path.join(__dirname, '..', 'model', 'data', 'settings'));

const monitor           = require(path.join(__dirname, '..', 'monitor', 'monitor'));




/// //////////////////////////////////////////////////////////////////////// ///
/// Wrapper around Medibus message which additionally defines action
/// upon incoming result 
/// //////////////////////////////////////////////////////////////////////// ///

class Action {
  
  #message
  #callback
  #timeout
  #timeoutId
  
  /**
   * @param{Message, function, number}: 
   */
  constructor(msg, callback, timeout = 0){
    this.#message = msg;        /// Message (model/medibus/message)
    this.#callback = callback;
    this.#timeout = timeout;
    this.#timeoutId = 0;
  }

  /**
   * @usedBy {MessageController.doNextAction} - /controller
   */
  sendCommand () {

    this.#timeoutId = setTimeout(() => {
      protocol.sendCommand(this.#message)
        .then((msg) => { 
          this.#callback(msg);
        })
        .catch((err) => {
          /// Promise will be rejected when timout is exceeded or command fails
          if(err.message){
            monitor.dataMsg('Action', `Rejection of command: id ${err.message.id} | code: ${err.message.code} | Status: ${err.status}`);
            win.def.log({ level: 'warn', file: 'action', func: 'Action.sendCommand', message: `Rejected promise: Message: id ${err.message.id} | Code: ${err.code} | Status: ${err.status}`});
          } else {
            win.def.log({ level: 'warn', file: 'action', func: 'Action.sendCommand', message: `Rejected promise: ${err.status}`});
          }
        })
        /// Reset timeoutId
        this.#timeoutId = 0;
    }, this.#timeout);
  }
}


/**
 * @usedBy {MessageController.loadCycle} - /controller
 */
module.exports = {
  nop : new Action(commands.nop, (msg) => { /** No operation ... */ }, 1000),
  
  devid : new Action(commands.device.id, (msg) => {
    device.extract(msg);
    monitor.deviceMsg('Device', `${device.name} | ${device.devRevision} | ${device.busRevision}`, device.dataObject);
    win.def.log({ level: 'debug', file: 'action', func: 'devid', message: `Msg id: ${msg.id} | Device id: ${device.name}` });
  }),
  
  time : new Action(commands.device.time, (msg) => {
    dateTime.extract(msg)
    win.def.log({ level: 'debug', file: 'action', func: 'time', message: `Msg id: ${msg.id} | DateTime: ${dateTime.medium}` });
    monitor.dataMsg('datetime', `String: ${dateTime.medium}`, { date: dateTime.date, time: dateTime.time });
  }),
  
  dat1 : new Action(commands.dat1, (msg) => {
    win.def.log({ level: 'debug', file: 'action', func: 'dat1', message: `Msg id: ${msg.id} | Code: ${msg.code}`});
    ventilation.setVentilation(msg);
  }),
  
  stop: new Action(commands.stop, (msg) => {
    win.def.log({ level: 'debug', file: 'action', func: 'stop', message: `[STOP] Communication stopped. Msg id: ${msg.id} | Code: ${msg.code}`});
    status.controller.setStatus(status.status.inactive);
  }),
  
  alarm : {
    ll : new Action(commands.alarm.ll, (msg) => {
        win.def.log({ level: 'debug', file: 'action', func: 'alarm.lolim', message: `Msg id: ${msg.id} | Code: ${msg.code} | Time: ${msg.time} | Date: ${msg.date}`})
        ventilation.setAlarmLoLim(msg);
        alarmLimits.setLowLimits(new DataResponse(msg));
      }),
    hl : new Action(commands.alarm.hl, (msg) => {
        win.def.log({ level: 'debug', file: 'action', func: 'alarm.hilim', message: `Msg id: ${msg.id} | Code: ${msg.code}`})
        ventilation.setAlarmHiLim(msg);
        alarmLimits.setHighLimits(new DataResponse(msg));
      }),
    cp1 : new Action(commands.alarm.cp1, (msg) => {
        win.def.log({ level: 'debug', file: 'action', func: 'alarm.cp1', message: `Msg id: ${msg.id} | Code: ${msg.code}`})
        cp1Alarms.extractAlarm(msg);
      }),
    cp2 : new Action(commands.alarm.cp2, (msg) => {
        win.def.log({ level: 'debug', file: 'action', func: 'alarm.cp2', message: `Msg id: ${msg.id} | Code: ${msg.code}`})
        cp2Alarms.extractAlarm(msg);
      })
  },
  
  text: new Action(commands.text, (msg) => {
    win.def.log({ level: 'debug', file: 'action', func: 'text', message: `Msg id: ${msg.id} | Code: ${msg.code}`});
    text.extractTextMessages(msg);
  }),
  
  settings: new Action(commands.device.settings, (msg) => {
    win.def.log({ level: 'info', file: 'action', func: 'settings', message: `Msg id: ${msg.id} | Code: ${msg.code}`});
    settings.extractSettings(msg);
  })
}




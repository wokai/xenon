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

//const colors       = require('colors');
const Stream       = require('stream');
const EventEmitter = require('events');

const bus       = require('../config/medibus');
const win       = require('../logger/logger');
const monitor   = require('../monitor/monitor');

const { port }  = require('../controller/portController');
const responses = require('../model/medibus/responses');


const status = require('../controller/statusController');
const { protocol } = require('../controller/protocolController');
const { messageController } = require('../controller/messageController');


/// //////////////////////////////////////////////////////////////////////// ///
/// Part of the Event - Loop: 
/// Message processing between PortController and downstream Data processing
///
/// -  Message-Delimiter
/// -  Message-Parser
/// -> React
/// -  Next-Message
/// //////////////////////////////////////////////////////////////////////// ///


/// //////////////////////////////////////////////////////////////////////// ///
/// Reply: Send answers upon imcoming commands
/// This segment of the processing chain fulfills the requirement, that
/// there must be an answer for incoming commands.
/// //////////////////////////////////////////////////////////////////////// ///

class React extends Stream.Transform {
  
  constructor() {
    super({ objectMode: true })
  }
  
  /**
   * @param{msg}      - (Message) - (/model/medibus/message)
   * @param{encoding} - (String)
   * @param{callback} - (Function)
   **/
  
  _transform(msg, encoding, callback){
    /// ToDo: React only, when controller is in active state ??
    
    
    /// //////////////////////////////////////////////////////////////////// ///
    /// React to commands by sending appropriate results
    /// //////////////////////////////////////////////////////////////////// ///
    
    if(msg.isCmd()){
      
      win.def.log({ level: 'verbose', file: 'react', func: '_transform', message: `Incoming command: ID ${msg.id} | ${msg.code}`});
      
      switch(msg.hexCode){
        case bus.command.icc:
          /// Eventually sends ICC reply...
          protocol.initCom();
          callback();
          break;
        
        case bus.command.devid:
          /// ToDo send device id with appropriate content
          port.sendMessage(responses.devid)
            .then(() => {
              /// DEV_ID is usually sent immediately after ICC response
              /// and thus may trigger next action
              callback();
            })
          break;
          
        case bus.command.nop:
          port.sendMessage(responses.nop)
            .then(res => {
              /// NOP command triggers next action ...
              this.push(msg);
              callback(); 
            })
            .catch(err => {
              win.def.log({ level: 'warn', file: 'react', func: '_transform', message: `Write failure while sending NOP` });
              /** No further action upon write failure*/ 
            })
          break;
        
        default:
          win.def.log({ level: 'debug', file: 'react', func: '_transform', message: `No reply is sent upon this message | ID: ${msg.id} | Code: ${msg.code} | ${msg.strBuffer()}` });
          callback();
          /// ... (ToDo ???)
      }
      
    /// //////////////////////////////////////////////////////////////////// ///
    /// React on response
    /// //////////////////////////////////////////////////////////////////// ///
    } else if (msg.isReply()){
      
      switch(msg.hexCode){
        case bus.command.stop:
         win.def.log({ level: 'debug', file: 'react', func: '_transform', message: 'Received STOP reply.' });
          protocol.shutdown();
          /// Message is pushed to prevent overflow.
          /// NexMessage will not act upon this..
          this.push(msg);
          callback()
          break;
          
        default:
          /// ////////////////////////////////////////////////////////////// ///
          /// Replies initiate two actions: 
          /// 1) Processing of incoming data on protocol layer (output) 
          /// 2) Trigger next command downstream in NextMessage as part of the
          /// Medibus command-reply cycle.
          /// ////////////////////////////////////////////////////////////// ///
          protocol.receiveMessage(msg);
          this.push(msg);
          callback();     
      }
    } else {
      win.def.log({ level: 'debug', file: 'react', func: '_transform', message: `Unknown message type  ID: ${msg.id} | Code: ${msg.code} | ${msg.strBuffer()}`});
      /// Not further processed...
      callback();
    }
    
  }
  
  /// Is never called ...
  _flush(callback){
    callback(null); 
  }
}

const react = new React();

module.exports = {
  react: react
}


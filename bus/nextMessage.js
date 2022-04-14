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

const Stream    = require('stream');
const win       = require('../logger/logger');
const monitor   = require('../monitor/monitor');
const status    = require('../controller/statusController');
const { messageController } = require('../controller/messageController');
const { protocol } = require('../controller/protocolController');


/// //////////////////////////////////////////////////////////////////////// ///
/// Reply: Send answers upon imcoming commands
/// This segment of the processing chain fulfills the requirement, that
/// there must be an answer for incoming commands.
/// //////////////////////////////////////////////////////////////////////// ///


class NextMessage extends Stream.Writable {
  
  constructor() { super({ objectMode: true }) }
  
  _write = (msg, encoding, callback) => {    
    if(status.controller.sending){
      win.def.log({ level: 'debug', file: 'nextMessage', func: '_transform', message: `Init next action from ID ${msg.id}`});
      messageController.doNextAction(msg.id);
    } else if(status.controller.stopping) {
      win.def.log({ level: 'debug', file: 'nextMessage', func: '_transform', message: 'Sending STOP' });
      protocol.stop();
    } else {
      win.def.log({ level: 'debug', file: 'nextMessage', func: '_transform', message: `No action because status (${status.controller.text}) is NOT sending`});
    }
    callback(); 
  }
  
  _flush(callback) { callback(null); }
}

const nextMessage = new NextMessage();



module.exports = {
  nextMessage: nextMessage
}


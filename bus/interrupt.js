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

const Stream = require('stream');

const bus = require('../config/medibus');
const win = require('../logger/logger');

const status = require('../controller/statusController');

/// //////////////////////////////////////////////////////////////////////// ///
/// Software handshaking:
/// Some control characters can be sent at any time to control the flow of data.
/// They do not require responses.
/// //////////////////////////////////////////////////////////////////////// ///

class Interrupt extends Stream.Transform {
  
  constructor(){
    super({ objectMode: false })
  }
  
  _transform(chunk, encoding, callback){
    
    /// When control character appears, StatusController is notified 
    /// ToDo: Init consequentual actions and status changes ....
    
    for(var i = 0; i < chunk.byteLength; ++i){
      
      /// Changes in status handshake will trigger messages ...
      if(chunk[i] == bus.handshake.suspend) {
        status.controller.setHandshake(status.handshake.suspend);
      }
      
      if(chunk[i] == bus.handshake.resume)  {
        status.controller.setHandshake(status.handshake.resume);
      }
      
      if(chunk[i] == bus.handshake.abort)   {
        status.controller.setHandshake(status.handshake.abort);
      }
      
    }
    this.push(chunk);
    callback();
  }
  
  _flush(callback){ callback(null); }
}

const interrupt = new Interrupt();


module.exports = {
  interrupt: interrupt
};

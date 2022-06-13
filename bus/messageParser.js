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
const win = require('../logger/logger');
const Medibus = require('../model/medibus/message');


/// //////////////////////////////////////////////////////////////////////// ///
/// Part of the Event - Loop: 
/// Message processing between PortController and downstream Data processing
///
/// -  Message-Delimiter
/// -> Message-Parser
/// -  React
/// -  Next-Message
/// //////////////////////////////////////////////////////////////////////// ///


/// //////////////////////////////////////////////////////////////////////// ///
/// Message parser
/// //////////////////////////////////////////////////////////////////////// ///

class MessageParser extends Stream.Transform {
  constructor(){
    super({objectMode: true})
  }
  
  
  /**
   * @param{chunk}    - (Buffer: node:buffer)
   * @param{encoding} - (String)
   * @param{callback} - (Function)
   **/
  
  _transform(chunk, encoding, callback){
    /// Create message object from Buffer. Checksum is verified
    // ToDo: Reply NAK when checksum verification fails ...
    var msg = Medibus.Message.fromBuffer(chunk);
    win.def.log({ level: 'verbose', file: 'messageParser', func: '_transform', message: `Msg ID ${msg.id} |  Type: ${msg.typestr} | Msg-code ${msg.code}.`});
    this.push(msg);
    callback()
  }
  
  _flush(callback){ callback(null); }
}

const messageParser = new MessageParser();

module.exports = {
  messageParser: messageParser
}

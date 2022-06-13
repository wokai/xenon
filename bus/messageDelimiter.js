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


/// //////////////////////////////////////////////////////////////////////// ///
/// Part of the Event - Loop: 
/// Message processing between PortController and downstream Data processing
///
/// -> Message-Delimiter
/// -  Message-Parser
/// -  React
/// -  Next-Message
/// //////////////////////////////////////////////////////////////////////// ///



/// //////////////////////////////////////////////////////////////////////// ///
/// Accumulation of data up to apperance of message delimiter (0xd)
/// in *Binary mode*.
///
/// '@serialport/parser-delimiter' does not work because
/// he swithes to string-mode
/// //////////////////////////////////////////////////////////////////////// ///

class MessageDelimiter extends Stream.Transform {

  #array /// NodeJs array
  
  constructor(){
    super({ objectMode: false })
    /// Array (variable size)
    this.#array = [];
  }
  
  _transform(chunk, encoding, callback){
    for(let i = 0; i < chunk.byteLength; ++i){
      this.#array.push(chunk[i]);
      if(chunk[i] == bus.message.terminator){
        /// Re-transform array into Buffer
        /// (Stream requires Buffer or Uint8Array)
        this.push(Buffer.from(this.#array));
        this.#array.length = 0;
      }
    }
    callback()
  }
  
  _flush(callback){
    if(this.#array.length){
      this.push(Buffer.from(this.#array));
    }
    callback(null);
  }
}

const msgDelim = new MessageDelimiter();

module.exports = {
  msgDelim : msgDelim
}

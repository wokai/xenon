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
const win         = require(path.join(__dirname, '..', '..', 'logger', 'logger'));
const TextSegment = require(path.join(__dirname, 'textSegment'));
const bus         = require(path.join(__dirname, '..', '..', 'config', 'medibus'));

class TextMessageResponse {

  #msgid        /// @type{Number}
  #time         /// @type{Date}
  #code         /// Message.code
  #hexPayload   /// Message.hexPayload
  #map          /// Map key = Text-Message-Code | value = TextSegment

  /**
   * @param{Message} - (/model/medibus/message)
   * @usedBy{Text}   - (/model/data/text)
   **/
  constructor(msg) {
    this.#map   = new Map();
    this.#msgid = msg.id;
    this.#time  = msg.dateTime;
    this.#code  = msg.code;
     
    if(msg.hasPayload){
      this.#hexPayload = msg.hexPayload;            
      let ts;
      let index = 0;    /// Start position of next segment. 0-based.

      while(index < this.#hexPayload.length){
        ts =  TextSegment.from(msg, index);
        index = ts.end;
        this.#map.set(ts.code, ts);
      }
    }
    win.def.log({ level: 'debug', file: 'TextMessageResponse', func: 'constructor', message: ` MsgId: ${this.id} | Segments: ${this.#map.size}`});
  }

  
  get id        () { return this.#msgid; }
  get time      () { return this.#time; }
  get rawLength () { return this.#hexPayload.length; }
  get length    () { return this.#map.length; }
  get payload   () { return this.#hexPayload; }
  get array     () { return [...this.#map.values()]; }
  get map       () { return this.#map; }
  get size      () { return this.#map.size; }
  static from = (msg) => { return new TextMessageResponse(msg); }
    
  /**
   * @usedBy{Text} - (/model/data/text)
   **/
  get dataObject () {
    return Array.from(this.#map.values()).map(r => r.dataObject);
  }
  
}


module.exports = TextMessageResponse;

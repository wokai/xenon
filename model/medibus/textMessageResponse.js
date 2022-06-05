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

const win = require('../../logger/logger');
const TextSegment = require('./textSegment');

/// //////////////////////////////////////////////////////////////////////// ///
/// Response to Data Request Command:
/// - 27H: Request current Alarms (codepage 1)
/// - 2EH: Request current Alarms (codepage 2)
/// Message contains priority, code and message for all current alarms
///
/// Payload format:
///  1 byte  alarm priority
///  2 bytes alarm code
/// 12 bytes alarm phrase
/// //////////////////////////////////////////////////////////////////////// ///

///                                                                                                               ETX
/// <Buffer 32 34 31 25 03 32 38 4a 41 6e 61 65 73 74 68 65 73 69 65 2d 47 61 73 20 44 45 53 46 4c 55 52 41 4e 45 03 32 43 37 64 65 75 74 73 63 68 03 33 37 3e 54 ... 63 more

class TextMessageResponse {

  #msgid
  #time
  #code         /// Message.code
  #hexPayload   /// Message.hexPayload
  #map          /// Map key-value pairs: 

  /**
   * @param{Message} - (/model/medibus/message)
   **/
  constructor(msg) {
    this.#map = new Map();
    this.#msgid = msg.id;
    this.#time  = msg.dateTime;
     this.#code = msg.code;
     
    if(msg.hasPayload){
      this.#hexPayload = msg.hexPayload;
      console.log(`[TextMessageResponse] payload size: ${this.#hexPayload.length}`)
      console.log(this.#hexPayload);
      
      let segm = new TextSegment(this, 0);
    }
    //win.def.log({ level: 'info', file: 'TextMessageResponse', func: 'construct', message: `ID: ${msg.id}, Segments: ${this.#map.size}`});
  }

  
  get id        () { return this.#msgid; }
  get time      () { return this.#time; }
  get rawLength () { return this.#hexPayload.length; }
  get length    () { return this.#map.length; }
  get payload   () { return this.#hexPayload; }
  get array     () { return [...this.#map.values()]; }
  get map       () { return this.#map; }
  static from = (msg) => { return new TextMessageResponse(msg); }
  
  getSegment = (s) => {
    const r = this.#map.get(s);
    return r ? r.value : null;
  }
  
  logSegments = () => {
    this.#map.forEach(function(value, key) {
      win.def.log({level: 'debug', file: 'TextMessageResponse', func: 'logSegments', message: `[Segment] Key: ${key}` })
    })
  }
  
}


module.exports = TextMessageResponse;

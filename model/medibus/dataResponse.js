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

const win = require('../../logger/logger');
const DataSegment = require('./dataSegment');

/// //////////////////////////////////////////////////////////////////////// ///
/// Response to Data Request Command:
/// - 24H: Request current measured Data     (codepage 1)
/// - 25H: Request current low Alarm Limits  (codepage 1)
/// - 26H: Request current high Alarm Limits (codepage 1)
/// - 2BH: Request current measured Data     (codepage 2)
/// - 2CH: Request current low Alarm Limits  (codepage 2)
/// - 2DH: Request current high Alarm Limits (codepage 2)
///
/// Contains the current values of all measured parameters or alarm limits 
/// available on the responding device.
/// //////////////////////////////////////////////////////////////////////// ///

class DataResponse {

  #msgid
  #date
  #time
  #code
  #hexPayload
  #map      /// Map with data segments

  constructor(msg) {

    this.#msgid = msg.id;
    this.#time  = msg.time;
    this.#date  = msg.date;
    
    this.#code = msg.code;
    this.#hexPayload = msg.hexPayload;
    this.#map = new Map();


    if(msg.hasPayload()) {
      
      if(this.#hexPayload.length % 6 != 0){
        win.def.log({level: 'error', file: 'dataResponse', func: 'construct', message: `Incompatible length of data segment: ${this.#hexPayload.length}` });
      } else {
        /// Each data segment is of 6 Bytes length
        var segments = this.#hexPayload.length / 6;
        var s;
        
        win.def.log({ level: 'debug', file: 'dataResponse', func: 'construct', message: `MSG id: ${msg.id} | Reading ${segments} from payload size ${this.#hexPayload.length}.`});
        
        for(var i = 0; i < segments; ++i){
          s = DataSegment.from(this, i);
          this.#map.set(s.codeString, s);
        }
      }
    }
    win.def.log({ level: 'debug', file: 'dataResponse', func: 'construct', message: `ID: ${msg.id}, Segments: ${this.#map.size}`});
  }

  
  get id        () { return this.#msgid; }
  get time      () { return this.#time; }
  get date      () { return this.#date; }
  get rawLength () { return this.#hexPayload.length; }
  get length    () { return this.#map.length; }
  get payload   () { return this.#hexPayload; }
  get array     () { return [...this.#map.values()]; }
  get map       () { return this.#map; }
  static from = (msg) => { return new DataResponse(msg); }
  
  getSegment = (s) => {
    const r = this.#map.get(s);
    return r ? r.value : null;
  }
  
  logSegments = () => {
    this.#map.forEach(function(value, key) {
      win.def.log({level: 'debug', file: 'dataResponse', func: 'logSegments', message: `[Segment] Key: ${key}` })
    })
  }

}


module.exports = DataResponse;

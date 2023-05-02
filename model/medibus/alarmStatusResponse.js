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

const win = require('../../logger/logger');
const AlarmSegment = require('./alarmSegment');

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

/**
 * @def   Handles data-segment of Medibus Alarm-Status-Response (27H)
 * @use   model/data/alarm  CurrentAlarms.extractAlarm
 */


class AlarmStatusResponse {

  #msgid      /// { number }
  #time       /// { Date }   (model/medibus/message) - (msg.dateTime)
  #code       /// { string }
  #hexPayload
  #map        /// Map key-value pairs: keys=codeString, value = AlarmSegment object

  /**
   * @param{Message} (model/medibus/message)
   */
  constructor(msg) {

    this.#msgid      = msg.id;
    this.#time       = msg.dateTime;
    this.#code       = msg.code;
    this.#hexPayload = msg.hexPayload;
    this.#map        = new Map();


    if(msg.hasPayload()) {
      
      if(this.#hexPayload.length % 15 != 0){
        win.def.log({level: 'error', file: 'alarmStatusResponse', func: 'construct', message: `Incompatible length of data segment: ${this.#hexPayload.length}` });
      } else {
        /// Each alarm segment is of 15 Bytes length
        var segments = this.#hexPayload.length / 15;
        var s;
        
        win.def.log({ level: 'debug', file: 'alarmStatusResponse', func: 'construct', message: `MSG id: ${msg.id} | Reading ${segments} segments from payload size ${this.#hexPayload.length}.`});
        
        for(var i = 0; i < segments; ++i){
          s = AlarmSegment.from(this, i);
          this.#map.set(s.code, s);
        }
      }
    }
    win.def.log({ level: 'debug', file: 'alarmStatusResponse', func: 'construct', message: `ID: ${msg.id}, Segments: ${this.#map.size}`});
  }

  
  get msgId     () { return this.#msgid; }
  get id        () { return this.#msgid; }
  get time      () { return this.#time; }
  get rawLength () { return this.#hexPayload.length; }
  get length    () { return this.#map.length; }
  get payload   () { return this.#hexPayload; }
  get array     () { return [...this.#map.values()]; }
  get map       () { return this.#map; }
  static from = (msg) => { return new AlarmStatusResponse(msg); }
  
  getSegment = (s) => {
    const r = this.#map.get(s);
    return r ? r.value : null;
  }
  
  logSegments = () => {
    this.#map.forEach(function(value, key) {
      win.def.log({level: 'info', file: 'alarmStatusResponse', func: 'logSegments', message: `[Segment] Key: ${key}` })
    })
  }

}


module.exports = AlarmStatusResponse;

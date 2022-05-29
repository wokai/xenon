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


/// //////////////////////////////////////////////////////////////////////// ///
///  1 byte  alarm priority: Number in the range 1-31 (highest = 31)
///  2 bytes alarm code    : Two byte ASCII HEX
/// 12 bytes alarm phrase  : Character string.
/// //////////////////////////////////////////////////////////////////////// ///

const AsciiHex = require('./asciiHex');

const win = require('../../logger/logger');
const { parameters } = require('../parameters');


/**
 * @desc  Each instance handles content of one 
 * @use   /model/medibus/alarmStatusResponse (constructor)
 * 
 */
 
class AlarmSegment {
  
  #msgid    /// {number}
  #time     /// {string}
  #date     /// {string}
  #dateTime /// {Date}
  
  #priority /// {number}
  #code     /// {string} - ascii-hex
  #phrase   /// {string} - 12 bytes
  
  constructor(dataResponse, index) {
    
    var p = dataResponse.payload;
    var begin = index * 15;
    
    this.#priority = p.slice(begin    , begin +  1);   /// One  byte  priority
    this.#code     = p.slice(begin + 1, begin +  3);   /// two  bytes alarm code
    this.#phrase   = p.slice(begin + 3, begin + 18);   /// 12   bytes alarm phrase
    
    this.#msgid     = dataResponse.id;
    this.#time      = dataResponse.time;
    this.#date      = dataResponse.date;
    this.#dateTime  = dataResponse.dateTime;
    
    // ToDo: Remove
    win.def.log({ level: 'info', file: 'AlarmSegment', func: 'constructor', message: `[AlarmSegment] msgid: ${this.#msgid}, priority: ${this.#priority}, code: ${this.#code}, phrase: ${this.#phrase}`});
  }
  
  static from(d, i){
    var p = d.payload;
    if(p.length < (i + 1) * 15){
      win.def.log({ level: 'error', file: 'AlarmSegment', func: 'static from', message: `Out of range error: Array length: ${p.length}, Index: ${i}`});
      return null;
    }
    return new AlarmSegment(d, i);
  }
  
  get time            () { return this.#time; }
  get date            () { return this.#date; } 
  get dateTime        () { return this.#dateTime; }
  get messageId       () { return this.#msgid; }
  
  get priority        () { return parseInt(this.#priority); }
  get code            () { return AsciiHex.hexArrayToString(this.#code); }
  get phrase          () { return this.#phrase; }

  
  get dataObject      () {
    return {
      id: this.messageId,
      time: this.dateTime,
      priority: this.priority,
      code: this.code,
      phrase: this.value
    };
  }
  
}

module.exports = AlarmSegment;

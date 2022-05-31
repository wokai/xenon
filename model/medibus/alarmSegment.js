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

const AsciiHex = require('./asciiHex');
const win = require('../../logger/logger');
const { parameters } = require('../parameters');


/**
 * @desc  Each instance handles content of one AlarmStatusResponse message
 *        payload segment.
 *        The segments consists of 
 *        {priority} - Number in the range of 1-31 (one byte)
 *        {code}     - Two byte AsciiHex
 *        {phrase}   - Character string
 * @use   /model/medibus/alarmStatusResponse (constructor)
 */
 
class AlarmSegment {
  
  #msgid    /// {number} @desc{Message.id | model/medibus/message}
  #time     /// {Date}
  
  #priority /// {number}
  #code     /// {string} - ascii-hex
  #phrase   /// {string} - 12 bytes
  
  /**
   * @param  {AlarmStatusResponse, number} (model/medibus/alarmStatusResponse)
   * @usedBy {AlarmStatusResponse} constructor
   */
  constructor(alarmStatusResponse, index) {
    
    var p = alarmStatusResponse.payload;
    var begin = index * 15;
    
    this.#priority = p.slice(begin    , begin +  1);   /// One  byte  priority
    this.#code     = p.slice(begin + 1, begin +  3);   /// two  bytes alarm code
    this.#phrase   = p.slice(begin + 3, begin + 18);   /// 12   bytes alarm phrase
    
    this.#msgid    = alarmStatusResponse.id;
    this.#time     = alarmStatusResponse.time;
  }
  
  static from(d, i){
    var p = d.payload;
    if(p.length < (i + 1) * 15){
      win.def.log({ level: 'error', file: 'AlarmSegment', func: 'static from',
        message: `Out of range error: Array length: ${p.length}, Index: ${i}`});
      return null;
    }
    return new AlarmSegment(d, i);
  }
  
  get time            () { return this.#time; }
  get messageId       () { return this.#msgid; }
  get priority        () { return parseInt(this.#priority, 16); }
  get code            () { return AsciiHex.hexArrayToString(this.#code); }
  get phrase          () { return this.#phrase.toString(); }
  
  /**
   * @descr   Output for transformed data content
   * @usedBy {CurrentAlarms.extractAlarm} 
   */
  get dataObject      () {
    return {
      id: this.messageId,
      time: this.time,
      priority: this.priority,
      code: this.code,
      phrase: this.phrase
    };
  }
  
}

module.exports = AlarmSegment;

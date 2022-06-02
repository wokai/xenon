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

const { TextMessageResponse } = require('./textMessageResponse');

class TextMessage {
  
  
}

/// //////////////////////////////////////////////////////////////////////// ///
/// Represents the inner structure of a Medibus Text-Message-Response
/// //////////////////////////////////////////////////////////////////////// ///

class TextSegment {
  
  #msgid
  #time
  #code
  #length
  #text
  
  /**
   * @param{resp}  - (TextMessageResonse}
   * @param{index} - (number) - 0-based index of current position in payload
   **/
  constructor(resp, index) {
    
    var p = resp.payload;
    var begin = index * 15;
    
    this.#code     = p.slice(begin    , begin +  1);   /// One  byte  text-code
    this.#length   = p.slice(begin + 1, begin +  2);   /// one  bytes text-length (1-32) : Add 30 to decimal length value
    this.#phrase   = p.slice(begin + 3, begin + 18);   /// 12   bytes alarm phrase
    
    this.#msgid = resp.id;
    this.#time  = dataResponse.time;
    this.#date  = dataResponse.date;
  }
  
  static from(d, i){
    var p = d.payload;
    if(p.length < (i + 1) * 15){
      win.def.log({ level: 'error', file: 'TextSegment', func: 'static from', message: `Out of range error: Array length: ${p.length}, Index: ${i}`});
      return null;
    }
    return new TextSegment(d, i);
  }
  
  get time            () { return this.#time; }
  get date            () { return this.#date; } 
  get messageId       () { return this.#msgid; }
  
  get priority        () { return parseInt(this.#priority); }
  get code            () { return AsciiHex.hexArrayToString(this.#code); }
  get phrase          () { return this.#phrase; }

  
  get dataObject      () {
    return {
      id: this.messageId,
      date: this.date,
      time: this.time,
      priority: this.priority,
      code: this.codeString,
      phrase: this.value
    };
  }
  
}

module.exports = TextSegment;

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

/// //////////////////////////////////////////////////////////////////////// ///
/// Represents the inner structure of a Medibus Text-Message-Response
/// //////////////////////////////////////////////////////////////////////// ///

class TextSegment {
  
  #msgid
  #time
  #code
  #length
  #text
  #etx
  
  
  /**
   * @descr Decodes length segment to message length
   * @param{sgm}
   **/
  decodeLength = (sgm) => {
  }
  
  /**
   * @param{resp}  - (TextMessageResonse}
   * @param{index} - (number) - 0-based index of current position in payload
   **/
  constructor(resp, begin) {
    
    var p = resp.payload;

    
    /**
     * @descr{First two bytes}  - (Text-code)
     **/
    this.#code     = p.slice(begin    , begin +  2);     
    var index = begin + 2;
    
    /**
     * @descr{Third byte}       - (Text length)
     **/
    this.#length   = p.slice(index, index +  1);   /// one  byte  text-length (1-32) : Add 30 to decimal length value
    index = index + 1
    
    
    this.#text     = p.slice(index, index + this.length);   /// ASCII character string.
    /// ETX: End-of-text marker (ASCII-Code 03H)
    
    this.#msgid = resp.id;
    this.#time  = resp.time;   /// @type{Date}
    win.def.log({ level: 'info', file: 'TextSegment', func: 'constructor', message: `[TextSegment] MsgId: ${this.messageId} | Code: ${this.code} | Size: ${this.length} | Text: ${this.text}`});
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
  get messageId       () { return this.#msgid; }
  get code            () { return this.#code.toString()}   /// [ 0x32, 0x33 ] -> '23'
  get length          () { return this.#length.readUInt8(0) - 0x30; }
  get text            () { return AsciiHex.hexArrayToString(this.#text) };

  
  get dataObject      () {
    return {
      id: this.messageId,
      date: this.date
    };
  }
  
}

module.exports = TextSegment;

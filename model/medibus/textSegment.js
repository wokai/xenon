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


/// //////////////////////////////////////////////////////////////////////// ///
///  1 byte  alarm priority: Number in the range 1-31 (highest = 31)
///  2 bytes alarm code    : Two byte ASCII HEX
/// 12 bytes alarm phrase  : Character string.
/// //////////////////////////////////////////////////////////////////////// ///

const win = require('../../logger/logger');
const { parameters } = require('../parameters');

/// //////////////////////////////////////////////////////////////////////// ///
/// Represents the inner structure of a Medibus Text-Message-Response
/// //////////////////////////////////////////////////////////////////////// ///

class TextSegment {

  /**
   * @source{Message} - (Medibus message object)
   **/
  #msgid  /** @descr{number} */
  #time   /** @descr{Date}   */
  
  /**
   * @source{extractSegmentFromBuffer}
   **/
  #code   /** @descr{Buffer} - (First 2 bytes - Code of text message) */
  
  /**
   * @descr{Buffer} - (Ascii-code) - (length + 0x30 = Ascii-code)
   * @see{get length()}
   **/
  #length 
  #text   /** @descr{Buffer} - (Ascii-code) - (transmitted text)*/
  #etx
  
  #begin  /** @descr{number} - (position of message in buffer. 0-based) */
  #end    /** @descr{number} - (position of first element after buffer segment) */
  
  
  /**************************************************************************
   * @param{buffer} - (Buffer) - (Message.payload)
   * @param{begin}  - (number) - (position of message in buffer. 0-based)
   * @see  {Medibus Protocol 6.0.0 - Text Message Response - p.18}
   * @see  {Medibus for Primus     - Text Messages         - p.34}
   * @descr{Reads content of text-segment from buffer + sets #end position} 
   * */
  
  readSegmentFromBuffer = (buffer, begin) => {
       
    let index = begin;
    
    /**
     * @descr{First two bytes}  - (Code of text message)
     * @see{Medibus for Primus} - (Text Message - p.34)
     **/
    this.#code = buffer.slice(index , index + 2);
    index += 2;
    
    /**
     * @descr{Third byte}                 - (Text length, Ascii-code)
     * @descr{length + 0x30 = Ascii-code} - (Range: '1'=0x30 to 'P'=0x50)
     **/
    this.#length = buffer.slice(index, index + 1);
    index += 1;
    
    /**
     * @descr{Transmitted text} - {Ascii encoded)
     **/
    this.#text = buffer.slice(index, index + this.length);
    index += this.length;   
    
    /**
     * @descr{ETX} - (end-of-text = 0x30)
     **/
    this.#etx = buffer.slice(index, index + 1);
    
    /**
     * @descr{End position} - (Start position of next text segment, 0-based)
     **/
    this.#end = index + 1;
    
  }
  
  /**************************************************************************
   * @param{txtMsgRes}  - (TextMessageResonse}
   * @param{begin}      - (number: 0-based index of current position in payload)
   **/
  constructor(txtMsgRes, begin) {

    this.#msgid = txtMsgRes.id;     /// number
    this.#time  = txtMsgRes.time;   /// Date
    this.readSegmentFromBuffer(txtMsgRes.hexPayload, begin);
    win.def.log({ level: 'debug', file: 'TextSegment', func: 'constructor', message: `[TextSegment] MsgId: ${this.messageId} | Code: ${this.code} | Size: ${this.length} | Text: ${this.text}`});
  }
  
  static from(txtMsgRes, begin){
    return new TextSegment(txtMsgRes, begin);
  }
  
  get time            () { return this.#time; }
  get messageId       () { return this.#msgid; }

  /**
   * @descr{Converts buffer to string} 
   **/
  get code   () { return this.#code.toString()}   /// [ 0x32, 0x33 ] -> '23'
  
  /**
   * @descr{Converts buffer to number and translates the ascii encoded value into text length}
   * @see  {Medibus 6.0.0 Text Message Response p.18} 
   **/
  get length () { return this.#length.readUInt8(0) - 0x30; }
  
  /**
   * @descr{Converts buffer containing transmitted text to string}
   **/
  get text   () { return this.#text.toString(); }
  
  /**
   * @descr{0-based index of first byte in incoming buffer}
   **/
  get begin  () { return this.#begin; };
  
  /**
   * @descr{0-based index of first byte after this segment}
   **/
  get end    () { return this.#end;  };

  
  /**
   * @descr{Converts property data to plain Javascript Object}
   **/
  get dataObject () {
    return {
      id: this.messageId,
      time: this.time,
      code: this.code,
      text: this.text
    };
  }
  
}

module.exports = TextSegment;

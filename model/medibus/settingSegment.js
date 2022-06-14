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

class SettingSegment {

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
   * @descr{Buffer} - (Ascii-code) - (3 bytes = Ascii-code)
   **/
  #setting 
  
  #begin  /** @descr{number} - (position of message in buffer. 0-based) */
  
  
  
  /**************************************************************************
   * @param{msg}    - {Message}
   * @param{begin}  - (number: 0-based index of current position in payload)
   * @see  {Medibus Protocol 6.0.0 - Device Setting Responses - p.17}
   **/
  constructor(msg, begin) {
    try{
      
      let buffer = msg.hexPayload;      
      this.#msgid = msg.id;     /// number
      this.#time  = msg.time;   /// Date
      
      if(buffer.length < begin + 6){
        win.def.log({ level: 'error', file: 'SettingSegment', func: 'constructor', message: `MsgId: ${this.messageId} | Begin: ${begin} | Buffer out of bounds.`});
      } else {
        
        /**
         * @descr{First two bytes}  - (Code of text message)
         * @see{Medibus for Primus} - (Text Message - p.34)
         **/
        this.#code = buffer.slice(begin , begin + 2);
        
        /**
         * @descr{Five bytes}       - (Current value of specified parameter)
         **/
        this.#setting = buffer.slice(begin + 2, begin + 7);
        
        win.def.log({ level: 'debug', file: 'SettingSegment', func: 'constructor', message: `MsgId: ${this.messageId} | begin: ${begin} | Code: ${this.code} | Setting: ${this.setting}`});
      }

    } catch (error) {
      win.def.log({ level: 'error', file: 'SettingSegment', func: 'constructor', message: `MsgId: ${this.messageId} | Code: ${this.code} | Setting: ${this.setting}`});
    }
  }
  
  static from(msg, begin){
    return new SettingSegment(msg, begin);
  }
  
  get time            () { return this.#time; }
  get messageId       () { return this.#msgid; }
  get code    () { return this.#code.toString()    } /// [ 0x32, 0x33 ] -> '23'
  
  /**
   * @descr{Converts buffer to string}
   * @usedBy{SettingsMessageResponse} - (/model/medibus/settingsMessageResponse)
   **/
  get setting () { return this.#setting.toString() }  
}

module.exports = SettingSegment;

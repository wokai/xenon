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

//const colors = require('colors');
const AsciiHex = require('./asciiHex');

const win = require('../../logger/logger');
const { parameters } = require('../parameters');
 
class DataSegment {
  
  #msgid
  #time
  #date
  
  #dataCode
  #data
  #parameter
  #description
  
  
  
  constructor(dataResponse, index) {
    
    var p = dataResponse.payload;
    var begin = index * 6;
    
    this.#dataCode = p.slice(begin, begin + 2);   /// Two  bytes data code
    this.#data = p.slice(begin + 2, begin + 6);   /// Four bytes data content
    
    /// Get parameter details from stored Parameter list
    this.#parameter = parameters.get(this.#dataCode.toString());
    
    this.#msgid = dataResponse.id;
    this.#time = dataResponse.time;
    this.#date = dataResponse.date;
    
    
    /// May be required when data-code is unknown
    if(!this.#parameter){
      this.#parameter = {
        code: '0',
        description: '(unknown)',
        sctid : '0',
        unit: '',
        format: '',
        m: '',
        ll: false,
        hl: false
      }
    }
  }
  
  static from(d, i){
    var p = d.payload;
    if(p.length < (i + 1) * 6){
      win.def.log({ level: 'error', file: 'dataSegment', func: 'static from', message: `Out of range error: Array length: ${p.length}, Index: ${i}`});
      return null;
    }
    return new DataSegment(d, i);
  }
  
  get time            () { return this.#time; }
  get date            () { return this.#date; } 
  get messageId       () { return this.#msgid; }
  
  get code            () { return this.#dataCode; }
  get codeString      () { return AsciiHex.hexArrayToString(this.#dataCode); }
  get dataString      () { return AsciiHex.hexArrayToString(this.#data); }
  get value           () { return AsciiHex.hexArrayToString(this.#data).trim(); }
  get description     () { return this.#parameter.description; }
  get unit            () { return this.#parameter.unit; }
  get format          () { return this.#parameter.format; }
  
  get dataObject      () {
    return {
      id: this.messageId,
      date: this.date,
      time: this.time,
      code: this.codeString,
      value: this.value,
      description: this.description,
      unit: this.unit
    };
  }
  
}

module.exports = DataSegment;

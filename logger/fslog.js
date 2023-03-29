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
 
const path    = require('path');
const fs      = require('fs');

const general        = require(path.join(__dirname, '..', 'config', 'general'));
const { dateformat } = require(path.join(__dirname, '..', 'logger', 'dateformat'));


class FsLog {
  
  #stream
  #label
  #separator
  
  /**
   * @param{filename} - (string)
   * @param{label}    - (string)
   * @param{sep}      - (string)
   **/
  constructor(filename=path.join(__dirname, '..', 'logfiles', 'fslog.log'), label='fslog', sep='|') {
    this.#stream = fs.createWriteStream(filename, {flags:'a'});
    this.#label = label;
    this.#separator = sep;
  }
  
  tail = () => { this.#stream.write(`\n`); return this; }
  
  /// //////////////////////////////////////////////////////////////////
  /// Parameter related functions
  /// //////////////////////////////////////////////////////////////////
  /**
   * @param{param} - (parameter) - {id:number, time:String<Date>, code:String(2), text:String}
   **/
  
  writeHead = (param) => {
    this.#stream.write(`${param.id}${this.#separator}${param.code}${this.#separator}${param.text}`);
    return this;
  }
  
  /**
   * @param {tp} - { id:number, time: String<Date> }
   * @output{10|03/29/23 10:03:39}
   **/
  writeTimePoint = (tp) => {
    this.#stream.write(`${this.#separator}${tp.id}${this.#separator}${dateformat(tp.time, general.logger.dateformat)}`);
    return this;
  }
  
  /**
   * @param {t} - { String<Date> }
   * @output{0|03/29/23 10:03:39}
   **/
  writeTime = (t) => {
    this.#stream.write(`${this.#separator}0${this.#separator}${dateformat(t, general.logger.dateformat)}`);
    return this;
  }
  
  /**
   * @param{param} - (parameter) - {id:number, time:String<Date>, code:String(2), text:String}
   * @param{begin} - { id: number, time: String<Date> }
   * @param{end  } - { id: number, time: String<Date> }
   * @descr{Used for logging of expired Text Parameter Episodes}
   **/
  writeParamEpisode = (param, begin, end) => {
    this.writeHead(param).writeTimePoint(begin).writeTimePoint(end).tail();
  }
  
  
  /// //////////////////////////////////////////////////////////////////
  /// Plain model
  /// //////////////////////////////////////////////////////////////////
  head = () => {
    this.#stream.write(`[${this.#label}] ${dateformat(new Date(), general.logger.dateformat)} ${this.#separator} `);
    return this;
  }
  
  write     = (text) => {
    if(Array.isArray(text)){
      text.forEach((element) => { this.#stream.write(`${element}${this.#separator}`); });
    } else {
      this.#stream.write(`${text}${this.#separator}`);
    }
    return this;
  }
  writeLine = (text) => { this.head().write(text).tail(); }
}

class EpisodeLog extends FsLog {
  
  constructor(filename) { super(filename=path.join(__dirname, '..', 'logfiles', 'Episode.log'), 'Episode'); }
  
  /**
   * @param{begin} - { Date | String<Date> }
   * @param{end}   - { Date | String<Date> }
   **/
  writeTimes = (begin, end) => {
    this.writeHead({id: 0, code: '0', text: 'Episode' }).writeTime(begin).writeTime(end).tail();
  }
  
}

/// //////////////////////////////////////////////////////////////////////// ///
/// Export
/// //////////////////////////////////////////////////////////////////////// ///

var fslog = new FsLog();
var epilog = new EpisodeLog();

module.exports = {
  fslog: fslog,
  epilog: epilog
};


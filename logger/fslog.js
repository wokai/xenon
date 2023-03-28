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
  
  /**
   * @param{param} - (parameter) - {id:number, time:String<Date>, code:String(2), text:String}
   **/
  
  writeHead = (param) => {
    this.#stream.write(`${param.id}${this.#separator}${param.code}${this.#separator}${param.text}`);
    return this;
  }
  
  writeTimePoint = (time) => {
    this.#stream.write(``);
    return this;
  }
  
  head = () => {
    this.#stream.write(`[${this.#label}] ${dateformat(new Date(), general.logger.dateformat)} ${this.#separator} `);
    return this;
  }
  
  tail = () => { this.#stream.write(`\n`); return this; }
  
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
  
  writeTimes = (begin, end) => {
    this.writeLine([`${dateformat(begin, general.logger.dateformat)}`, `${dateformat(end, general.logger.dateformat)}`]);
  }
  
  /**
   * @param{param} - (parameter) - {id:number, time:String<Date>, code:String(2), text:String}
   * @param{begin} - { id: number, time: String<Date> }
   * @param{end  } - { id: number, time: String<Date> }
   **/
  
  /// Used for logging of expired Text Parameter Episodes
  writeParamEpisode = (param, begin, end) => {
    this.head().write([param.text, dateformat(begin.time, general.logger.dateformat), dateformat(end.time, general.logger.dateformat)]).tail();
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


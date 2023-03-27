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

const { dateformat } = require(path.join(__dirname, '..', 'logger', 'dateformat'));


class FsLog {
  
  #stream
  #label
  #separator
  
  constructor(filename, label, sep='|') {
    this.#stream = fs.createWriteStream(filename, {flags:'a'});
    this.#label = label;
    this.#separator = sep;
  }
  
  head = () => {
    this.#stream.write(`[${this.#label}] ${dateformat(new Date(), 'dd.mm.yy | HH:mm:ss')} ${this.#separator}`);
  }
  
  tail = () => {
    this.#stream.write(`${this.#separator}\n`);
  }
  
  
  log = (text) => {
    this.head();
    this.#stream.write(`text`)
    this.tail();
  }
  
}

/// //////////////////////////////////////////////////////////////////////// ///
/// Export
/// //////////////////////////////////////////////////////////////////////// ///

var fsLog = new FsLog();

module.exports = {
  fslog: fslog
};


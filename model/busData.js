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

const colors = require('colors');
const path = require('path');
const fs = require('fs');

const General = require(path.join('..', 'config', 'general'));

/// //////////////////////////////////////////////////////////////////////// ///
/// Maintains prepared data items received via RS232 Medibus
/// Containing:
///  - Date and time of message
///  - Medibus code for data item ('06' for Patient Compliance, p.9)
///  - Value ('33.6'), unit ('mL/mbar') and description ('Compliance')
/// //////////////////////////////////////////////////////////////////////// ///

class BusData {
  
  #data
  #fstream
  
  constructor() {
    this.#data = [];
    // This is only a temporary storage
    this.#fstream = fs.createWriteStream(General.content.data.filename, { flags: 'a' });
  }
  
  
  writeToFile = (data) => {
    var sep = General.content.data.separator;
    this.#fstream.write(
      data.id + sep +
      data.date + sep +
      data.time + sep +
      data.code + sep + 
      data.value + sep +
      data.description + sep +
      data.unit + '\n'
    );
  };
  
  /// Current Data
  addCurrentData = (response) => {
    var segments = response.array;
    segments.forEach(s => {
      this.#data.push(s.dataObject);
      // This is only temporary
      this.writeToFile(s.dataObject);
    });
  }
  
  /// DataSegment.dataObject: { id: .., date: .., ...}
  add = (data) => { 
    this.#data.push(data);
    this.writeToFile(data);
  }
  
  get size () { return this.#data.length; }
  
  /// Returns the complete array and clears original.
  get = () => {
    var res = this.#data;
    this.#data = [];
    return res;
  }
}

const busData = new BusData();
module.exports = busData;


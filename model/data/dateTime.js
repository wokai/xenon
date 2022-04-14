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

const path = require('path');
const config = require(path.join(__dirname, '..', '..', 'config', 'general'));

/// //////////////////////////////////////////////////////////////////////// ///
/// Date + Time are sent in response to command 0x28.
/// The returned value is 17 Byte value consisting of 
/// a) 8 Bytes Time: HH:MM:SS
/// b) 9 Bytes Date: DD-MMM-YY
/// The altogether format is:
/// 01234567890123456
/// HH:MM:SSDD-MMM-YY
///
/// Example: 09:11:4806-OKT-21
/// //////////////////////////////////////////////////////////////////////// ///

const monthIndex = Object.freeze(new Map([
  [ 'JAN',  0 ],
  [ 'FEB',  1 ],
  [ 'MAR',  2 ],
  [ 'APR',  3 ],
  [ 'MAI',  4 ],
  [ 'JUN',  5 ],
  [ 'JUL',  6 ],
  [ 'AUG',  7 ],
  [ 'SEP',  8 ],
  [ 'OKT',  9 ],
  [ 'NOV', 10 ],
  [ 'DEZ', 11 ]
]));


class DateTime {
  
  #data
  #loc
  
  constructor() {
    this.#loc  = config.language.locale;
    this.#data = new Date();
  }
  
  /// ////////////////////////////////////////////////////////////////////// ///
  /// Public accessors
  /// ////////////////////////////////////////////////////////////////////// ///
  
  get data () { return this.#data; }
  
  get medium () {
    var fmt =  new Intl.DateTimeFormat(config.language.locale,
      { dateStyle: 'medium',   timeStyle: 'medium'   });
    return fmt.format(this.#data);
  }
  
  get short ()  {
    var fmt =  new Intl.DateTimeFormat(config.language.locale,
      { dateStyle: 'short',   timeStyle: 'short'   });
    return fmt.format(this.#data);
  }
  
  get date () {
    var fmt =  new Intl.DateTimeFormat(config.language.locale, { dateStyle: 'short'});
    return fmt.format(this.#data);
  }
  
  get time () {
    var fmt = new Intl.DateTimeFormat(config.language.locale, { timeStyle: 'medium' });
    return fmt.format(this.#data);
  }
  
  
  /// ////////////////////////////////////////////////////////////////////// ///
  /// Import message data
  /// ////////////////////////////////////////////////////////////////////// ///
  
  /// ////////////////////////////////////////////////////////////////////// ///
  /// Split DateTime-String provided by Medibus reply (09:11:4806-OKT-21)
  /// into appropriate subfields
  /// ////////////////////////////////////////////////////////////////////// ///
  dsplit = (msg) => {
    var md = msg.strPayload;
    return {
      hour : md.substr( 0, 2),
      min  : md.substr( 3, 2),
      sec  : md.substr( 6, 2),
      day  : md.substr( 8, 2),
      mon  : md.substr(11, 3),
      year : md.substr(15, 2)
    }
  }
  
  /// Creates Date object from splitted date 
  extract = (msg) => {
    var d = this.dsplit(msg);
    this.#data = new Date(d.year, monthIndex.get(d.mon), d.day, d.hour, d.min, d.sec);
  }
  
  static from = (msg) => {
    var d = new DateTime();
    d.#data.date = msg.strPayload.substring(8);
    d.#data.time = msg.strPayload.substring(0, 8);
    return d;
  }
}


const dateTime = new DateTime();

module.exports = {
  dateTime : dateTime
};

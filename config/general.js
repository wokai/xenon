'use strict';
/*******************************************************************************
 * The MIT License
 * Copyright 2022, Wolfgang Kaisers
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


const config = {
  language : {
    locale : 'de-DE'
  },
  interface: 'Xenon',
  logger: {
    filename: path.join( __dirname, '..', 'msg_log.txt'),
    level: 'info'     /// { error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6 } 
  },
  content : {
    params : {
      filename: path.join(__dirname, '..', 'medibusParams.json')
    },
    data: {
      filename: path.join(__dirname, '..', 'vitalData.csv'),
      separator: ';'
    }
  },
  empty: {
    time: new Date('2000-01-01T00:00:00.000Z'),
    uuid: '0'
  },
  temporal: {
    highWaterMark: 7200,
    truncation: 3600
  },
  dataRepo: {
    highWaterMark: 7200,
    truncation: 3600
  }
}


module.exports = Object.freeze(config);



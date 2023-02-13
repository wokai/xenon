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

const config = {
  /// Defines preset parameters, loaded into serial-port and client
  /// Path structure reflects list returned by serial-port instance
  preset: { 
    path: '/dev/ttyUSB0',
    baudRate: 9600,
    parity: 'even',
    stopBits: 1, 
    dataBits: 8,
    autoOpen: false
  },
  select : {
    baudRate: [ 1200, 4800, 9600, 19200, 38400, 57600, 115200 ],
    dataBits: [ 5, 6, 7, 8 ],
    parity:   [ 'none', 'odd', 'even', 'space', 'mark' ],
    stopBits: [ 1, 2 ]
  },
  /// Shortcut configrations for use in http client
  devices: [
    {
      name: 'Primus',
      baudRate: 9600, 
      parity: 'even',
      stopBits: 1, 
      dataBits: 8,
      autoOpen: false
    },
    {
      name: 'Evita',
      baudRate: 19200,
      parity: 'none',
      stopBits: 1, 
      dataBits: 8,
      autoOpen: false
    },
    {
      name: 'V300',
      baudRate: 19200,
      parity: 'even',
      stopBits: 1,
      dataBits: 8,
      autoOpen: false
    }
  ]
};


module.exports = Object.freeze(config);



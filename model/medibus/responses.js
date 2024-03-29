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
 
const { Message } = require('./message');


/// //////////////////////////////////////////////////////////////////////// ///
/// Message Responses:
/// Will be sent as reply upon incoming commands
/// //////////////////////////////////////////////////////////////////////// ///

/// devid: See Medibus Protocol definition 6.0 p.55

const icc   = new Message(0x01, 0x51); /// [ 0x01, 0x51, 0x35, 0x32, 0x0d ]
const devid = new Message(0x01, 0x52); /// [ 0x01, 0x52, 0x35, 0x33, 0x0d ]
const nak   = new Message(0x01, 0x15); /// [ 0x01, 0x15, 0x31, 0x36, 0x0d ]
const nop   = new Message(0x01, 0x30); /// [ 0x01, 0x30, 0x33, 0x31, 0x0d ]

module.exports = {
  icc,
  devid,
  nak,
  nop
}

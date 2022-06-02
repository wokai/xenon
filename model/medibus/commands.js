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

/// Commands
const dat1      = new Message(0x1b, 0x24); /// [ 0x1b, 0x24, 0x33, 0x46, 0x0d ]
const alarm_ll  = new Message(0x1b, 0x25); /// [ 0x1b, 0x25, 0x34, 0x30, 0x0d ]
const alarm_hl  = new Message(0x1b, 0x26); /// [ 0x1b, 0x26, 0x34, 0x31, 0x0d ]
const alarm_cp1 = new Message(0x1b, 0x27); /// [ 0x1b, 0x27, 0x34, 0x32, 0x0d ]
const time      = new Message(0x1b, 0x28); /// [ 0x1b, 0x28, 0x34, 0x33, 0x0d ]
const settings  = new Message(0x1b, 0x29); /// [ 0x1b, 0x29, 0x34, 0x34, 0x0d ]
const text      = new Message(0x1b, 0x2a); /// [ 0x1b, 0x2a, 0x34, 0x35, 0x0d ]
const alarm_cp2 = new Message(0x1b, 0x2e); /// [ 0x1b, 0x2e, 0x34, 0x39, 0x0d ]

const nop       = new Message(0x1b, 0x30); /// [ 0x1b, 0x30, 0x34, 0x32, 0x0d ]

const data_conf = new Message(0x1b, 0x4a);
const icc       = new Message(0x1b, 0x51); /// [ 0x1b, 0x51, 0x36, 0x43, 0x0d ]
const devid     = new Message(0x1b, 0x52); /// [ 0x1b, 0x52, 0x36, 0x44, 0x0d ]

const rt_conf   = new Message(0x1b, 0x54); /// [ 0x1b, 0x54, 0x36, 0x46, 0x0d ]
const stop      = new Message(0x1b, 0x55); /// [ 0x1b, 0x55, 0x37, 0x30, 0x0d ]



module.exports = {
  icc,
  devid,
  nop,
  stop,
  dat1,
  text,
  device: {
    id: devid,
    time: time,
    settings: settings
  },
  alarm: {
    ll: alarm_ll,
    hl: alarm_hl,
    cp1: alarm_cp1,
    cp2: alarm_cp2,
  },
  config : {
    data: data_conf,
    realtime : rt_conf
  }
}


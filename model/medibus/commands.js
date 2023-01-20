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


/// ////////////////////////////////////////////////////////////////////
/// Source:
/// 1) Protocol Definition Dräger RS 232 MEDIBUS  6.00
/// 2) Profile Definition MEDIBUS.X               V 1.n
/// ////////////////////////////////////////////////////////////////////

const { Message } = require('./message');

/// Commands
const dat1      = new Message(0x1b, 0x24); /// 1 | Request current measured data (codepage 1)
const alarm_ll  = new Message(0x1b, 0x25); /// 1 | Request current low alarm limits (codepage 1)
const alarm_hl  = new Message(0x1b, 0x26); /// 1 | Request current high alarm Limits (codepage 1)
const alarm_cp1 = new Message(0x1b, 0x27); /// 1 | Request current alarms (codepage 1)
const time      = new Message(0x1b, 0x28); /// 1 | Request current date and time
const settings  = new Message(0x1b, 0x29); /// 1 | Request current device settings
const text      = new Message(0x1b, 0x2a); /// 1 | Request current text messages
const dat2      = new Message(0x1b, 0x2b); /// 2 | Request current measured data (codepage 2)
const alarm_ll2 = new Message(0x1b, 0x2c); /// 2 | Request current low alarm limits (codepage 2)
const alm_hl2   = new Message(0x1b, 0x2d); /// 2 | Request current high alarm Limits (codepage 2)
const alarm_cp2 = new Message(0x1b, 0x2e); /// 1 | Request current alarms (codepage 2)

const nop       = new Message(0x1b, 0x30); /// 1 | No Operation (NOP)

const data_conf = new Message(0x1b, 0x4a); /// 2 | Configure data response command
const tm_chged  = new Message(0x1b, 0x49); /// 2 | Time changed


const icc       = new Message(0x1b, 0x51); /// 1 | Initialize Communication (ICC)
const devid     = new Message(0x1b, 0x52); /// 1 | Request Device Identification
const rtc_req   = new Message(0x1b, 0x53); /// 2 | Request real-time configuration
const rt_conf   = new Message(0x1b, 0x54); /// 1 | Configure real-time transmission
const stop      = new Message(0x1b, 0x55); /// 1 | Stop Communication (STOP)
const rt_con_c  = new Message(0x1b, 0x56); /// 2 | Real-time configuration changed
const inf_conf  = new Message(0x1b, 0x59); /// 2 | Device extension command for infusion pumps


module.exports = {
  icc,
  devid,
  nop,
  stop,
  dat1,
  dat2,
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


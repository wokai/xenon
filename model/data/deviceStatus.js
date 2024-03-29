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
 
const path = require('path'); 

const win     = require(path.join(__dirname, '..', '..', 'logger' , 'logger'));
const bus     = require(path.join(__dirname, '..', '..', 'config' , 'medibus'));
const monitor = require(path.join(__dirname, '..', '..', 'monitor', 'monitor'));
const config  = require(path.join(__dirname, '..', '..', 'config' , 'general'));


/// ////////////////////////////////////////////////////////////////////////////
/// DeviceStatus tracks values or events which occur infrequenly on the
/// device such as Alarms or change of settings
/// 
/// A) Each status item is identified by an ID which must be unique (system wide)
/// B) 
/// ////////////////////////////////////////////////////////////////////////////


/// Abstract base class

class DeviceStatus {
  
  #msgId    /// Medibus message-id
  #time
  #label
  #value
  
  constructor(msgId, time=new Date()) {
    this.#msgId = msgId;
    this.#time  = time;
  }
}


class DeviceStatusPeriod {
  
  static #lastId = 0; /// Counter for creation of (session) unique id's
  #id     /// @ number | Medibus-Message-Id
  #param  /// @ string | Parameter: O2 setting or PEEP
  #label  /// @ string | Text displayed in list or stored in logfile
  #begin  /// @ Date
  #end    /// @ Date
   
  /// There is no type checking
  /// This class mainly exists in order to have defined accessors
  constructor(label, id = DeviceStatusPeriod.#lastId, begin = config.empty.time) {
    this.#label = label;
    ++DeviceStatusPeriod.#lastId;
    this.#id = id;
    this.#begin = begin;
    this.#end = begin;
  }

  set id(i)     { this.#id    = i;    }
  set begin(t)  { this.#begin = t;    }
  set end(t)    { this.#end   = t;    }
  
  get label()   { return this.#label; }
  get id()      { return this.#id;    }
  get begin()   { return this.#begin; }
  get end()     { return this.#end;   }
}


class ExspiredDeviceStatus {
  #periods = [];
  
  get size()  { return this.#periods.length; }
  get array() { return this.#periods.map((a) => (a.dataObject)); };
  
  constructor() {
  }
}

class DeviceStatus {
  #current    /// Current status objects
  
  constructor() {
    this.#current = new Map();
  }
}

const DeviceStatus = new DeviceStatus();

module.exports = {
  DeviceStatus: DeviceStatus
}

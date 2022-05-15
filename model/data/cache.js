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
 
const win             = require('../../logger/logger');
const DataResponse    = require('../medibus/dataResponse');
const { ventilation } = require('./ventilation');
const General         = require('../../config/general');


/// //////////////////////////////////////////////////////////////////////// ///
/// Data Model for Dräger anaesthesia devices
/// //////////////////////////////////////////////////////////////////////// ///


class DataCache {
  
  ///------------------------------------------------------------------------///
  /// Contains Medibus ventilation data:
  ///   - MsgId, time, episode, status
  ///   - Resp-data : compliance, peak, peep, tv, mv, ...
  ///   - Gas-data  : fio2, feco2, ...
  ///   - Inhal-data: mac, Iso, Sevo, Des, ...
  ///------------------------------------------------------------------------///
  #vent
  
  constructor(){ this.#vent = [] }
  get ventObjet ()  { return this.#vent; }
  
  spliceVentData = () => {
    if(this.#vent.length > General.dataRepo.highWaterMark){
      this.#vent.splice(0, General.dataRepo.truncation);
    }
  }

  pushVentData = (vent) => {
    this.spliceVentData();
    this.#vent.push(vent);
  }

  consumeVentData() => {
    let res = this.#vent;
    this.#vent = [];
    return res;
  }
}

const cache = new DataCache()

module.exports = {
  cache : cache
}

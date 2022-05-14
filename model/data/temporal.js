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


class Temporal {
  
  #obj
  
  constructor(){ this.setEmptyObject(); }
  get dataObject ()  { return this.#obj; }
  
  setEmptyObject = () => {
    this.#obj = {
        msgid:        [], /// MessageId
        time:         [], /// [ "12:00:00", "12:00:05", "12:00:10", "12:00:15", "12:00:20"],
        tidalvolume : [], /// [ 458, 465, 485, 456, 466 ],
        minutevolume: [],
        peak:         [],
        fio2:         [],
        feco2:        [],
        o2uptake:     [],
        desflurane:   [],
        isoflurane:   [],
        sevoflurane:  []
      }
  }
  
  spliceObject = () => {
    if(this.#obj.time.length > General.temporal.highWaterMark){
      this.#obj.msgid.splice(0, General.temporal.truncation);
      this.#obj.time.splice(0, General.temporal.truncation);
      this.#obj.tidalvolume.splice(0, General.temporal.truncation);
      this.#obj.minutevolume.splice(0, General.temporal.truncation);
      this.#obj.peak.splice(0, General.temporal.truncation);
      this.#obj.fio2.splice(0, General.temporal.truncation);
      this.#obj.feco2.splice(0, General.temporal.truncation);
      this.#obj.o2uptake.splice(0, General.temporal.truncation);
      this.#obj.desflurane.splice(0, General.temporal.truncation);
      this.#obj.isoflurane.splice(0, General.temporal.truncation);
      this.#obj.sevoflurane.splice(0, General.temporal.truncation);
    }
  }

  addVentData = (obj) => {
    /// Prevent infinite growing of data array:
    this.spliceObject();
    
    this.#obj.msgId.push(obj.msgId);
    this.#obj.time.push(obj.time);
    this.#obj.tidalvolume.push(parseInt(obj.respiration.tidalvolume));
    this.#obj.minutevolume.push(parseFloat(obj.respiration.minutevolume));
    this.#obj.peak.push(parseInt(obj.respiration.peak));
    this.#obj.fio2.push(parseInt(obj.gas.fio2));
    this.#obj.feco2.push(parseInt(obj.gas.feco2));
    this.#obj.o2uptake.push(parseInt(obj.gas.o2uptake));
    this.#obj.desflurane.push(parseFloat(obj.inhalation.desflurane.exp));
    this.#obj.isoflurane.push(parseFloat(obj.inhalation.isoflurane.exp));
    this.#obj.sevoflurane.push(parseFloat(obj.inhalation.sevoflurane.exp));
  }
  
  /// Returns content of data object and clears content
  extractData = () => {
    let res = this.#obj;
    this.setEmptyObject();
    return res;
  }
}

const temporal = new Temporal()

module.exports = {
  temporal : temporal
}

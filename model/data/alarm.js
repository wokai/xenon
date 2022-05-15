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

const win           = require(path.join(__dirname, '..', '..', 'logger', 'logger'));
const medibus       = require(path.join(__dirname, '..', '..', 'config', 'medibus'));
const DataResponse  = require(path.join(__dirname, '..', 'medibus', 'dataResponse'));

 
class AlarmLimits {
  
  #obj
  
  
  /// See: this.extractLowLimits
  setLowLimits = (res) => {
    try {
      /// Time and date set by Medibus message constructor
      this.#obj.date = res.date;
      this.#obj.time = res.time;
      
      this.#obj.ll.resp.pressure        = res.getSegment('05');
      this.#obj.ll.resp.minutevolume    = res.getSegment('B9');
      this.#obj.ll.oxymeter.pulse_rate  = res.getSegment('E1');
      this.#obj.ll.oxymeter.saturation  = res.getSegment('EB');
      this.#obj.ll.o2.fi                = res.getSegment('F0');
      
    } catch(err) {
      win.def.log({ level: 'warn', file: 'alarm', func: 'setDataObject', message:  err.message });
      console.log(this.#obj);
    }
  }
  
  /// See: this.extractHighLimits
  setHighLimits = (res) => {
    try {
      /// Time and date set by Medibus message constructor
      this.#obj.date = res.date;
      this.#obj.time = res.time;
      
      this.#obj.hl.oxymeter.pulse_rate  = res.getSegment('E1');
      
      this.#obj.hl.resp.pressure        = res.getSegment('05');
      this.#obj.hl.resp.minutevolume    = res.getSegment('B9');
      
      this.#obj.hl.inhal.halothane_kPa  = res.getSegment('50');
      this.#obj.hl.inhal.enflurane_kPa  = res.getSegment('52');
      this.#obj.hl.inhal.isoflurane_kPa = res.getSegment('54');
      this.#obj.hl.inhal.desflurane_kPa = res.getSegment('56');
      this.#obj.hl.inhal.sevoflurane_kPa= res.getSegment('58');
      
      this.#obj.hl.inhal.desflurane_pct = res.getSegment('AE');
      this.#obj.hl.inhal.sevoflurane_pct= res.getSegment('B0');
      this.#obj.hl.inhal.halothane_pct  = res.getSegment('F4');
      this.#obj.hl.inhal.enflurane_pct  = res.getSegment('F6');
      this.#obj.hl.inhal.isoflurane_pct = res.getSegment('F8');
      
      this.#obj.hl.co2.fi_pct           = res.getSegment('DA');
      this.#obj.hl.co2.et_pct           = res.getSegment('DB');
      this.#obj.hl.co2.et_kPa           = res.getSegment('E3');
      this.#obj.hl.co2.fi_mmHg          = res.getSegment('E5');
      this.#obj.hl.co2.et_mmHg          = res.getSegment('E6');
      this.#obj.hl.co2.fi_kPa           = res.getSegment('FF');
      
      this.#obj.hl.n2o.fi_pct           = res.getSegment('FB');
 
    } catch(err) {
      win.def.log({ level: 'warn', file: 'alarm', func: 'setDataObject', message:  err.message });
      console.log(this.#obj);
    }
  }
  
  
  setDefaultObject = () => {
    this.#obj = {
      date: '00.00.0000',
      time: '00:00:00',
      
      ll: {
        resp: {
          pressure: '-',
          minutevolume: '-',
        },
        co2: {
          et_pct: '-',
          et_kPa: '-',
          et_mmHg: '-',
        },
        o2: {
          fi: '-'
        },
        inhal: {
          halothane_kPa: '-',
          halothane_pct: '-',
          enflurane_kPa: '-',
          enflurane_pct: '-',
          isoflurane_kPa: '-',
          isoflurane_pct: '-',
          sevoflurane_kPa: '-',
          sevoflurane_pct: '-',
          desflurane_kPa: '-',
          desflurane_pct: '-'
        },
        oxymeter: {
          pulse_rate: '-',
          saturation: '-'
        }
      },
      
      hl: {
        resp: {
          pressure: '-',
          minutevolume: '-',
        },
        n2o: {
          fi_pct: '-'
        },
        co2: {
          et_pct: '-',
          et_kPa: '-',
          et_mmHg: '-',
          fi_pct: '-',
          fi_kPa: '-',
          fi_mmHg: '-'
        },
        o2: {
          fi: '-'
        },
        inhal: {
          halothane_kPa: '-',
          halothane_pct: '-',
          enflurane_kPa: '-',
          enflurane_pct: '-',
          isoflurane_kPa: '-',
          isoflurane_pct: '-',
          sevoflurane_kPa: '-',
          sevoflurane_pct: '-',
          desflurane_kPa: '-',
          desflurane_pct: '-'
        },
        oxymeter: {
          pulse_rate: '-',
          saturation: '-'
        }
      }
    }
  }
  
  
  constructor(){ this.setDefaultObject(); }
  
  get dataObject ()  { return this.#obj; }
  
  extractLowLimits  = (msg) => { this.setLowLimits( new DataResponse(msg)); }
  extractHighLimits = (msg) => { this.setHighLimits(new DataResponse(msg)); }
}

/// //////////////////////////////////////////////////////////////////////// ///
/// Keeps a map with current alarms
/// //////////////////////////////////////////////////////////////////////// ///

class CurrentAlarms {
  
  #cur
  
  constructor() { this.#cur = new Map(); }
  
  setAlarmCp1 = (res) => {
    let alarm;
    medibus.alarm.cp1.keys().forEach((code) => {
      alarm = res. res.getSegment(code);
      if(alarm === null){
        /// Currently not reported
        this.#cur.delete(code);
      } else {
        /// Device reports alarm
        this.#cur.set(code, {
          code: code,
          msg: alarm
        });
      }
    });
  }
  
  extractAlarmCp1 = (msg) => { this.setAlarmCp1( new DataResponse(msg)); }

  getCurrentAlarms = () => {
    return [...this.#cur];
  }

}


const alarmLimits = new AlarmLimits();
const currentAlarms = new CurrentAlarms();


module.exports = { 
  alarmLimits: alarmLimits,
  currentAlarms: currentAlarms
};

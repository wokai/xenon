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

const win                 = require(path.join(__dirname, '..', '..', 'logger', 'logger'));
const bus             = require(path.join(__dirname, '..', '..', 'config', 'medibus'));
const DataResponse        = require(path.join(__dirname, '..', 'medibus', 'dataResponse'));
const AlarmStatusResponse = require(path.join(__dirname, '..', 'medibus', 'alarmStatusResponse'));

 
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
  
  /// Wrapper functions for obtaining data from  
  extractLowLimits  = (msg) => { this.setLowLimits( new DataResponse(msg)); }
  extractHighLimits = (msg) => { this.setHighLimits(new DataResponse(msg)); }
}

/// //////////////////////////////////////////////////////////////////////// ///
/// Keeps a map with current alarms
/// Alarms from codepage 1 and codepage 2 must be separated because the
/// following codes:
///   A3 67 32 35 37 6A A0 AC AD C8 C9 CA
/// are (ambiguously) defined in both codepages.
/// //////////////////////////////////////////////////////////////////////// ///

class ReportedAlarms {
  
  #alarmDefinition
  #alarms
  #exspiredAlarms
  
  static get emptyMsg() {
    return {
      id  : 0,
      time: null,
      msg : ''
    }
  }
  
  
  clear = () => {

    this.#exspiredAlarms.length = 0;

    /// Fill map with codepage 1 alarm definitions
    this.#alarms = new Map();    
    this.#alarmDefinition.forEach(a => {
        this.#alarms.set(a.code, {
          id: a.id,
          code: a.code,
          label: a.label,
          /// First message with alarm
          firstMsg: Object.assign({}, ReportedAlarms.emptyMsg),
          /// Last message in a row with alarm
          lastMsg: Object.assign({}, ReportedAlarms.emptyMsg)
        });
    });
    
    win.def.log({ level: 'info', file: 'model/data/alarm', func: 'ReportedAlarms.clear', message:  `Extracted ${this.#alarms.size} alarm definitions.`});
  }
  
  
  // ToDo: Two constructor arguments for both codepages:
  // alarm definition and list of active alarms
  constructor() {
    this.#alarmDefinition = bus.alarms.cp1;
    this.#exspiredAlarms = []
    this.clear();
  }
  
  /// ---------------------------------------------------------------------- ///
  /// Check for exspired alarms:
  /// - Have been observed in previous message(s)
  /// - Are no more present in current message
  ///
  /// Then:
  /// - Shift dataset to exspiredAlarms
  /// - Clear up record in alarm.cpx Map
  /// ---------------------------------------------------------------------- ///
  checkReportedAlarms(msg){
    for(let [key, value] of this.#alarms){
      
      if(value.lastMsg.id != msg.id){
        
        /// Create exspired-alarm record
        let target = {};
        Object.assign(target, value);
        target.past = {
          id: msg.id,
          time: msg.dateTime
        }
        this.#exspiredAlarms.push(target);
        
        /// Reset alarm record
        value.firstMsg = Object.assign({}, ReportedAlarms.emptyMsg);
        value.lastMsg  = Object.assign({}, ReportedAlarms.emptyMsg);
      }
    }
  }
  
  
  /**
   * @param msg: Message model/medibus/message
   * 
   * @descr 
   *    - Iterates payload segments of Alarm (cp1 and cp2) reply messages
   *    - Updates alarm message segments
   *    - Initiates re-check of all current and exspiring alarms
   */
  extractAlarm = (msg) => { 
    let resp = new AlarmStatusResponse(msg);
    win.def.log({ level: 'info', file: 'model/data/alarm', func: 'extractAlarm', message:  `MsgId: ${msg.id}. Alarm-Resp.length: ${resp.length}`});
    
    
    for(let [key, value] of resp.map){
      let alarm = this.#alarms.get(key);
      if(alarm !== undefined){
        if(alarm.firstMsg.id == 0){
          /// This alarm has been observed for the first time
          alarm.firstMsg.id = msg.id;
          alarm.firstMsg.time = msg.dateTime;
          alarm.firstMsg.msg = value;
        } 
        /// Maybe, this alarm has been present in a previous message
        alarm.lastMsg.id = msg.id;
        alarm.lastMsg.time = msg.dateTime;
        alarm.lastMsg.msg = value;
        console.log(alarm.lastMsg);
        win.def.log({ level: 'info', file: 'alarm', func: 'extractAlarm', message:  `Alarm time ${msg.dateTime} (value: ${value}).`});
        this.checkReportedAlarms(msg);
      } else {
        /// Key for alarm not found ...
        win.def.log({ level: 'warn', file: 'alarm', func: 'extractAlarm', message:  `MsgId: ${msg.id}. AlarmStatusResponse.length: ${resp.length}. AlarmSegment undefined.`});
        console.log(value);
        console.log(`[model/data/alarm] ReportedAlarms.extractAlarm: MsgId: ${msg.id}. AlarmSegment undefined.`)
      }
    }
  }

  getReportedAlarms = () => {
    return [...this.#alarms.values()].filter(alarm => alarm.firstMsg.id != 0);
  }
  
  getExspiredAlarms = () => { return this.#exspiredAlarms; }
  consumeExspiredAlarms = () => {
    const alarms = this.#exspiredAlarms;
    this.#exspiredAlarms.length = 0;
    return alarms;
  }

}

const alarmLimits = new AlarmLimits();
const reportedAlarms = new ReportedAlarms();

module.exports = { 
  alarmLimits: alarmLimits,
  reportedAlarms: reportedAlarms
};

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

const win                 = require(path.join(__dirname, '..', '..', 'logger', 'logger'));
const bus                 = require(path.join(__dirname, '..', '..', 'config', 'medibus'));
const monitor             = require(path.join(__dirname, '..', '..', 'monitor', 'monitor'));
const DataResponse        = require(path.join(__dirname, '..', 'medibus', 'dataResponse'));
const AlarmStatusResponse = require(path.join(__dirname, '..', 'medibus', 'alarmStatusResponse'));



/**
 * @usecBy{router.get('/alarm/limits')} - (/routes/data)
 **/

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

/// //////////////////////////////////////////////////////////////////////// ///
/// RS232 Medibus 6.0.0 | p.15 | Alarm Status Response
///  1 byte  alarm priority: One Byte. Number in the range 1-31 (highest = 31)
///  2 bytes alarm code    : Two byte ASCII HEX
/// 12 bytes alarm phrase  : Character string.
/// //////////////////////////////////////////////////////////////////////// ///

class PeriodPoint {
  
  #id     /// @ number | Medibus-Message-Id
  #time   /// @ Date
   
  /// There is no type checking, because this would mess up the code
  /// This class mainly exists in order to have clean accessors...
  constructor(id = 0, time = new Date('2000-01-01T00:00:00')) {
    this.#id = id;
    this.#time = time;
  }
  
  set id(i)   { this.#id   = i;    }
  set time(t) { this.#time = t;    }
  
  get id()    { return this.#id;   }
  get time()  { return this.#time; }
}


class Alarm {
  
  #id        /// @ number | Content of bus.alarm.cpx -> id
  #priority  /// @ number | range 1-31
  #code      /// @ string | ascii-hex
  #phrase    /// @ string | 12 bytes
  #begin     /// @ PeriodPoint | Message-ID and Time of observation
  #label     /// @ string - Content of bus.alarm.cpx -> label
  
  constructor() {
    this.#priority = 1;
    this.#code     = '';
    this.#phrase   = '';
    
    this.#label    = '';
    
    this.#begin     = new PeriodPoint();
  }
  
  set id(i)       { this.#id       = i; }
  set priority(p) { this.#priority = p; }
  set code(c)     { this.#code     = c; }
  set phrase(p)   { this.#phrase   = p; }
  set label(l)    { this.#label    = l; }
  
  get id()        { return this.#id;        }
  get priority()  { return this.#priority;  }
  get code()      { return this.#code;      }
  get phrase()    { return this.#phrase;    }
  get label()     { return this.#label;     }
  
  get begin()      { return this.#begin;     }
  
  toString() { 
   return `[Alarm] Priority: ${this.#priority} | Code: ${this.#code} | Phrase: ${this.#phrase} | Label: ${this.#label} | Time Id: ${this.#begin.id}. `;
  }
  
}

class AlarmPeriod extends Alarm {
  
             /// @ time: PeriodPoint | first observation
  #back      /// @ PeriodPoint       | last observation
  
  constructor() {
    super();
    this.#back     = new PeriodPoint();
  }
  get back()      { return this.#back;      }
  
  toString() { return `${Alarm.prototype.toString.apply(this)} Back Id: ${this.#back.id}. `; }
  
  /**
   * Data comming from Medibus Alarm Messages
   * @param {alarm} {id:number, date: Date, priority: number, code: string, phrase: string}
   * @param {alarmDefinition} {Map<{id|code|label}>} - (key = alarm.code) - (config/medibus) 
   */
  static from(alarm, alarmDefinition=null){
    let a = new AlarmPeriod();
    a.priority   = alarm.priority;   /// number 1-31
    a.phrase     = alarm.phrase;     /// string
    a.code       = alarm.code        /// string
    
    a.begin.id   = alarm.id;         /// number: Message-id
    a.begin.time = alarm.time;       /// Date: Time of Medibus message creation
    
    a.back.id    = alarm.id;         /// During time of creation, the first observation
    a.back.time  = alarm.time        /// is also the last observation
    
    /// Eventually add data from stored alarm-definitions
    /// This should almost always be present
    if(alarmDefinition !== null){
      let ad = alarmDefinition.get(a.code);
      if(ad !== undefined){
        a.id = ad.id;
        a.label = ad.label;
      }
    }
    
    return a;
  }
  
  get dataObject() {
    return {
      id: this.id,
      label: this.label,
      priority: this.priority,
      code: this.code,
      phrase: this.phrase,
      begin: {
        id: this.begin.id,
        time: this.begin.time.toLocaleTimeString()
      },
      back: {
        id: this.back.id,
        time: this.back.time.toLocaleTimeString()
      }
    };
  } 
}



class ExspiredAlarms {
  
  #periods = [];
  constructor(){}
  
  get size () { return this.#periods.length; }
  getArray() { return this.#periods.map((a) => (a.dataObject)); };
   
  /**
   * @param {alarmPeriod} period
   */
  push(period) {
    this.#periods.push(period);
    /// action: label
    /// Message: 
    
    let p = period.dataObject;
    //console.log(period.dataObject);
    monitor.infoMsg('Alarm', `${p.label} from ${p.begin.time} (id ${p.begin.id}) to ${p.back.time} (id ${p.back.id})`);
    win.def.log({ level: 'info', file: 'alarm', func: 'ExspiredAlarms.push', message:  `Alarm '${p.label}' from ${p.begin.time} (id ${p.begin.id}) to ${p.back.time} (id ${p.back.id})` });
  }
  
  consume = () => {
    let res = this.#periods;
    this.#periods = [];
    return res;
  }  
}


/**
 * @use   {bus/alarm/action.js} alarm object
 */

/// //////////////////////////////////////////////////////////////////////// ///
/// CurrentAlarms
///  - Instance where lists of current are inserted into.
///  - Maintains a list of all current alarms: Must be done in current alarms
///    because only one instance of ExspiredAlarms can exist (for downstream
///    reasons). Thus, alarm code ambiguities must be resolved before 
///    i.e. in CurrentAlarms.
///  - Checks for alarms which have become exspired 
/// //////////////////////////////////////////////////////////////////////// ///


class CurrentAlarms {
  
  #exspired         /// {ExspiredAlarms}
  #definedAlarms    /// {Map<{id|code|label}>} - (key = alarm.code) - (config/medibus) 
  #alarms           /// {Map<AlarmPeriod>}     - (key = alarm.code) - current alarms
  
  setupDefinedAlarms(alarms){
    this.#definedAlarms = new Map();
    alarms.forEach(a => {
      this.#definedAlarms.set(a.code, a); 
    });
  }
  
  get size () { return this.#alarms.size; }
  get definedAlarms () { return this.#definedAlarms; }
  
  /**
   * @param {Map[code, ]} alarms | {ExspiredAlarms} exspired
   */
  constructor(alarms, exspired) {
    this.#exspired = exspired;
    this.setupDefinedAlarms(alarms);
    this.#alarms = new Map();
  }
  
  /**
   * @descr - inserts a single alarm into alarm list
   * @see   {model/medibus} getDataObject
   * @param {Object} - defined by {AlarmSegment.dataObject} (model/medibus/alarmSegment)
   */
  pushAlarm = (alarm) => {
    /// Check whether alarm code is already present in current list
    /// alarmPeriod
    let a = this.#alarms.get(alarm.code);
    if(a !== undefined){
      /// Update time of last observation
      a.back.id = alarm.id;
      a.back.time = alarm.time;
    } else {
      /// Create AlarmPeriod object
      a = AlarmPeriod.from(alarm, this.#definedAlarms);
      this.#alarms.set(a.code, a); 
    }
  }
  
  /**
   * @param {number} - Message-Id - {Medibus} (model/medibus/message)
   **/
  checkExspiration = (id) => {
    this.#alarms.forEach((alarm) => {
      if(alarm.back.id < id){
        this.#exspired.push(alarm);
        this.#alarms.delete(alarm.code);
      }
    });
  }
  
  /**
   * @param  {Message} - (model/medibus/message)
   * @usedBy {Action.constructor} - Callback - (/bus/action)
   * @descr  Calls conversion of Alarm related payload content from Medibus
   *         message into {AlarmStatusResponse} and further into separate
   *         {AlarmPeriod} objects residin in a {Map}.
   *         Finally, {checkExspiration} identifies Alarm types which are no more
   *         current and move to {ExspiredAlarms}.
   **/
  extractAlarm = (msg) => {
    if(msg.hasPayload()){
      let resp = new AlarmStatusResponse(msg);
      resp.map.forEach((as) => {
        
        /// //////////////////////////////////////////////////////////////// ///
        /// Add properties from matching alarm definition
        let ad = this.#definedAlarms.get(as.code);
        if(ad !== undefined){
          let am = as.dataObject;
          am.alarmId = ad.id;
          am.label   = ad.label;
          this.pushAlarm(am);
        }
        /// //////////////////////////////////////////////////////////////// ///
        
        this.pushAlarm(as.dataObject)
      });
    }
    this.checkExspiration(msg.id);
  }
  
  /**
   * @usedBy  {router.get: data/alarm/cp1} - (/routes/data)
   * @usedBy  {Ventilation.getValueObject} - (/model/data/ventilation)
   * @source  {AlarmPeriod.dataObject}
   **/
  getAlarmArray() {
    return Array.from(this.#alarms, ([key, value]) => (value.dataObject));
  }
}

const alarmLimits = new AlarmLimits();
const exspiredAlarms  = new ExspiredAlarms();

/**
 * @descr{Code-page 1 Alarms}
 * @see  {MEDIBUS for Primus. p.14}
 **/
const cp1Alarms = new CurrentAlarms(bus.alarms.cp1, exspiredAlarms);
const cp2Alarms = new CurrentAlarms(bus.alarms.cp2, exspiredAlarms);

module.exports = { 
  exspiredAlarms: exspiredAlarms,
  alarmLimits: alarmLimits,
  cp1Alarms: cp1Alarms,
  cp2Alarms: cp2Alarms
};

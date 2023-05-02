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
const { epilog }          = require(path.join(__dirname, '..', '..', 'logger', 'fslog'));
const bus                 = require(path.join(__dirname, '..', '..', 'config', 'medibus'));
const monitor             = require(path.join(__dirname, '..', '..', 'monitor', 'monitor'));
const config              = require(path.join(__dirname, '..', '..', 'config', 'general'));

const DataResponse        = require(path.join(__dirname, '..', 'medibus', 'dataResponse'));
const AlarmStatusResponse = require(path.join(__dirname, '..', 'medibus', 'alarmStatusResponse'));

const { TimePoint, StateElement, StateCodeMap } = require(path.join(__dirname, 'stateCodeMap'));

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


class Alarm {
  
  #alarmId   /// @ number | Content of bus.alarm.cpx -> id
  #priority  /// @ number | range 1-31
  #code      /// @ string | ascii-hex
  #phrase    /// @ string | 12 bytes
  #begin     /// @ TimePoint | Message-ID and Time of observation
  #label     /// @ string - Content of bus.alarm.cpx -> label
  
  constructor() {
    this.#priority = 1;
    this.#code     = '';
    this.#phrase   = '';
    this.#label    = '';
    this.#begin     = new TimePoint();
  }
  
  set alarmId(i)  { this.#alarmId       = i; }
  set priority(p) { this.#priority = p; }
  set code(c)     { this.#code     = c; }
  set phrase(p)   { this.#phrase   = p; }
  set label(l)    { this.#label    = l; }
  
  get alarmId()   { return this.#alarmId;   }
  get priority()  { return this.#priority;  }
  get code()      { return this.#code;      }
  get phrase()    { return this.#phrase;    }
  get label()     { return this.#label;     }
  get text()      { return this.#label;     }
  
  get begin()     { return this.#begin;     }
  
  toString() { 
    return `[Alarm] Priority: ${this.#priority} | Code: ${this.#code} | Phrase: ${this.#phrase} | Label: ${this.#label} | Time Id: ${this.#begin.id}. `;
  }
  
}

/// Shall replace AlarmPeriod
class AlarmState extends StateElement {
    
  /**
   * code:     string,             src: message
   * priority: number (range 1-31) src: message
   * label:    string,             src: /config/medibus: bus.alarm.cpx
   * phrase:   string (12 bytes),  src: message
   **/
  
  /// @param{code}   - (string)
  /// @param{object} - ({ code: string, priority: string, label: string, phrase: string })
  /// @param{msgId}  - (number) - (alarmStatusResponse)
  /// @param{begin}  - (Date)
  
  constructor(code, object, msgId, begin){
    super(code, object, msgId, time = begin);
  }
  
  set priority(p)   { this.param.priority = p; }
  set phrase(p)     { this.param.phrase   = p; }
  set label(l)      { this.param.label    = l; }
  
  get priority()    { return this.param.priority; }
  get phrase()      { return this.param.phrase;   }
  get label()       { return this.param.label;    }
  
  /**
   * @usedBy{CurrentAlarms.extractAlarm} - ()
   * @param {alarm} - defined by {AlarmSegment.dataObject} (model/medibus/alarmSegment)
   * @param {def}   - (bus.alarms.map.cpx) - (Map: (key: code, value: { code: string, label: string })
   **/
  static from(alarm, def=null){
    
    let label = null;
    if(def) {
      let ad = def.get(alarm.code);
      if(ad !== undefined) {
        label = ad.label;
      }
    }
    
    let obj = {
      code:     alarm.code,
      priority: alarm.priority,
      phrase:   alarm.phrase,   
      label:    label
    }
    return new AlarmState(alarm.code, obj, alarm.msgId, alarm.time);
  }
  
}



class AlarmPeriod extends Alarm {
  
             /// @ time: TimePoint | first observation
  #back      /// @ TimePoint       | last observation
  
  constructor() {
    super();
    this.#back     = new TimePoint();
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
      alarmId: this.alarmId,
      label: this.label,
      priority: this.priority,
      code: this.code,
      text: this.text,    /// @usedBy{/logger/fslog}
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



class ExpiredAlarms {
  
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
    monitor.infoMsg('Alarm', `${p.label} from ${p.begin.time} to ${p.back.time}`);
    win.def.log({ level: 'info', file: 'alarm', func: 'ExpiredAlarms.push', message:  `Alarm '${p.label}' from ${p.begin.time} (id ${p.begin.id}) to ${p.back.time} (id ${p.back.id})` });
    epilog.writeAlarmPeriod(period);
  }
  
  consume = () => {
    let res = this.#periods;
    this.#periods = [];
    return res;
  }  
}


class AlarmCodeMap extends StateCodeMap {
  
  
}


/**
 * @usedBy   {bus/alarm/action.js} alarm object
 */

/// //////////////////////////////////////////////////////////////////////// ///
/// CurrentAlarms
///  - Instance where lists of current are inserted into.
///  - Maintains a list of all current alarms: Must be done in current alarms
///    because only one instance of ExpiredAlarms can exist (for downstream
///    reasons). Thus, alarm code ambiguities must be resolved before 
///    i.e. in CurrentAlarms.
///  - Checks for alarms which have become expired 
/// //////////////////////////////////////////////////////////////////////// ///


class CurrentAlarms {
  
  #expired          /// {ExpiredAlarms}
  #definedAlarms    /// {Map<{ id:number, code:string, label: string }>} - (key = alarm.code) - (config/medibus) 
  #alarms           /// {Map<AlarmPeriod>}     - (key = alarm.code) - current alarms
  
  setupDefinedAlarms(alarms) {
    this.#definedAlarms = new Map();
    alarms.forEach(a => {
      this.#definedAlarms.set(a.code, a); 
    });
  }
  
  get size () { return this.#alarms.size; }
  get definedAlarms () { return this.#definedAlarms; }
  
  /**
   * @param {Map[code, ]} alarms | {ExpiredAlarms} expired
   */
  constructor(alarms, expired) {
    this.#expired = expired;
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
      a.back.id = alarm.msgId;
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
  checkExpiration = (id) => {
    this.#alarms.forEach((alarm) => {
      if(alarm.back.id < id){
        this.#expired.push(alarm);
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
   *         Finally, {checkExpiration} identifies Alarm types which are no more
   *         current and move to {ExpiredAlarms}.
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
    this.checkExpiration(msg.id);
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

const expiredAlarms  = new ExpiredAlarms();

/**
 * @descr{Code-page 1 Alarms}
 * @see  {MEDIBUS for Primus. p.14}
 **/
const cp1Alarms = new CurrentAlarms(bus.alarms.cp1, expiredAlarms);
const cp2Alarms = new CurrentAlarms(bus.alarms.cp2, expiredAlarms);

module.exports = { 
  expiredAlarms: expiredAlarms,
  cp1Alarms: cp1Alarms,
  cp2Alarms: cp2Alarms
};

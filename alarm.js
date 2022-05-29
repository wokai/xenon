'use strict';

const path = require('path');

const bus = require(path.join(__dirname, '.', 'medibus'));


/// //////////////////////////////////////////////////////////////////////// ///
/// Located:
/// See /model/data/alarm.js
///
/// Contains alarms which have been reported for a defined time-span
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
  constructor(id, time){
    this.#id = id;
    this.#time = new Date('2000-01-01T00:00:00');
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
   * @param {id:number, date: Date, priority: number, code: string, phrase: string} 
   */
  static from(alarm){
    let a = new AlarmPeriod();
    a.priority   = alarm.priority;   /// number 1-31
    a.phrase     = alarm.phrase;     /// string
    a.code       = alarm.code        /// string
    
    a.begin.id   = alarm.id;         /// number: Message-id
    a.begin.time = alarm.date;       /// Date: Time of Medibus message creation
    
    a.back.id    = alarm.id;         /// During time of creation, the first observation
    a.back.time  = alarm.date        /// is also the last observation
    return a;
  }
}



class ExspiredAlarms {
  
  #periods = [];

  constructor(){}
   
  /**
   * @param {alarmPeriod} period
   */
  push(period) { this.#periods.push(period); }
  
  consume = () => {
    let res = this.#periods;
    this.#periods = [];
    return res;
  }
  
  /**
   * Add alarm label from bus.alarms, return 
   * and clear alarm list

  consume() {
    let res = this.#periods
      .sort((l,r) => { l.time.msgId > r.time.msgId ? 1 : 0 })
      .map(p => {
        p.label = this.#messages.get(p.code).label;
        return p;
      });
    this.clear();
    return res;
  }
   */  
  
  
  print = () => {
    console.log(`[ExspiredAlarms] Size: ${this.#periods.length}.`)
  }
  
}

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
  #definedAlarms    /// Map with defined alarms (key = alarm.code)
  #alarms           /// Map with AlarmPeriod : current alarms
  
  setupDefinedAlarms(alarms){
    this.#definedAlarms = new Map();
    alarms.forEach(a => {
      this.#definedAlarms.set(a.code, AlarmPeriod.from(a)); 
    });
  }
  
  get size () { return this.#alarms.size; }
  
  get definedAlarms () { return this.#definedAlarms; }
  
  /**
   * @param {Object.array} alarms
   */
  constructor(alarms, exspired) {
    this.#exspired = new ExspiredAlarms(alarms);
    this.setupDefinedAlarms(alarms);
    this.#alarms = new Map();
  }
  
  /**
   * Inserts a single alarm into alarm list.
   * @param{id:number, date: Date, priority: number, code: string, phrase: string} alarm
   * 
   */
  insertAlarm = (alarm) => {
    /// Check whether alarm code is already present in current list
    let a = this.#alarms.get(alarm.code);
    if(a !== undefined){
      /// Update time of last observation
      a.back.id = alarm.id;
      a.back.time = alarm.time;
    } else {
      /// Create AlarmPeriod object
      a = AlarmPeriod.from(alarm);
      this.#alarms.set(a.code, a);
    }
  }
  
  print = () => {
    console.log('[CurrentAlarms]');
    console.log(`DefinedAlarms: ${this.#definedAlarms.size}`);
    console.log(`CurrentAlarms: ${this.#alarms.size}`);
  }
  
}


const ex = new ExspiredAlarms();
const cp1 = new CurrentAlarms(bus.alarms.cp1, ex);


let first = {
   id: 1,
   time : Date.now(),
   code : '08',     /// 08H = Insp Oxygen < low Limit
   phrase : 'Insp O2 low',
   priority: 31
}

let second = {
   id: 2,
   time : Date.now(),
   code : '10',     /// 08H = Insp Oxygen < low Limit
   phrase : 'Airway Pressure > high Limit',
   priority: 31
}


cp1.insertAlarm(first);
first.id = 2;
cp1.insertAlarm(first);

cp1.insertAlarm(second);

cp1.print();
ex.print();






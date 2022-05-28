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
  #time      /// @ PeriodPoint | Message-ID and Time of observation
  #label   /// @ string - Content of bus.alarm.cpx -> label
  
  constructor() {
    this.#priority = 1;
    this.#code     = '';
    this.#phrase   = '';
    this.#label  = '';
    this.#time    = new PeriodPoint();
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
  
  get time()      { return this.#time;     }
  
  toString() { 
   return `[Alarm] Priority: ${this.#priority} | Code: ${this.#code} | Phrase: ${this.#phrase} | Label: ${this.#label} | Time Id: ${this.#time.id}. `;
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
   * @param {id:number, code: string, label: string} obj - from bus.alarms.cpx
   */
  static from(obj){
    let a = new AlarmPeriod();
    a.id    = obj.id;
    a.code  = obj.code;
    a.label = obj.label;
    return a;
  }
}



class ExspiredAlarms {
  
  #periods = [];
  #messages;
  
  /**
   * @param {Object[]} msg - source: bus.alarms.cp1 or .cp2
   */
  constructor(msg){
    this.#messages = new Map(msg.map(m => [m.code, m]));
  }
  
  clear = () => { this.#periods = []; }
  
  /**
   * @param {alarmPeriod} period
   */
  push(period) { this.#periods.push(period); }
  
  
  /**
   * Add alarm label from bus.alarms, return 
   * and clear alarm list
   */
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
  
  
  
}


class CurrentAlarms {
  
  #exspired
  #alarms
  
  setupAlarms(alarms){
    this.#alarms = new Map();
    alarms.forEach(a => {
      this.#alarms.set(a.code, AlarmPeriod.from(a)); 
    });
  }
  
  get size () { return this.#alarms.size; }
  
  /**
   * @param {ExspiredAlarms} ex
   */
  constructor(alarms) {
    this.#exspired = new ExspiredAlarms(alarms); 
    this.setupAlarms(alarms);
  }
  
  /**
   * @param{[]
   */
  
  set(alarm) {
    
  }
  
}

/**
 * 
 * {
      id: this.messageId,
      date: this.date,
      time: this.time,
      priority: this.priority,
      code: this.code,
      phrase: this.value
    };
 * 
 * 


const ex = new ExspiredAlarms(bus.alarms.cp1);
const cp1 = new CurrentAlarms(bus.alarms.cp1);

const al = new AlarmPeriod();


al.priority = 31;
al.code     = '08'        /// 08H = Insp Oxygen < low Limit
al.phrase   = 'Insp O2 low ';
al.time.id  = 1;
al.time.time  = new Date();
al.back.id  = 2;

ex.push(al);

console.log(`${al}`);

ex.consume().forEach(a => { console.log(`${a}`); });

console.log(cp1.size);


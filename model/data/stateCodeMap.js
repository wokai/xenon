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
 
const path    = require('path'); 

const win     = require(path.join(__dirname, '..', '..', 'logger', 'logger'));
const bus     = require(path.join(__dirname, '..', '..', 'config', 'medibus'));
const config  = require(path.join(__dirname, '..', '..', 'config', 'general'));

/// ////////////////////////////////////////////////////////////////////
/// TimePoint carries information about when this interface received
/// a message, identified by two parameters:
/// - Medibus-Message-Id
/// - Time (for example creation-time of Medibus-Message object)
/// ////////////////////////////////////////////////////////////////////

class TimePoint {
  #msgId     /// @ number | Medibus-Message-Id
  #time   /// @ Date
   
  /// There is no type checking, because it would mess up the code
  /// This class mainly exists in order to have clean accessors...
  constructor(msgId = 0, time = config.empty.time) {
    this.#msgId = msgId;
    this.#time = time;
  }
  
  set msgId(i) { this.#msgId   = i;  }
  set time(t)  { this.#time = t;     }
  
  get msgId()  { return this.#msgId; }
  get time()   { return this.#time;  }
}

/// ////////////////////////////////////////////////////////////////////
/// StateElement
/// Stores a Parameter-Type + 2 time points:
///
/// The structure of the parameter object is not further constrained
/// here because it may vary depending on data-types.
///
/// The ID and time of the first observation containing the parameter
/// and
/// the ID and time of the first observation without the parameter
/// ////////////////////////////////////////////////////////////////////

class StateElement {
  
  static #lastId = 0;     /// Counter for creation of (session) unique state id's
  
  #id     /// @type{Number}    - (State-Id; application unique)
  #code   /// @type{String}    - (Medibus-code of Parameter) -  @seeAlso{/config/medibus.text.messages)
  #param  /// @type{object}    - (Object containing parameter data)
  #begin  /// @type{TimePoint} - (First Medibus message with parameter)
  #last   /// @type{TimePoint} - (Last  Medibus message with parameter)
  #back   /// @type{TimePoint} - (First Medibus message without parameter)
  
  
  /// //////////////////////////////////////////////////////////////////////////
  /// This shall be overrided by subclasses
  /// The intention is, that the depicted text appears in status messages
  /// which are logged upon expiration 
  /// //////////////////////////////////////////////////////////////////////////
  getText = () => { return ''; }
  
  /**
   * @param{code}     - {Medibus-code}
   * @object{object}  - {Parameter data}
   * @id{number}      - {Medibus message id}
   **/
  
  constructor(code, object, msgId, time = config.empty.time) {
    
    this.#id = ++StateElement.#lastId;
    
    this.#code  = code;
    this.#param = object;
    this.#begin = new TimePoint(msgId, time);
    this.#last  = new TimePoint(msgId, time);
    this.#back   = new TimePoint();
  }
    
  get id    () { return this.#id;        }
  get code  () { return this.#code;      }
  get text  () { return this.getText();  }
  get param () { return this.#param;     }
  get begin () { return this.#begin;     }
  get last  () { return this.#last;      }
  get back  () { return this.#back;      }
  
  /**
   * @usedBy {StateCodeMap.current | .expireElements | .expireAll}
   **/
  
  get dataObject () {
    return {
      code:  this.#code,
      param: this.#param,
      begin: {
        msgId:   this.#begin.msgId,
        time: this.#begin.time
      },
      last: {
        msgId:   this.#last.msgId,
        time: this.#last.time
      },
      back: {
        msgId:   this.#back.msgId,
        time: this.#back.time
      }
    };
  }
  
  /**
   * @param {t}-{TimePoint}
   **/
  set last  (t) { this.#last = t;     }
  set back  (t) { this.#back = t;     }
  
  /**
   * @descr {Terminates duration period of observed parameter}
   * @param {msgId}   - {number}
   * @param {time} - {Date}
   **/
  stop =    (msgId, time) => { this.back = new TimePoint(msgId, time); }
} 


/// ////////////////////////////////////////////////////////////////////
/// Wrapper around a map of generic state indicators
/// Map-keys for states are codes defined in Medibus standard e.g.
///  - Medibus for Primnus           - (p.34)
///  - Medibux.X Profile Definition  - (p.109 - 127)
/// ////////////////////////////////////////////////////////////////////

class StateCodeMap {

  #map      /// @type{Map<string, StateElement>}  - {current settings = under observation}
  #expired  /// @type{array<StateElement>}        - {expired StateElement objects}
  
  constructor() {
    this.#map = new Map();
    this.#expired = [];
  }

  /**
   * @usedBy{/routes/data} - (/text/current) via (/data/text)
   **/  
  get current () {
    return Array.from(this.#map.values()).map(r => r.dataObject);
  }
  get expired () { return this.#expired; }
  
  /// ////////////////////////////////////////////////////////////// ///
  /// Insert new StateElement
  /// ////////////////////////////////////////////////////////////// ///
  
  /**
   * @param{p}  - {StateElement}
   **/
  upsertElement = (p) => {
    /// 1) Check for existing Object with appropriate code
    let elem = this.#map.get(p.code);
    if(elem !== undefined) {
      /// 3) If exists: Update end of StateElement
      elem.last = p.begin;
    } else {
      /// 2) If not: Insert StateElement
      this.#map.set(p.code, p);  
    }
  }
  
  /// ////////////////////////////////////////////////////////////// ///
  /// Checks all map entries and expires outdated elements based on 
  /// Medibus-Message-id:
  /// a) Back value is set
  /// b) StateElement is shifted from Map to exspired
  /// ////////////////////////////////////////////////////////////// ///
  
  /**
   * @param{dataObj} - (See StateElement.dataObject)
   * @useCase{Empty template to be overloaded in derived classes}
   **/
  logExpiredState = (dataObj) => {}
  
  /**
   * @param{tp}                - (TimePoint)
   * @usedBy{/model/data/text} - (TextParamMap.processTextMsg)
   **/
  expireElements = (tp) => {
    this.#map.forEach((value, key, map) => {
      if(value.last.msgId != tp.msgId){
        value.back = tp;
        win.status.log({ level: 'info', code: value.code, text: value.text, begin: value.begin, end: value.back });
        this.#expired.push(value.dataObject);
        this.logExpiredState(value.dataObject);
        map.delete(key);
      }
    });
  }
  
  /**
   * @descr {Expires all current elements}
   * @usedBy{Closing the Medibus communication} - (Shutdown)
   **/
  expireAll = () => {
    let l = this.#map.length;
    let tp = new TimePoint(0, new Date());
    this.#map.forEach((value, key, map) => {
      value.back = tp;
      win.status.log({ level: 'info', code: value.code, text: value.text, begin: value.begin, end: value.back });
      this.#expired.push(value.dataObject);
      this.logExpiredState(value.dataObject);
      map.delete(key);
    });
    win.def.log({ level: 'info', file: 'StateCodeMap', func: 'expireAll', message: `Expiring ${l} parameters` });
  }
}


/**
 * @descr{}
 * @see  {}
 **/

module.exports = {
  TimePoint,
  StateElement,
  StateCodeMap
};

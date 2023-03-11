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

const general             = require(path.join(__dirname, '..', '..', 'config',  'general'));
const win                 = require(path.join(__dirname, '..', '..', 'logger', 'logger'));
const bus                 = require(path.join(__dirname, '..', '..', 'config', 'medibus'));
const config              = require(path.join(__dirname, '..', '..', 'config', 'general'));

/// ////////////////////////////////////////////////////////////////////
/// TimePoint carries information about when this interface received
/// a message, identified by two parameters:
/// - Medibus-Message-Id
/// - Time (for example creation-time of Medibus-Message object)
/// ////////////////////////////////////////////////////////////////////

class TimePoint {
  #id     /// @ number | Medibus-Message-Id
  #time   /// @ Date
   
  /// There is no type checking, because it would mess up the code
  /// This class mainly exists in order to have clean accessors...
  constructor(id = 0, time = config.empty.time) {
    this.#id = id;
    this.#time = time;
  }
  
  set id(i)   { this.#id   = i;    }
  set time(t) { this.#time = t;    }
  
  get id()    { return this.#id;   }
  get time()  { return this.#time; }
}

/// ////////////////////////////////////////////////////////////////////
/// ParameterElement
/// Stores a Parameter-Type + 2 time points:
///
/// The structure of the parameter object is not further constrained
/// here because it may vary depending on data-types.
///
/// The ID and time of the first observation containing the parameter
/// and
/// the ID and time of the first observation without the parameter
/// ////////////////////////////////////////////////////////////////////

class ParameterElement {
  
  #code   /// @number     | Medibus-code of Parameter
  #param  /// @object     | Object containing parameter data
  #begin  /// @TimePoint  | First Medibus message with parameter
  #last   /// @TimePoint  | Last  Medibus message with parameter
  #back   /// @TimePoint  | First Medibus message without parameter
  
  
  /**
   * @param{code}     - {Medibus-code}
   * @object{object}  - {Parameter data}
   * @id{number}      - {Medibus message id}
   **/
  
  constructor(code, object, id, time = config.empty.time) {
    this.#code  = code;
    this.#param = object;
    this.#begin = new TimePoint(id, time);
    this.#end   = new TimePoint();
  }
    
  get code  ()  { return this.#code;  }
  get param ()  { return this.#param; }
  get begin ()  { return this.#begin; }
  get last  ()  { return this.#last;  }
  get back  ()  { return this.#back;  }
  
  /**
   * @param {t}-{TimePoint}
   **/
  set last  (t) { this.#last = t;     }
  set back  (t) { this.#back = t;     }
  
  /**
   * @descr {Terminates duration period of observed parameter}
   * @param {id}   - {number}
   * @param {time} - {Date}
   **/
  stop      (id, time) => { this.back = new TimePoint(id, time); }
  
} 


/// ////////////////////////////////////////////////////////////////////
///
/// ////////////////////////////////////////////////////////////////////

class ParameterMap {

  #map    /// @type{Map<string, ParameterElement>}  - {current settings = under observation}
  #expir  /// @type{array<ParameterElement>}        - {expired ParameterElement objects}
  
  constructor() {
    this.#map = new Map();
    this.#expir = [];
  }
  
  /// ////////////////////////////////////////////////////////////// ///
  /// Insert new ParameterElement
  /// ////////////////////////////////////////////////////////////// ///
  
  /**
   * @param{p}  - {ParameterElement}
   **/
  upsertElement = (p) => {
    /// 1) Check for existing Object with appropriate code
    let elem = this.#map.get(p.code);
    if(elem !== undefined) {
      /// 3) If exists: Update end of ParameterElement
      elem.last = p.begin;
    } else {
      /// 2) If not: Insert ParameterElement
      this.#map.set(p.code, p);  
    }
  }
  
  /// ////////////////////////////////////////////////////////////// ///
  /// Checks all map entries and expires outdated elements based on 
  /// Medibus-Message-id:
  /// a) Back value is set
  /// b) ParameterElement is shifted from Map to exspired
  /// ////////////////////////////////////////////////////////////// ///
  
  /**
   * @param{tp} - {TimePoint}
   **/
  
  expireElements = (tp) => {
    this.#map.forEach((value, key, map) => {
      if(value.last.id != tp.id){
        value.back = tp;
        this.#expir.push(value);
        map.delete(key);
      }
    });
  }
  
  /// ////////////////////////////////////////////////////////////// ///
  /// Empty Object will be set in each message cycle
  /// ////////////////////////////////////////////////////////////// ///
  setEmptyParamObject = () => {
   this.#param = {};
   Object.assign(this.#param, TextData.#emptyParam);
  }
  
  /// ////////////////////////////////////////////////////////////// ///
  /// Second step for creation of parameter object:
  /// Check for existence of parameter in current text message list
  /// and eventually copy value into this.#param object
  /// ////////////////////////////////////////////////////////////// ///
  getParam = (key, empty) => {
   let v = this.#map.get(key);
   if(v !== undefined){
       return v;
   } else {
    return empty;
   }
  }
}


/**
 * @descr{}
 * @see  {}
 **/

module.exports = {
  TimePoint,
  ParameterElement,
  ParameterMap
};

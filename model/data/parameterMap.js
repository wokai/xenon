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

const general       	    = require(path.join(__dirname, '..', '..', 'config',  'general'));
const win                 = require(path.join(__dirname, '..', '..', 'logger', 'logger'));
const bus                 = require(path.join(__dirname, '..', '..', 'config', 'medibus'));
const config              = require(path.join(__dirname, '..', '..', 'config', 'general'));

/// ////////////////////////////////////////////////////////////////////
/// TimePoint includes the Medibus-Message-Id
/// for debug purposes
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
///
/// ////////////////////////////////////////////////////////////////////

class ParameterElement {
  
  #code   /// @number     | Medibus-code of Parameter
  #param  /// @object     | Object containing parameter data
  #begin  /// @TimePoint  | First Medibus message with parameter
  #back   /// @TimePoint  | First Medibus message without parameter
  
} 


/// ////////////////////////////////////////////////////////////////////
///
/// ////////////////////////////////////////////////////////////////////

class ParameterMap {


  #resp   /// @type{TextMessageResponse}
  #map    /// @type{Map}    {current settings = under observation}
  #expir  /// @type{array}  {expired settings }
  
  /// ////////////////////////////////////////////////////////////////////// ///
  /// Empty Object will be set in each message cycle
  /// ////////////////////////////////////////////////////////////////////// ///
  setEmptyParamObject = () => {
   this.#param = {};
   Object.assign(this.#param, TextData.#emptyParam);
  }
  
  /// ////////////////////////////////////////////////////////////////////// ///
  /// Second step for creation of parameter object:
  /// Check for existence of parameter in current text message list
  /// and eventually copy value into this.#param object
  /// ////////////////////////////////////////////////////////////////////// ///
  getParam = (key, empty) => {
   let v = this.#map.get(key);
   if(v !== undefined){
       return v;
   } else {
    return empty;
   }
  }

  /**
   * @usedBy{this.updateParamObject}
   */
  fillEmptyParamObject = () => {
    try{
      if(this.#map !== null){
 
        
        /// ////////////////////////////////////////////////////////// ///
      }
    } catch (error) {
      win.def.log({ level: 'warn', file: 'text', func: 'fillEmptyParamObject', message: error.message });
      console.log('[Text.fillEmptyParamObject]')
      console.log(error);
    }
  }
  
  /// ////////////////////////////////////////////////////////////////////// ///
  /// Preparation for reading text message data into a status object:
  /// Copy data into a Map which uses 
  /// parameter definition @see{bus.medibus.text.parameters} - (/config/medibus)
  /// as Key
  /// ////////////////////////////////////////////////////////////////////// ///
  createParameterMap = () => {
    if(this.#resp !== null){
      this.#map = new Map();
      
      /// TextMessageResponse
      this.#resp.map.forEach((t) => {
        let def = bus.text.messages.get(t.code);
        
        if(def === undefined){
          win.def.log({ level: 'warn', file: 'text', func: 'createParameterMap', message: `Received unknown code ${t.code}` });
          console.log(`[model/data/text] createParameterMap: Received unknown code ${t.code}`);
          console.log(t);
        } else {
          /// //////////////////////////////////////////////////////////////// ///
          /// Store Text messages in parametrised format. Map:
          /// key   : Definition parameter (e.g. ventmode)
          /// value : Object containing parameter definition + text message
          /// //////////////////////////////////////////////////////////////// ///
          this.#map.set(def.param, {
            code: t.code,
            text: t.text,
            value: def.value,
            def: def.text       /// Parameter definition tes
          })
        }
      });
    }
  }
  
  updateParamObject = () => {
    this.setEmptyParamObject();
    if(this.#resp !== null) {
	  this.#param.msgId = this.#resp.id;
	  this.#param.time  = this.#resp.time;
      this.createParameterMap();
      episode.setText(this);
    }
  }
  
  /// ////////////////////////////////////////////////////////////// ///
  /// Convenience getter for selected parameters
  /// ////////////////////////////////////////////////////////////// ///
  get id      () { return this.#param.msgId;    }  /// Number
  get time    () { return this.#param.time;     }  /// Date
  
  get standby () { return {
	  msgId: this.#param.msgId,
	  time : this.#param.time,
	  value: this.#param.standby.value  
    }
  }
  
  get ventmode() { return {
      msgId: this.#param.msgId,
      time:  this.#param.time,
      code:  parseInt(this.#param.ventmode.code),
      text:  this.#param.ventmode.text
    }
  }
  
  constructor() {
    this.#resp = null;
    this.#map = new Map();
    this.setEmptyParamObject();
  }
  
  // ToDo: Check what has to be done when an empty text message 
  // has been received
  /**
   * @usedBy{text} - (/bus/action)
   * @param{msg}   - (Message)
   **/
  extractTextMessages = (msg) => {
    if(msg.hasPayload){
      this.#resp = new TextMessageResponse(msg);
      this.updateParamObject();
    }
  }
  
  /**
   * @usedBy{router.get(/text)} - (/routes/data)
   **/
  get dataObject () {
    if(this.#resp === null){
      return { resp: null }
    } else {
      return this.#resp.dataObject.map((r) =>  {
        /// Add parameter definition from configuration
        r.def = bus.text.messages.get(r.code);
        return r; 
      });
    }
  }
  
  get paramObject () { 
    return this.#param;
  }
}

const text = new TextData();

/**
 * @descr{}
 * @see  {}
 **/

module.exports = { 
  text: text
};

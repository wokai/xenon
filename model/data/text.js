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
const { episode }         = require(path.join(__dirname, 'episode'));
const param               = require(path.join(__dirname, 'parameterMap'));
const TextMessageResponse = require(path.join(__dirname, '..', 'medibus', 'textMessageResponse'));


class TextData {

  static #emptyParam = {
    msgId: 0,
    time: general.empty.time,
    language: '',
    co2unit: '',
    agentunit: '',
    hlm:      { value: 'No' },
    standby:  { value: 'No' },
    leaktest: { value: 'No' },
    inhal: '',
    secInhal: '',
    carrier: '',
    ventmode: '',
    sync:   { text: 'No' },
    psvadd: { text: 'No' },
    autoflow: 'False',
    airway: '(empty)'
   };

  #resp   /// @type{TextMessageResponse}
  #map    /// @type{Map}
  #param  /// @type{Object}
  
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

        let empty = TextData.#emptyParam; 
        
        /// ////////////////////////////////////////////////////////// ///     
        let device = bus.text.parameters.device;
        
        this.#param.language 	= this.getParam(device.language,  empty.language);
        this.#param.co2unit  	= this.getParam(device.co2unit,   empty.co2unit);
        this.#param.agentunit = this.getParam(device.agentunit, empty.agentunit);
        this.#param.hlm 		  = this.getParam(device.hlm,       empty.hlm);
        this.#param.standby 	= this.getParam(device.standby,   empty.standby);
        this.#param.leaktest 	= this.getParam(device.leaktest,  empty.leaktest);
      
        /// ////////////////////////////////////////////////////////// ///
        let vent = bus.text.parameters.ventilation;
       
        this.#param.inhal     = this.getParam(vent.inhal,       empty.inhal);
        this.#param.secInhal  = this.getParam(vent.secInhal,    empty.secInhal);
        this.#param.carrier   = this.getParam(vent.carrier,     empty.carrier);
        this.#param.ventmode  = this.getParam(vent.ventmode,    empty.ventmode);
        this.#param.sync      = this.getParam(vent.sync,        empty.sync);
        this.#param.psvadd    = this.getParam(vent.psvadd,      empty.psvadd);
        this.#param.autoflow  = this.getParam(vent.autoflow,    empty.autoflow);
        
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
    /// AND will be evaluated from left to right and returns immediately 
    /// upon the first falsy operand
    if(this.#resp !== null && this.#resp.length > 0) {
    this.#param.msgId = this.#resp.id;
    this.#param.time  = this.#resp.time;
      this.createParameterMap();
      this.fillEmptyParamObject();
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
  
  /**
   * @usedBy{text} - (/bus/action)
   * @param {msg}   - (Message)
   * @rem   {
   *     Empty message should result in TexMessageResponse.length = 0.
   *     In this case, updateParamObject will only set #param to #emptyParam
   *    }
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

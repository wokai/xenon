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
const bus                 = require(path.join(__dirname, '..', '..', 'config', 'medibus'));
const TextMessageResponse = require(path.join(__dirname, '..', 'medibus', 'textMessageResponse'));

class TextData {
  
  #resp   /// @type{TextMessageResponse}
  #map    /// @type{Map}
  #param  /// @type{Object}
  
  // //////////////////////////////////////////////////////////////////////// //
  // ToDo: This section is still experimental:
  // Evaluation required for asessment which text segments
  // occur simultaneously -> must be stored in different parameter segments
  // //////////////////////////////////////////////////////////////////////// //
  
  /// ////////////////////////////////////////////////////////////////////// ///
  /// Empty Object will be set in each message cycle
  /// ////////////////////////////////////////////////////////////////////// ///
  
  setEmptyParamObject = () => {
    this.#param = {
      device : {
        language: '',
        co2unit: '',
        agentunit: '',
        hlm:      { value: 'No' },
        standby:  { value: 'No' },
        leaktest: { value: 'Yes' }
      },
      ventilation: {
        inhal: '',
        secInhal: '',
        carrier: '',
        ventmode: '',
        sync:   { text: 'No' },
        psvadd: { text: 'No' },
        autoflow: 'False'
      }
    };
  }
  
  /// ////////////////////////////////////////////////////////////////////// ///
  /// Second step for creation of parameter object:
  /// Check for existence of parameter in current text message list
  /// and eventually copy value into this.#param object
  /// ////////////////////////////////////////////////////////////////////// ///
  
  fillEmptyParamObject = () => {
    if(this.#map !== null){
      let v;
      
      /// Device
      v = this.#map.get(bus.text.parameters.device.language)
      if(v !== undefined){ this.#param.device.language = v; }
      
      v = this.#map.get(bus.text.parameters.device.co2unit)
      if(v !== undefined) { this.#param.device.co2unit = v; }
      
      v = this.#map.get(bus.text.parameters.device.agentunit)
      if(v !== undefined) { this.#param.device.agentunit = v;}
      
      v = this.#map.get(bus.text.parameters.device.hlm)
      if(v !== undefined) { this.#param.device.hlm = v;}
      
      v = this.#map.get(bus.text.parameters.device.standby)
      if(v !== undefined) { this.#param.device.standby = v; }
      
      v = this.#map.get(bus.text.parameters.device.leaktest)
      if(v !== undefined) { this.#param.device.leaktest = v;}
      
      /// Ventilation
      v = this.#map.get(bus.text.parameters.ventilation.inhal)
      if(v !== undefined) { this.#param.ventilation.inhal = v;}
      
      v = this.#map.get(bus.text.parameters.ventilation.secInhal)
      if(v !== undefined) { this.#param.ventilation.secInhal = v;}
      
      v = this.#map.get(bus.text.parameters.ventilation.carrier)
      if(v !== undefined) { this.#param.ventilation.carrier = v;}
      
      v = this.#map.get(bus.text.parameters.ventilation.ventmode)
      if(v !== undefined) { this.#param.ventilation.ventmode = v;}
      
      v = this.#map.get(bus.text.parameters.ventilation.sync)
      if(v !== undefined) { this.#param.ventilation.sync = v;}
      
      v = this.#map.get(bus.text.parameters.ventilation.psvadd)
      if(v !== undefined) { this.#param.ventilation.psvadd = v;}

      v = this.#map.get(bus.text.parameters.ventilation.autoflow)
      if(v !== undefined) { this.#param.ventilation.autoflow = v;}
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
      this.#resp.map.forEach((t) => {
        let def = bus.text.messages.get(t.code);
        
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
      });
    }
  }
  
  updateParamObject = () => {
    this.setEmptyParamObject();
    if(this.#resp !== null) {
      this.createParameterMap();
      this.fillEmptyParamObject();
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

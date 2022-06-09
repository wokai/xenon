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
  
  setEmptyParamObject = () => {
    this.#param = {
      device : {
        language: '',
        co2unit: '',
        agentunit: '',
        hlm: 'False',
        devmode: '',
        leaktest: 'False'
      },
      ventilation: {
        inhal: '',
        secInhal: '',
        carrier: '',
        ventmode: '',
        autoflow: 'False'
      }
    };
  }
  
  fillEmptyParamObject = () => {
    if(this.#param !== null){
      let v;
      v = this.#param.get(bus.text.parameters.device.language))
      if(v !== undefined){ this.#param.device.language = v; }
      
      v = this.#param.get(bus.text.parameters.device.co2unit))
      if(v !== undefined) { this.#param.device.co2unit = v; }
    }
  }
  
  createParameterMap = () => {
    if(this.#resp === null){
      this.#param = null;
    } else {
      this.#param = new Map();
      this.#resp.map.forEach((t) => {
        let def = bus.text.messages.get(t.code);
        
        /// //////////////////////////////////////////////////////////////// ///
        /// Store Text messages in parametrised format. Map:
        /// key   : Definition parameter (e.g. ventmode)
        /// value : Object containing parameter definition + text message
        /// //////////////////////////////////////////////////////////////// ///
        this.#param.set(def.param, {
          code: t.code,
          text: t.text,
          value: def.value,
          def: def.text       /// Parameter definition tes
        })
      });
    }
  }
  
  updateParamObject = () => {
    if(this.#resp === null) {
      this.setEmptyParamObject();
    } else {
      let m = this.#resp.map;
    }
  }
  
  constructor() {
    this.#resp = null;
    this.#param = null;
    this.#map = new Map();
  }
  
  extractTextMessages = (msg) => {
    if(msg.hasPayload){
      this.#resp = new TextMessageResponse(msg);
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
}


const text = new TextData();

/**
 * @descr{}
 * @see  {}
 **/

module.exports = { 
  text: text
};

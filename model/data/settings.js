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
const SettingsMessageResponse = require(path.join(__dirname, '..', 'medibus', 'settingsMessageResponse' ));


class DeviceSettings {
  
  #resp   /// @type{TextMessageResponse}
  #map    /// @type{Map}
  #param  /// @type{Object}
  
  getEmptyParamSet = () => {
    return  {
        o2 : 0,
        tidalvolume: 0,
        insptime: 0,
        frequency: 0,
        peep: 0,
        psp: 0,
        pmax: 0,
        flowtrigger: 0,
        slopetime: 0,
        freshgas: 0,
        minfreq: 0,
        pinsp: 0,
        age: 0,
        weight: 0
      };
  }

  
  constructor() {
    this.#resp = null;
    this.#map = new Map();
    this.#param = this.getEmptyParamSet();
  }
  
  /**
   * @usedBy{settings} - (/bus/action)
   **/
  extractSettings = (msg) => {
    if(msg.hasPayload){
      this.#resp = new SettingsMessageResponse(msg);
      //this.updateParamObject();
    }
  }


  /**
   * @usedBy{router.get(/text)} - (/routes/data)
   **/
  get dataObject () { return this.#param; }
}


const settings = new DeviceSettings()

/**
 * @descr{}
 * @see  {}
 **/

module.exports = { 
  settings: settings
};

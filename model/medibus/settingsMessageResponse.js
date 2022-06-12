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
const path        = require('path');
const win         = require(path.join(__dirname, '..', '..', 'logger', 'logger'));
const bus         = require(path.join(__dirname, '..', '..', 'config', 'medibus'));

const SettingSegment  = require(path.join(__dirname, 'settingSegment'));

class SettingsMessageResponse {

  #msgid
  #time
  #code         /// Message.code
  #hexPayload   /// Message.hexPayload
  #map          /// Map key = Text-Message-Code | value = TextSegment

  /**
   * @param{Message} - (/model/medibus/message)
   * @usedBy{Text}   - (/model/data/text)
   **/
  constructor(msg) {
    this.#map   = new Map();
    this.#msgid = msg.id;
    this.#time  = msg.dateTime;
    this.#code  = msg.code;
     
    if(msg.hasPayload){
      this.#hexPayload = msg.hexPayload;
      
      /// See Medibus RS232 
      let nsg = this.#hexPayload.length / 7;       
      for(let i = 0; i < nsg; ++i){
          let sg = SettingSegment.from(msg, i * 7);
          this.#map.set(sg.code, sg);
          console.log(`[SettingsMessageResponse] Index: ${i * 7}`);
        }
      } catch (error) {
        win.def.log({ level: 'error', file: 'SettingsMessageResponse', func: 'constructor', message: ` MsgId: ${this.id} | Segments: ${nsg} | Index: ${index}`});
      }
    }
    win.def.log({ level: 'info', file: 'SettingsMessageResponse', func: 'constructor', message: ` MsgId: ${this.id} | Segments: ${nsg}`});
  }

  get id        () { return this.#msgid; }
  get time      () { return this.#time; }
  get length    () { return this.#map.length; }
  get array     () { return [...this.#map.values()]; }
  get map       () { return this.#map; }
  static from = (msg) => { return new SettingsMessageResponse(msg); }
    
  /**
   * @usedBy{DeviceSettings} - (/model/data/settings)
   **/
  get dataObject () {
    return Array.from(this.#map.values()).map(s => s.dataObject);
  }
}


module.exports = SettingsMessageResponse;

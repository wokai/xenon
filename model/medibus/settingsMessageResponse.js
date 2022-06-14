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
  #time         /// Date
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
      try {
        /// See Dräger Medibus RS232 : Device Setting Responses (p. 17)
        let nsg = this.#hexPayload.length / 7;       
        for(let i = 0; i < nsg; ++i){
            let sg = SettingSegment.from(msg, i * 7);
            this.#map.set(sg.code, sg);
          }
      } catch (error) {
        win.def.log({ level: 'error', file: 'SettingsMessageResponse', func: 'constructor', message: ` MsgId: ${this.id} | Segments: ${nsg} | Index: ${index}`});
      }
    }
    win.def.log({ level: 'debug', file: 'SettingsMessageResponse', func: 'constructor', message: ` MsgId: ${this.id} | Segments: ${this.#map.size}`});
  }

  get id        () { return this.#msgid; }
  get time      () { return this.#time; }
  get length    () { return this.#map.length; }
  get array     () { return [...this.#map.values()]; }
  get map       () { return this.#map; }
  static from = (msg) => { return new SettingsMessageResponse(msg); }
  
  
  /// ////////////////////////////////////////////////////////////////////// ///
  /// Get numeric value from SettingSegment Objects
  /// Both functions return the desired numeric value or 0
  /// ////////////////////////////////////////////////////////////////////// ///
  
  /// Returns float
  getFlt = (p) => {
    let v = this.#map.get(p)
    if(v === undefined){ return 0;} 
    let f = Number.parseFloat(v.setting);
    if(Number.isNaN(f)){ return 0; }
    return f;
  }
  
  /// Returns integer
  getInt = (p) => {
    let v = this.#map.get(p)
    if(v === undefined){ return 0;} 
    let f = Number.parseInt(v.setting);
    if(Number.isNaN(f)){ return 0; }
    return f;
  }
  
  /// ////////////////////////////////////////////////////////////////////// ///
  /// Public accessors for named parameters
  /// Retrieve an element (defined by its code) by querying local Map
  /// UsedBy: DeviceSettings.updateParamObject - (/model/data/settings)
  /// ////////////////////////////////////////////////////////////////////// ///
  get o2          () { return this.getFlt(bus.settings.o2)            };
  get tidalvolume () { return this.getFlt(bus.settings.tidalvolume);  };
  get insptime    () { return this.getFlt(bus.settings.insptime);     };
  get frequency   () { return this.getFlt(bus.settings.frequency);    };
  get peep        () { return this.getFlt(bus.settings.peep);         };
  get pps         () { return this.getInt(bus.settings.pps);          };
  get pmax        () { return this.getFlt(bus.settings.pmax);         };
  get insptime    () { return this.getInt(bus.settings.insptime);     };
  get flowtrigger () { return this.getFlt(bus.settings.flowtrigger);  };
  get slopetime   () { return this.getFlt(bus.settings.slopetime);    };
  get freshgas    () { return this.getInt(bus.settings.freshgas);     };
  get minfreq     () { return this.getFlt(bus.settings.minfreq);      };
  get pinsp       () { return this.getInt(bus.settings.pinsp);        };  
  get age         () { return this.getInt(bus.settings.age);          };
  get weight      () { return this.getInt(bus.settings.weight);       };

    
  /**
   * @usedBy{DeviceSettings} - (/model/data/settings)
   **/
  get dataObject () {
    return Array.from(this.#map.values()).map(s => s.dataObject);
  }
}


module.exports = SettingsMessageResponse;

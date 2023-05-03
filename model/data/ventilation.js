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

const general       = require(path.join(__dirname, '..', '..', 'config',  'general'));
const win           = require(path.join(__dirname, '..', '..', 'logger', 'logger'));
const status        = require(path.join(__dirname, '..', '..', 'controller', 'statusController'));
const { port }      = require(path.join(__dirname, '..', '..', 'controller', 'portController'));
const { episode }   = require(path.join(__dirname, '..', 'episode'));
const DataResponse  = require(path.join(__dirname, '..', 'medibus', 'dataResponse'));
const { cp1Alarms, cp1AlarmStates } = require(path.join(__dirname, 'alarm'));
const { text }      = require(path.join(__dirname, 'text' ));
const { settings }  = require(path.join(__dirname, 'settings'));

class Ventilation {
  
  #val
  #lolim
  #hilim
  
  constructor(){ this.setEmptyObject(); }
  
  /**
   * @descr{
   * @usedBy{MessageController.doNextAction}
   * @usedBy{/data/vent} - (/routes/data)
   **/
  getValueObject () {
    this.#val.episode = episode.uuid;
    this.#val.status  = status.controller.text;
    this.#val.alarm.cp1 = cp1AlarmStates.current; /// StateCodeMap
    this.#val.alarm.cp2 = cp2AlarmStates.current;
    //this.#val.alarm.cp1 = cp1Alarms.getAlarmArray(); /// Array<AlarmPeriod.dataObject>
    this.#val.text = text.paramObject;
    this.#val.settings = settings.dataObject;
    return this.#val;
  }
  
  
  
  setEmptyObject = () => {
    
    this.#val = {
      msgId: 0,
      time: general.empty.time,
      episode: '0',
      status: status.controller.text,
      patient: {
        compliance: '0',
      },
      respiration: {
        peak: '0',
        plateau: '0',
        peep: '0',
        rate: '0',
        tidalvolume: '0',
        minutevolume: '0'
      },
      gas: {
        fio2: '0',
        feo2: '0',
        o2uptake: '0',
        fico2: '0',
        feco2: '0'
      },
      inhalation:{
        mac : '0',
        isoflurane: {
          insp: '0',
          exp: '0',
          cons: '0'
        },
        desflurane: {
          insp: '0',
          exp: '0',
          cons: '0'
        },
        sevoflurane: {
          insp: '0',
          exp: '0',
          cons: '0'
        }
      },
      alarm: {
        cp1: [],
        cp2: []
      }
    }

    this.#lolim = {
      msgId: 0,
      time: general.empty.time,
      episode: '0',
      status: status.controller.text,
      patient: {
        compliance: '0',
      },
      respiration: {
        peak: '0',
        plateau: '0',
        peep: '0',
        rate: '0',
        tidalvolume: '0',
        minutevolume: '0'
      },
      gas: {
        fio2: '0',
        feo2: '0',
        o2uptake: '0',
        fico2: '0',
        feco2: '0'
      }
    }

    
    this.#hilim = {
      msgId: 0,
      time: general.empty.time,
      episode: '0',
      status: status.controller.text,
      patient: {
        compliance: '0',
      },
      respiration: {
        peak: '0',
        plateau: '0',
        peep: '0',
        rate: '0',
        tidalvolume: '0',
        minutevolume: '0'
      },
      gas: {
        fio2: '0',
        feo2: '0',
        o2uptake: '0',
        fico2: '0',
        feco2: '0'
      },
      inhalation:{
        isoflurane: {
          insp: '0'
        },
        desflurane: {
          insp: '0'
        },
        sevoflurane: {
          insp: '0'
        }
      }      
    }


  }
  
  /**
   * @param{msg} - (/model/medibus/message)
   **/
  setVentilation = (msg) => {
    try {
    
    /// Extract Data segments from Medibus message
    var res = new DataResponse(msg);
    
    this.#val.msgId = msg.id;
    this.#val.time  = msg.dateTime;
                                                                    /// Snomed CT identifier
    this.#val.patient.compliance          = res.getSegment('06');   ///   3863008
    
    this.#val.respiration.peak            = res.getSegment('7D');   ///  27913002
    this.#val.respiration.plateau         = res.getSegment('74');   /// 698822002
    this.#val.respiration.peep            = res.getSegment('78');   /// 250854009
    
    this.#val.respiration.rate            = res.getSegment('D9');   ///  86290005
    this.#val.respiration.tidalvolume     = res.getSegment('88');   ///  13621006
    this.#val.respiration.minutevolume    = res.getSegment('B9');   /// 250854009
    
    this.#val.gas.fio2                    = res.getSegment('F0');   /// 250774007
    this.#val.gas.feo2                    = res.getSegment('EF');   /// 250775008
    this.#val.gas.o2uptake                = res.getSegment('64');   /// 251832002
    this.#val.gas.feco2                   = res.getSegment('E6');   /// 250790007
    
    this.#val.inhalation.mac              = res.getSegment('AD');   /// 860940008
    this.#val.inhalation.isoflurane.insp  = res.getSegment('54');   /// 426504004
    this.#val.inhalation.isoflurane.exp   = res.getSegment('55');   /// 425421000
    this.#val.inhalation.isoflurane.cons  = res.getSegment('1D');   /// nn
    
    this.#val.inhalation.desflurane.insp  = res.getSegment('56');   /// 426748007
    this.#val.inhalation.desflurane.exp   = res.getSegment('57');   /// 425621006
    this.#val.inhalation.desflurane.cons  = res.getSegment('1E');   /// nn
    
    this.#val.inhalation.sevoflurane.insp = res.getSegment('58');   /// 425724007
    this.#val.inhalation.sevoflurane.exp  = res.getSegment('59');   /// 427210008
    this.#val.inhalation.sevoflurane.cons = res.getSegment('1F');   /// nn


    } catch(error) {
      win.def.log({ level: 'warn', file: 'ventilation', func: 'setVentilation', message:  err.message });
    }
  }
  
  /**
   * @usedBy{Action} - (/bus/action/alarm) - (action.alarm.ll)
   **/
  setAlarmLoLim = (msg) => {
    try{
      var res = new DataResponse(msg);
      
      this.#lolim.respiration.peak         = res.getSegment('05');
      this.#lolim.respiration.plateau      = res.getSegment('74');
      this.#lolim.respiration.peep         = res.getSegment('78');
      this.#lolim.respiration.rate         = res.getSegment('D9');
      this.#lolim.respiration.minutevolume = res.getSegment('B9');
      
      this.#lolim.gas.fio2                 = res.getSegment('F0');
      this.#lolim.gas.feo2                 = res.getSegment('EF');
      this.#lolim.gas.o2uptake             = res.getSegment('64');
      this.#lolim.gas.feco2                = res.getSegment('E6');

    } catch(err) {
      win.def.log({ level: 'warn', file: 'ventilation', func: 'setAlarmLoLim', message:  err.message });
    }
  }
  
  /**
   * @usedBy{Action} - (/bus/action/alarm) - (action.alarm.hl)
   **/
  setAlarmHiLim = (msg) => {
    try {
      var res = new DataResponse(msg);
      
      this.#hilim.respiration.peak             = res.getSegment('05');
      this.#hilim.respiration.plateau          = res.getSegment('74');
      this.#hilim.respiration.peep             = res.getSegment('78');
      this.#hilim.respiration.rate             = res.getSegment('D9');
      this.#hilim.respiration.minutevolume     = res.getSegment('B9');
      
      this.#hilim.gas.fio2                     = res.getSegment('F0');
      this.#hilim.gas.feo2                     = res.getSegment('EF');
      this.#hilim.gas.o2uptake                 = res.getSegment('64');
      this.#hilim.gas.feco2                    = res.getSegment('E6');
      
      this.#hilim.inhalation.desflurane.insp   = res.getSegment('AE');
      this.#hilim.inhalation.isoflurane.insp   = res.getSegment('F8');
      this.#hilim.inhalation.sevoflurane.insp  = res.getSegment('B0');
      
    } catch(err) {
      win.def.log({ level: 'warn', file: 'ventilation', func: 'setAlarmHiLim', message:  err.message });
    }
  }
  
}


const ventilation = new Ventilation();

module.exports = { 
  ventilation: ventilation
};

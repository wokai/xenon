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
 
const path   = require('path');
const crypto = require("crypto"); /// Generates 'Episode' UUID.
const fs     = require('fs');

const win     = require(path.join(__dirname, '..', '..', 'logger', 'logger'));
const general = require(path.join(__dirname, '..', '..', 'config', 'general'));

const text    = require(path.join(__dirname, 'text'));


class Episode {
  
  #nEpisodes
  #begin        /// dateDime
  #end
  #uuid
  
  #lastStandBy
  #currentStandbyPeriod
  #standbyPeriods
  
  #currentVentilationPeriod
  #ventilationPeriods
  
  #lastVentMode
  #currentVentModePeriod
  #ventModePeriods
  
  constructor() {
    this.#nEpisodes = 0;
    this.#begin = general.empty.time,
    this.#uuid  = general.empty.uuid,
    this.#end   = null;
    
    /// ----------------------------------------------------------------
    /// Standby periods
    /// ----------------------------------------------------------------
    this.#lastStandBy = null;
    this.#lastVentMode = null;
    this.#currentStandbyPeriod = null;
    this.#currentVentilationPeriod = null;
    
    this.#standbyPeriods = [];
    this.#ventilationPeriods = [];
    
    
    /// ----------------------------------------------------------------
    /// Ventilation mode periods
    /// ----------------------------------------------------------------
    this.#currentVentModePeriod = null;
    this.#ventModePeriods = [];
    
  }
  
  init = () => {
    ++this.#nEpisodes;
    this.#begin = new Date();
    this.#uuid  = crypto.randomBytes(16).toString("hex");
    this.#end = null;
  }
  
  terminate(){
    this.end = new Date();
    /// Terminates all current Text-Status parameters
    text.expire();
  }

  get begin () { return this.#begin; }
  get ventilationPeriods () { return this.#ventModePeriods; }
  
  beginVentPeriod = (standby) => {
    //win.status.log({code: value.code, text: value.text, begin: value.begin, end: value.back });
    win.def.log({ level: 'debug', file: 'model/data/episode', func: 'beginVentPeriod', message: `[Episode] Begin vent period: id: ${standby.msgId}, time: ${standby.time.toLocaleTimeString()},  ${standby.value}`});
    this.#currentVentilationPeriod = standby;
  }
  
  
  beginStandbyPeriod = (standby) => {
    win.def.log({ level: 'debug', file: 'model/data/episode', func: 'beginStandbyPeriod', message: `[Episode] Begin standby period: id: ${standby.msgId}, time: ${standby.time.toLocaleTimeString()},  ${standby.value}`});
    this.#currentStandbyPeriod = {
      begin: standby,               /// First Standby message
      end  : null                   /// First Message with Standby 'No'
    }
  }
  
  /**
   * @usedBy{} - (currently unused)
   **/
  
  endStandbyPeriod = (standby) => {
    if(this.#currentStandbyPeriod !== null) {
      
      /// Terminate current standby period
      this.#currentStandbyPeriod.end = standby;
      this.#standbyPeriods.push(this.#currentStandbyPeriod);
      this.#currentStandbyPeriod = null;
      
      /// Begin current ventilation period
      this.#currentVentilationPeriod = {
        begin: standby,
        end: null
      }
    }
  }
  
  
  /**
   * @param{standby} - ({ msgid, time, value });
   **/
  setStandby = (standby) => {
    if(this.#lastStandBy === null){
      win.def.log({ level: 'debug', file: 'model/data/episode', func: 'setStandby', message: `[Episode] First Standby: ${standby.value}`});
      this.#lastStandBy = standby;
      this.beginStandbyPeriod(standby);
    }
  }
  
  
  /**
   * @param{ventmode} - ({ msgId, time, code, text })
   **/
  beginVentModePeriod = (ventmode) => {
    if(this.#currentVentModePeriod !== null){
      this.#currentVentModePeriod.end = ventmode;
      this.#ventModePeriods.push(this.#currentVentModePeriod);
    }
    this.#currentVentModePeriod = {
      begin: ventmode,
      end  : null
    }
  }
  
  setVentmode = (ventmode) => {
    if(this.#lastVentMode === null) {
      this.#lastVentMode = ventmode;
      this.beginVentModePeriod(ventmode);
    } else {
      if(ventmode.code != this.#lastVentMode.code){
        this.beginVentModePeriod(ventmode);
      }
      this.#lastVentMode = ventmode;
    }
  }
  
  /**
   * @usedBy{Text} - (/model/data/text)
   * @param{text}  - (TextData)
   **/
  setText = (text) => {   
    this.setStandby(text.standby);
    this.setVentmode(text.ventmode);    
  }

}


const episode = new Episode();

/**
 * @descr{}
 * @see  {}
 **/

module.exports = { 
  episode: episode
};

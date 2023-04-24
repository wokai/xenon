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
 
const path    = require('path');
const crypto  = require("crypto"); /// Generates 'Episode' UUID.
const fs      = require('fs');

const win            = require(path.join(__dirname, '..', 'logger', 'logger'));
const { epilog }     = require(path.join(__dirname, '..', 'logger', 'fslog'));
const monitor        = require(path.join(__dirname, '..', 'monitor', 'monitor'));
const general        = require(path.join(__dirname, '..', 'config', 'general'));
const status         = require(path.join(__dirname, '..', 'controller', 'statusController'));


/**
 * @importedBy{/routes/episode}
 **/

/// ////////////////////////////////////////////////////////////////////
/// Thalas definition:
/// Connection: A period of successful network communication between an 
///             interface (Xenon) and a (Dräger) device
/// Episode: Series of uninterrupted observations captured by a single 
///             device on a single patient in a single location.
///
/// There are multiple types of episodes:
/// 1) Port-Episode: Port-opened to Port-closed
/// 2) Vent-Episode: Change StandBy -> Active to Change Active->StandBy
///
/// Thus, Episode is a central resource receiving signals from different
/// instances.
/// It must be constructed early from a minimal set of requirements.
/// ////////////////////////////////////////////////////////////////////

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
  
  #portEpisode  = {
    nEpisodes: 0,
    uuid:  general.empty.uuid,
    begin: general.empty.time,
    end:   null
  };
  
  
  constructor() {
    this.#nEpisodes = 0;
    this.#begin = general.empty.time;
    this.#uuid  = crypto.randomUUID();
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
    
    status.controller.on('protocol', (data) => { this.begin(); });
    status.controller.on('stopping', (data) => { this.terminate(); });
  }
  
  begin = () => {
    ++this.#nEpisodes;
    this.#begin = new Date();
    this.#uuid  = crypto.randomBytes(16).toString("hex");
    this.#end = null;
    monitor.infoMsg('Episode', `Begin: ${this.#begin.toISOString().substr(11, 8)} | Number of episodes: ${this.#nEpisodes}`);
  }
  
  terminate = () => {
    this.#end = new Date();
    monitor.infoMsg('Episode', `End. Periode Begin: ${this.#begin.toISOString().substr(11, 8)} - End: ${this.#end.toISOString().substr(11, 8)}`);
    /// Terminates all current Text-Status parameters via shutdown
  }
  
  get begin () { return this.#begin; }
  
  
  /// //////////////////////////////////////////////////////////////////
  /// Port-Episode
  /// //////////////////////////////////////////////////////////////////
  
  /**
   * @param {e} - {nEpisodes: number, uuid: string, begin: Date, end: Date}
   * @usedBy{portController.beginEpisode}
   **/
  setPortEpisode = (e) => { Object.assign(this.#portEpisode, e); }
  
  /**
   * @param {time} - { Date }
   * @usedBy{portControler.endEpisode}
   **/
  endPortEpisode = (time) => { 
    this.#portEpisode.end = time;
    win.status.log({ level: 'info', code: 'Port Episode', text: this.#portEpisode.uuid, begin: { id: 0, time: this.#portEpisode.begin }, end: { id: 0,  time: this.#portEpisode.end } });
    epilog.writeTimes(this.#portEpisode.begin, this.#portEpisode.end);
  }
  
  /// //////////////////////////////////////////////////////////////////
  /// Ventilation-Episode
  /// //////////////////////////////////////////////////////////////////
  
  /**
   * @usedBy{PortController.open} ??
   **/
  get uuid  () { return this.#uuid; }
  get ventilationPeriods () { return this.#ventModePeriods; }
  
  beginVentPeriod = (vent) => {
    //win.status.log({ level: 'info', code: value.code, text: value.text, begin: value.begin, end: value.back });
    win.def.log({ level: 'debug', file: 'model/data/episode', func: 'beginVentPeriod', message: `[Episode] Begin vent period: id: ${vent.msgId}, time: ${vent.time.toLocaleTimeString()},  ${vent.value}`});
    this.#currentVentilationPeriod = standby;
  }
  
  /// //////////////////////////////////////////////////////////////////
  /// StandBy period
  /// //////////////////////////////////////////////////////////////////
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
  
  
  /// //////////////////////////////////////////////////////////////////
  /// Ventilation Mode
  /// //////////////////////////////////////////////////////////////////
  endVentModePeriod = (ventmode) => {
    if(this.#currentVentModePeriod !== null){
      this.#currentVentModePeriod.end = ventmode;
      this.#ventModePeriods.push(this.#currentVentModePeriod);
      // ToDo: Date format ??
      monitor.infoMsg('Episode', `Vent-Mode ${this.#currentVentModePeriod.begin.text}:  ${this.#currentVentModePeriod.begin.time.toISOString().substr(11, 8)} - ${this.#currentVentModePeriod.end.time.toISOString().substr(11, 8)} `);
      win.def.log({ level: 'info', file: 'model/data/episode', func: 'endVentModePeriod', message: `[Episode] Vent-Mode-Period: Begin: ${this.#currentVentModePeriod.begin.time}, End: ${this.#currentVentModePeriod.end.time}`});      
      this.#currentVentModePeriod = null;
    }
  }
  
  /**
   * @usedBy{this.setText}
   * @param{ventmode} - ({ msgId, time, code, text })
   **/
  beginVentModePeriod = (ventmode) => {
    if(this.#currentVentModePeriod !== null){
      this.endVentModePeriod(ventmode);
    }
    this.#currentVentModePeriod = {
      begin: ventmode,
      end  : null
    }
    monitor.infoMsg('Episode', `Begin Vent-Mode Mode: ${this.#currentVentModePeriod.begin.text} | Time: ${this.#currentVentModePeriod.begin.time.toISOString().substr(11, 8)} `);
  }
  
  
  /**
   * @usedBy{this.setText}
   * @param{ventmode} - ({ msgId, time, code, text })
   **/
  setVentmode = (ventmode) => {
    if(this.#lastVentMode === null) {
      this.beginVentModePeriod(ventmode);
    } else {
      if(ventmode.code != this.#lastVentMode.code){
        this.endVentModePeriod(ventmode);
        this.beginVentModePeriod(ventmode);
      }
    }
    this.#lastVentMode = ventmode;
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
  Episode: Episode,
  episode: episode
};

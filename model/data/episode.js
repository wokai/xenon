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
 
const path   = require('path');
const crypto = require("crypto"); /// Generates 'Episode' UUID.
const fs     = require('fs');

const win     = require(path.join(__dirname, '..', '..', 'logger', 'logger'));
const general = require(path.join(__dirname, '..', '..', 'config', 'general'));


class Episode {
  
  #nEpisodes
  #begin        /// dateDime
  #end
  #uuid
  
  #lastStandBy
  #lastVentMode
  
  constructor() {
    this.#nEpisodes = 0;
    this.#begin = general.empty.time,
    this.#uuid  = general.empty.uuid,
    this.#end   = null;
    
    this.#lastStandBy = null;
    this.#lastVentMode = null;
  }
  
  init = () => {
    ++this.#nEpisodes;
    this.#begin = new Date();
    this.#uuid  = crypto.randomBytes(16).toString("hex");
    this.#end = null;
  }
  
  terminate(){
    this.end = new Date();
  }

  get begin () { return this.#begin; }
  
  /**
   * @usedBy{Text} - (/model/data/text)
   **/
  setText = (text) => {
    console.log(`[Episode] Standby: `, text.standby);
    /**
     * [Episode] Standby:  { value: 'No' }
     **/
    
    console.log(`[Episode] Ventmode: `, text.ventmode);
    /**
     *[Episode] Ventmode:  {
     *    code: '59',
     *    text: 'Volume Mode',
     *    value: 'Vol control',
     *    def: 'Volume controlled Ventilation Mode'
     * }
     **/
    
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

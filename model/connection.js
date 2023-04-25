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
const crypto  = require("crypto"); /// Generates UUID.
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
/// ////////////////////////////////////////////////////////////////////

class Connection {
  
  #nCon     /// number
  #begin    /// date
  #end      /// date
  #uuid     /// string
  #runtime  /// Runtime
  
  static #lastId = 0; /// Counter for creation of (session) unique id
  
  constructor(runtime) {
    this.#runtime = runtime;
    this.#nCon    = ++Connection.#lastId;
    this.#uuid    = crypto.randomUUID();
    this.#begin   = new Date();
    this.#end     = null;
  }
  
  begin = () => {
    ++this.#nCon;
    this.#begin = new Date();
    this.#uuid  = crypto.randomBytes(16).toString("hex");
    this.#end = null;
    monitor.infoMsg('Connection', `Begin: ${this.#begin.toISOString().substr(11, 8)} | Number of episodes: ${this.#nCon}`);
  }
  
  terminate = () => {
    this.#end = new Date();
    monitor.infoMsg('Connection', `End. Periode Begin: ${this.#begin.toISOString().substr(11, 8)} - End: ${this.#end.toISOString().substr(11, 8)}`);
    /// Terminates all current Text-Status parameters via shutdown
  }
  
  get begin () { return this.#begin; }
  get end   () { return this.#end;   }
  get uuid  () { return this.#uuid;  }
  
  get dataObject () {
    return {
      uuid  : this.#uuid,
      begin : this.#begin,
      end   : this.#end,
      runtime : this.#runtime.uuid
    };
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

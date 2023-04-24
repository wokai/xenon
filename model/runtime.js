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


/**
 * @importedBy{/routes/episode}
 **/

/// ////////////////////////////////////////////////////////////////////
/// Thalas definition:
/// Runtime: The execution time of a software device
///
/// ////////////////////////////////////////////////////////////////////

class Runtime {
  
  #nEpisodes    /// Number
  #begin        /// Date
  #end          /// Date
  #uuid         /// uuid
  
  constructor() {
    this.#nEpisodes = 0;
    this.#begin = new Date();
    this.#uuid  = crypto.randomUUID();
    this.#end   = null;
    
    /// ----------------------------------------------------------------
    /// 
    /// ----------------------------------------------------------------
    win.status.log({ level: 'info', code: 'Runtime', text: `UUID: ${this.#uuid} `, begin: { id: 0, time: this.#begin } });
  }
  
  terminate = () => {
    this.#end = new Date();
    win.status.log({ level: 'info', code: 'Runtime', text: `UUID: ${this.#uuid} `, begin: { id: 0, time: this.#begin }, end: { id: 0, time: this.#end } });
  }
}


const runtime = new Runtime();

/**
 * @descr{}
 * @see  {}
 **/

module.exports = { 
  runtime: runtime
};

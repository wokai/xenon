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
const { UuidState  } = require(path.join(__dirname, 'uuidState'));
const { text       } = require(path.join(__dirname, 'data', 'text'));

/**
 * @importedBy{/routes/episode}
 **/

/// ////////////////////////////////////////////////////////////////////
/// Thalas definition:
/// Connection: A period of successful network communication between an 
///             interface (Xenon) and a (Dräger) device
/// 
/// Begin and end of connection (creation and expiration of Connection
/// object) is triggered by StatusController events:
/// - protocol
/// - stopping
/// @see: {/model/runtime} - (Runtime.constructor)
/// ////////////////////////////////////////////////////////////////////

class Connection extends UuidState {
  
  #runtime  /// Runtime
  
  static #lastId = 0; /// Counter for creation of (session) unique id
  
  constructor(runtime) {
    super(++Connection.#lastId);
    this.#runtime = runtime;
    monitor.statusMsg('Connection',  this.id, this.begin, this.end );
  }
  
  /// 
  extendDataObject = (data) => { 
    data.runtime = this.#runtime.uuid;
    return data;
  }
  
  expire = () => {
    text.expire();
    monitor.statusMsg('Connection', this.id, this.begin, this.end );
  }
}


/**
 * @descr{}
 * @see  {}
 **/

module.exports = {
  Connection: Connection
};

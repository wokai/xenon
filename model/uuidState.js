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

const crypto  = require("crypto");    /// Generates uuid

/// ////////////////////////////////////////////////////////////////////
/// Generic container for State information. Indluces an UUID.
/// Usage:
/// Derive: 'extendDataObject': Used for creation of DataObject
/// Derive: 'expire': Define place for storage of expired
///          states. Will be called by terminate()
/// ////////////////////////////////////////////////////////////////////


class UuidState {
  
  #id     /// number     
  #uuid   /// uuid
  #begin  /// Date
  #end    /// Date

  #storage
  
  get id()    { return this.#id;    }
  get begin() { return this.#begin; }
  get end()   { return this.#end;   }
  get uuid()  { return this.#uuid;  }

  constructor(id = 0) {
    this.#id    = id;
    this.#begin = new Date();
    this.#uuid  = crypto.randomUUID();
    this.#end   = null;
  }
  
  /// //////////////////////////////////////////////////////////////////
  /// Save expired object
  /// Envelope function. To be overridden in derived classes
  /// //////////////////////////////////////////////////////////////////
  expire = () => {}
  
  /// //////////////////////////////////////////////////////////////////
  /// Get plain JavaScript object.
  /// Intended to be used for saving of expired objects
  /// //////////////////////////////////////////////////////////////////
  
  /// Envelope function. To be overridden in derived classes
  /// The overridden version shall append additional member variables
  extendDataObject = (data) => { return data; }
  
  getDataObject = () => {
    let d = {
      id:    this.#id,
      uuid:  this.#uuid,
      begin: this.#begin,
      end:   this.#end
    }
    return this.extendDataObject(r);
  }
  
  terminate = () => { 
    this.#end = new Date();
    this.expire();
  }
}


/**
 * @descr{}
 * @see  {}
 * @importedBy{/model/runtime}
 **/

module.exports = {
  UuidState: UuidState
};

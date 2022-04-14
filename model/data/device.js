'use strict';
/*******************************************************************************
 * The MIT License
 * Copyright 2021, Wolfgang Kaisers
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
 
 

/// //////////////////////////////////////////////////////////////////////// ///
/// Reference: P.19
/// - ID number NNNN
/// - Device name delimited by apostrophs (0x27)
/// - Revision
///   -- Device  Revision level DD.DD
///   -- Medibus Revision level MM.MM
/// Example: 8056'Primus'04.53:04.03
/// //////////////////////////////////////////////////////////////////////// ///
class Device {
  #obj
  
  constructor(){
    this.#obj = {
      id: 'Device id',
      name: 'Device name',
      devRevision: '00.00', /// Device  revision DD.DD
      busRevision: '00.00'  /// Medibus revision MM.MM
    }
  }
  
  get id ()           { return this.#obj.id; }
  get name ()         { return this.#obj.name; }
  get devRevision ()  { return this.#obj.devRevision; }
  get busRevision ()  { return this.#obj.busRevision; }
  get dataObject ()   { return this.#obj; }
  
  extract = (msg) => {
    var _id = msg.strPayload.split(/[':]/)
    this.#obj.id = _id[0];
    this.#obj.name = _id[1];
    this.#obj.devRevision = _id[2];
    this.#obj.busRevision = _id[3];
  }
  
  static from = (msg) => {
    var d = new Device();
    var _id = msg.strPayload.split(/[':]/)
    d.#obj.id = _id[0];
    d.#obj.name = _id[1];
    d.#obj.devRevision = _id[2];
    d.#obj.busRevision = _id[3];
    return d;
  }
}

const device = new Device();


module.exports = {
  device: device
};


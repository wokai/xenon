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
 
const path = require('path'); 

const win                 = require(path.join(__dirname, '..', '..', 'logger', 'logger'));
const bus                 = require(path.join(__dirname, '..', '..', 'config', 'medibus'));
const TextMessageResponse = require(path.join(__dirname, '..', 'medibus', 'textMessageResponse'));


class TextData {
  
  #resp
  
  constructor() {}
  
  extractTextMessages = (msg) => {
    if(msg.hasPayload){
      console.log(`Extract Message: ${msg.id}`)
      this.#resp = new TextMessageResponse(msg);
    }

  }
  
  get dataObject () { return this.#resp.dataObject; }
  
}


const text = new TextData();

/**
 * @descr{}
 * @see  {}
 **/

module.exports = { 
  text: text
};

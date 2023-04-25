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
 
const path     = require('path');
const win      = require(path.join(__dirname, '..', '..', 'logger', 'logger'));
const bus      = require(path.join(__dirname, '..', '..' , 'config', 'medibus'));
const AsciiHex = require(path.join(__dirname, 'asciiHex'));

/// //////////////////////////////////////////////////////////////////////// ///
/// Medibus Message
/// //////////////////////////////////////////////////////////////////////// ///


class Message {
  
  static #lastId = 0; /// Counter for creation of (session) unique id
  
  #id                 /// @type{Number} - (Message id; application unique)
  #buffer             /// Complete buffer or null (when not created from buffer)
  #body               /// Array where checksum is calculated from
  #checksum           /// {Buffer} - (Two hexadecimal values)
  #length             /// Length of complete message
  
  #type               /// Hexadecimal type  ( 0x1b  or 0x01)
  #code               /// Hexadecimal code 
  #payload            /// Hexadecimal payload (optional, may be null). Type: Buffer.

  #direction          /// Direction of message flow ('inc' or 'out')
  #dateTime           /// @type{Date}   - (DateTime of object creation)
  #date               /// @type{String} - (Date part)
  #time               /// @type{String} - (Time part)
  
  
  constructor(data, cmd, payload){
    
    this.#id = ++Message.#lastId;
    
    var d = new Date();
    
    this.#dateTime = d;
    this.#date = d.toISOString().substr(0, 10);
    this.#time = d.toISOString().substr(11, 8);
    
    if(Buffer.isBuffer(data)){
      
      /// ////////////////////////////////////////////////////////////////// ///
      /// Object is constructed from Buffer
      /// ////////////////////////////////////////////////////////////////// ///
      this.#buffer = data;
      this.#body = data.slice(0, -3);
      this.#checksum = data.slice(-3,-1);     
      this.#length = data.byteLength;
      
      this.#type = data[0];
      this.#code = data[1];
      
      /// Payload present
      if(data.byteLength > 5){
        this.#payload = data.slice(2, -3);
      } else {
        this.#payload = null;
      }
      
      this.#direction = bus.message.direction.in; /// Incoming message
      
    } else {
      /// ////////////////////////////////////////////////////////////////// ///
      /// Object is created from discrete data elements
      /// ////////////////////////////////////////////////////////////////// ///
      this.#buffer = null;
      this.#type = data;
      this.#code = cmd;
      this.#direction = bus.message.direction.out; /// Outgoing message
    }
    
    
  } /// Constructor
  
  /// ////////////////////////////////////////////////////////////////////// ///
  /// Public accessors
  /// ////////////////////////////////////////////////////////////////////// ///
  
  get id        () { return this.#id; }
  
  /**
   * @usedBy{Ventilation.setVentilation}          - (/model/data)
   * @usedBy{AlarmStatusResponse.constructor}     - (/model/medibus)
   * @usedBy{TextMessageResponse.constructor}     - (/model/medibus)
   * @usedBy{SettingsMessageResponse.constructor} - (/model/medibus)
   * @usedBy{DataResponse.constructor}            - (/model/medibus)
   **/
  get dateTime  () { return this.#dateTime; }
  get time      () { return this.#time; }
  get date      () { return this.#date; }
  get checksum  () { return this.#checksum; }
  
  /// Check Sanity
  /// - Terminator OK
  
  get hexPayload () { return this.#payload; }
  get strPayload () {
    if(!this.#payload) return '';
    return AsciiHex.hexArrayToString([...this.#payload])
  }
  hasPayload = () => { return (this.#payload !== null); }
  noPayload  = () => { return (this.#payload === null); }
  
  isCmd   = () => { return this.#type === bus.message.esc };
  isReply = () => { return this.#type === bus.message.soh };
  
  get cmd  ()    { return this.isCmd(); }
  get type ()    { return bus.message.types.get(this.#type); }
  get typestr()  { return bus.message.typestr.get(this.#type); }
  
  /// Translate binary message code into text
  get code ()    { return bus.codes.get(this.#code) }
  get nop  ()    { return this.#code === bus.command.nop; }
  get nak  ()    { return this.#code === bus.command.nak; }
  get stop ()    { return this.#code === bus.command.stop; }
  
  get hexCode () { return this.#code }
  get hexType () { return this.#type }
  
  get buffer () { 
    if(this.#buffer === null) {
      var a = [ this.#type, this.#code ];
      if(this.#payload){
        a.push(this.#payload)
      }
      a = a.concat(AsciiHex.checksum(a))
      a.push(bus.message.terminator)
      this.#buffer = Buffer.from(a);
    }
    return this.#buffer;
  }
  
  
  /**
   * @usedBy {MessageParser} (/bus/messageParser)
   * @descr  Instantiates a Message object from buffer content received
   *         via RS232
   * @throws {Error}(?)
   **/
  
  static fromBuffer(buf) {

    var msg = new Message(buf);
    /// Incoming checksum as provided as two bytes in buffer
    var inc = AsciiHex.charArrayToDecimal(AsciiHex.hexArrayToString(msg.checksum));  
    /// Calculated checksum from leading bytes in buffer
    let cal = AsciiHex.charArrayToDecimal(AsciiHex.hexArrayToString(AsciiHex.checksum(buf.slice(0, -3))));
    
    if(inc != cal){
      console.log('[/model/medibus/message] fromBuffer checksum error:')
      console.log('msg.checksum: ', msg.checksum);
      console.log('Incoming: %s', inc);
      console.log('Calc    : %s', cal);
      console.log(AsciiHex.hexString(buf));
      console.log(AsciiHex.checksum(buf.slice(0, -3)), '|', cal);
      win.def.log({ level: 'warn', file: 'message', func: 'fromBuffer', message: `Checksum error (Truncated message?): Msg ID ${msg.id} |  Type: ${msg.typestr} | Msg-code ${msg.code} | Buffer-calc checksum: ${cal} | Incoming Checksum: ${inc}` });
    }
    msg.dir = 1;
    return msg;
  }
  
  /// ////////////////////////////////////////////////////////////////////// ///
  /// Direction of message:
  /// inc = incoming : Message has been received from medibus device via serial
  /// out =          : Message will be sent to medibus device via serial
  /// ////////////////////////////////////////////////////////////////////// ///
  
  get dir () { return this.#direction; }
  set dir (val) {
    if(val) {
      this.#direction = bus.message.direction.in;
    } else {
      this.#direction = bus.message.direction.out;
    }
  }
  
  /**
   * Provide a readable string representation
   **/
  get dirString () {
    if(this.#direction == bus.message.direction.in){
      return bus.message.direction.instr;
    } else {
      return bus.message.direction.outstr;
    }
  }
  
  strBuffer = () => {
    return AsciiHex.hexString(this.buffer) 
  }
  
  
  /// Simple info object for printing (debug purposes) ...
  getInfo = () => {
    return {
      id: this.id,
      type: this.type,
      code: this.code,
      dir: this.dir,
      payload: this.#payload ? this.#payload.length : 0,
      date: this.date,
      time: this.time
    }
  }
}

module.exports = {
  Message: Message
}

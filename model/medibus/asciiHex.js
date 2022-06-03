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



class AsciiHex {
  
  /**
   * @descr{Converts Ascii-Hex into Number array: string}
   * Example: '1P' -> [ '31', '50' ]
   **/
  static from(str){
    /// 1) Expand string to char array
    /// 2) Convert characters to upper case
    /// 3) Extract ASCII code
    /// 3) Convert array elements to hexadecimal encoding
    return [...str].map(x => x.toUpperCase().charCodeAt(0).toString(16))
  }
  
  /**
   * @descr{Converts Ascii-Hex into number array}
   **/
  static asciiHexToIntArray (str) {
    return AsciiHex.from(str).map((n) => (parseInt(n)));
  }
  
  /// ////////////////////////////////////////////////////////////////////// ///
  /// Works on an array containing hexadecimal values 
  /// and returns hexadecimal values
  /// ////////////////////////////////////////////////////////////////////// ///
  static checksum(msg) {
    /// Sum values
    var sum = msg.reduce((a, b) => a + b, 0)
    /// Extract least significant 8-bit value
    var byte = sum & 0xFF;
    /// 1) Hexadecimal code
    /// 2) Convert characters to upper case
    /// 3) Extract ASCII code
    /// 3) Convert to hexadecimal
    return byte.toString(16).split('').map(x => x.toUpperCase().charCodeAt(0));
  }
  
  /// ////////////////////////////////////////////////////////////////////// ///
  /// Converts a checksum (AsciiHex representation in message) back into
  /// decimal value:
  /// '3A' -> 58 (p.45)
  /// ////////////////////////////////////////////////////////////////////// ///
  static strCheckSumToDecimal(str) {
    var a = [...str].map(x => parseInt(x.toUpperCase(), 16));
    return a[0]*16 + a[1];
  }
  
  /// ////////////////////////////////////////////////////////////////////// ///
  /// Converts a Buffer representation of checksum (given as two byte value in
  /// a message to decimal representation:
  /// <Buffer 33 41> -> 58
  /// ////////////////////////////////////////////////////////////////////// ///
  static hexChecksumToDecimal(buf) {
    return AsciiHex.strCheckSumToDecimal(AsciiHex.hexArrayToString(buf));
  }
  
  
  /// ////////////////////////////////////////////////////////////////////// ///
  /// Calculates integer checksum from hexadecimal array for usage in
  /// integer comparison (Message.fromBuffer):
  /// <Buffer 1b 51> -> 108
  /// ////////////////////////////////////////////////////////////////////// ///
  static decimalChecksum(msg) {
    return AsciiHex.hexChecksumToDecimal(AsciiHex.checksum(msg));
  }
  
  /// ////////////////////////////////////////////////////////////////////// ///
  /// Converts a checksum (AsciiHex representation in message) back into
  /// decimal value:
  /// '3A' -> 58 (p.45)
  /// ////////////////////////////////////////////////////////////////////// ///
  static checkSumToDecimal(str) {
    var a = [...str].map(x => parseInt(x.toUpperCase(), 16));
    return a[0]*16 + a[1];
  }
  
  /// ////////////////////////////////////////////////////////////////////// ///
  /// Converts a Buffer representation of checksum (given as two byte value in
  /// a message to decimal representation:
  /// <Buffer 33 41> -> 58
  /// ////////////////////////////////////////////////////////////////////// ///
  static hexChecksumToDecimal(buf) {
    return AsciiHex.strCheckSumToDecimal(AsciiHex.hexArrayToString(buf));
  }
  
  
  /// Convert array of hexadecimal into string: [ 0x45, 0x42 ] to EB
  static hexArrayToString(array){
    if(!array) return null;
    
    if(Buffer.isBuffer(array)){ return array.toString(); }
    
    /// Will return erroneus results when called on Buffer
    /// <Buffer 35 41> returns 50 instead of 5A.
    return array.map(x => String.fromCharCode(x)).join('')
  }
  
  /// ////////////////////////////////////////////////////////////////////// ///
  /// Converts [ 0x20, 0x39, 0x38, 0x20 ] to [ '', '9', '8', '' ] (p.47)
  /// also works on strings
  /// ////////////////////////////////////////////////////////////////////// ///
  static hexArrayToCharArray(array){
    if(!array) return null;
    return array.map(x => x.toString(16)).map(x => parseInt(x, 16)).map(x => String.fromCharCode(x))
  }
  
  
  /// ////////////////////////////////////////////////////////////////////// ///
  /// Converts Uint8Array into readable string for logging or printout purposes
  /// Convenience function
  /// ////////////////////////////////////////////////////////////////////// ///
  static hexString(buf){
    /// Copy buffer content into array
    var a = [];
    for(var i = 0; i < buf.byteLength; ++i){
      a.push(buf[i]);
    }
  
    /// Format hexadecimal value to Uppercase and two digits
    var hex = a.map(x => {
      var h = x.toString(16).toUpperCase();
      if(h.length < 2) { h = "0" + h; }
      return h;
    });
    
    return hex.join(' ');
  }
  
}

module.exports = AsciiHex;

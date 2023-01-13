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


/******************************************************************************
 * Ascii-Hex format (p.45, Drager RS 232 Medibus, 6.0.0) :
 * Dec  Hex   Ascii           Ascii-Hex
 * 58   0x3A  [ '3' , 'A' ]   [ 0x33, 0x41 ]
 ******************************************************************************/


const path     = require('path');
const win      = require(path.join(__dirname, '..', '..', 'logger', 'logger'));

class AsciiHex {
  
  /**
   * @descr{Converts Ascii-Hex into Number array: string}
   * @examp{'1P' -> [ '31', '50' ] }
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
   * @examp{'1P' -> [ 31, 50 ]}
   **/
  static asciiHexToIntArray (str) {
    return AsciiHex.from(str).map((n) => (parseInt(n)));
  }
  
  /// ////////////////////////////////////////////////////////////////////// ///
  /// Works on an Array containing hexadecimal values 
  /// and returns Array containing hexadecimal values
  /// ////////////////////////////////////////////////////////////////////// ///
  static checksum(msg) {
    /// Sum values
    var sum = msg.reduce((a, b) => a + b, 0)
    /// Extract least significant 8-bit value
    var byte = sum & 0xFF;
    
    /// Return [ 48, 48 ] instead of [ 48 ]
    if(byte == 0) return [ 48, 48 ];
    
    /// 1) Hexadecimal code
    /// 2) Convert characters to upper case
    /// 3) Extract ASCII code
    /// 3) Convert to hexadecimal
    var res = byte.toString(16).split('').map(x => x.toUpperCase().charCodeAt(0));
    
    /// This should never happen ...
    if(isNaN(res[0])) {
      win.def.log({ level: 'warn', file: 'model/medibus/asciiHex', func: 'checksum', message: `NaN Checksum error: Sum: ${sum} | Byte: ${byte} | toString: ${byte.toString(16)} | result: ${res}` });
    }
    return res;
  }
  
  /// ////////////////////////////////////////////////////////////////////// ///
  /// Converts hexadecimal array into array of strings in hexadecimal format
  /// Example: [ 0x30, 0x45 ] => [ '0x30', '0x45' ]
  /// Used only for debug purposes
  /// ////////////////////////////////////////////////////////////////////// ///
  static hexArrayToStringArray(hex) {
    return hex.map(x => x.toString('16')).map(x => '0x'+x);
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
  
  /**
   * @param{ Buffer} - (Converts a Buffer representation of checksum, given as two byte value in a message, to decimal representation)
   * @usedBy{Message.fromBuffer} - (Core check of checksum)
   * @example{<Buffer 33 41> -> 58}
   **/
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
  
  /**
   * @descr{Converts a checksum (AsciiHex representation in message) back into decimal value}
   * @examp{ '3A' -> 58 (p.45)  |  'E' -> 14 }
   * @usedBy{Message.fromBuffer}
   */
  static charArrayToDecimal(str) {
    let a = [...str].map(x => parseInt(x.toUpperCase(), 16));
    if(a.length == 2) {
      return a[0]*16 + a[1];
    }
    return a[0];
  }
  
  /**
   * @descr{Converts a Buffer representation of checksum (given as two byte value) to decimal representation}
   * @examp{<Buffer 33 41> -> 58}
   * @usedBy{Message.fromBuffer}
   * @param{Buffer}
   **/
  static hexChecksumToDecimal(buf) {
    return AsciiHex.strCheckSumToDecimal(AsciiHex.hexArrayToString(buf));
  }
  
  
  /**
   * @descr{Converts array of hexadecimal values and Buffer to string (hex-format) } 
   *         - (Example: [ 0x45, 0x42 ] -> 'EB')
   * @usedBy{TextSegment - get text}
   * @usedBy{Message.fromBuffer}
   **/
  static hexArrayToString(array){
    if(!array) return null;
    
    if(Buffer.isBuffer(array)){ return array.toString(); }
    /// Will return erroneus results when called on Buffer
    /// <Buffer 35 41> returns 50 instead of 5A.
    return array.map(x => String.fromCharCode(x)).join('')
  }
    
  /// ////////////////////////////////////////////////////////////////////// ///
  /// Converts Uint8Array into readable string for logging or printout purposes
  /// Convenience function
  /// ////////////////////////////////////////////////////////////////////// ///
  static hexString(buf){
    let a = [...buf].map(x => x.toString(16).toUpperCase());
    return a.map(x => (x.length<2) ? `0${x}` : x ).join(' ');
  }
  
}

module.exports = AsciiHex;

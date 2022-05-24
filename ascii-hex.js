const colors = require('colors');




/// ////////////////////////////////////////////////////////////////////////////
/// Protocol Definition
/// Dräger RS 232 MEDIBUS
/// Revision Level 6.00
/// ////////////////////////////////////////////////////////////////////////////

/// ////////////////////////////////////////////////////////////////////////////
/// A ASCII
/// ////////////////////////////////////////////////////////////////////////////

/// ///////////////////////////////////////////////////////////////////////// ///
/// Dec Hex    Dec Hex    Dec Hex  Dec Hex  Dec Hex  Dec Hex   Dec Hex   Dec Hex  
///   0 00 NUL  16 10 DLE  32 20    48 30 0  64 40 @  80 50 P   96 60 `  112 70 p
///   1 01 SOH  17 11 DC1  33 21 !  49 31 1  65 41 A  81 51 Q   97 61 a  113 71 q
///   2 02 STX  18 12 DC2  34 22 "  50 32 2  66 42 B  82 52 R   98 62 b  114 72 r
///   3 03 ETX  19 13 DC3  35 23 #  51 33 3  67 43 C  83 53 S   99 63 c  115 73 s
///   4 04 EOT  20 14 DC4  36 24 $  52 34 4  68 44 D  84 54 T  100 64 d  116 74 t
///   5 05 ENQ  21 15 NAK  37 25 %  53 35 5  69 45 E  85 55 U  101 65 e  117 75 u
///   6 06 ACK  22 16 SYN  38 26 &  54 36 6  70 46 F  86 56 V  102 66 f  118 76 v
///   7 07 BEL  23 17 ETB  39 27 '  55 37 7  71 47 G  87 57 W  103 67 g  119 77 w
///   8 08 BS   24 18 CAN  40 28 (  56 38 8  72 48 H  88 58 X  104 68 h  120 78 x
///   9 09 HT   25 19 EM   41 29 )  57 39 9  73 49 I  89 59 Y  105 69 i  121 79 y
///  10 0A LF   26 1A SUB  42 2A *  58 3A :  74 4A J  90 5A Z  106 6A j  122 7A z
///  11 0B VT   27 1B ESC  43 2B +  59 3B ;  75 4B K  91 5B [  107 6B k  123 7B {
///  12 0C FF   28 1C FS   44 2C ,  60 3C <  76 4C L  92 5C \  108 6C l  124 7C |
///  13 0D CR   29 1D GS   45 2D -  61 3D =  77 4D M  93 5D ]  109 6D m  125 7D }
///  14 0E SO   30 1E RS   46 2E .  62 3E >  78 4E N  94 5E ^  110 6E n  126 7E ~
///  15 0F SI   31 1F US   47 2F /  63 3F ?  79 4F O  95 5F _  111 6F o  127 7F DEL
/// ///////////////////////////////////////////////////////////////////////// ///

/// String.fromCharCode uses number base:
console.log('[Ascii] fromCharCode 41: Dec: %s | Hex: %s'.cyan, String.fromCharCode(41), String.fromCharCode(0x41))
console.log('[Ascii] %s'.cyan, [ 0x45, 0x42 ].map(x => String.fromCharCode(x)).join(''))
/// Intermediate conversion also works on string representations:
console.log('[Ascii] %s'.cyan, [ 0x45, 0x42 ].map(x => x.toString(16)).map(x => parseInt(x, 16)).map(x => String.fromCharCode(x)))
console.log('[Ascii] %s'.cyan, [ '45', '42' ].map(x => x.toString(16)).map(x => parseInt(x, 16)).map(x => String.fromCharCode(x)))

/// ////////////////////////////////////////////////////////////////////////////
/// B ASCII to HEX
/// ////////////////////////////////////////////////////////////////////////////

/// This format uses two bytes to represent a one-byte hexadecimal value in
/// ASCII characters.
/// The HEX numbers A – F are represented in upper case letters only.
/// Leading zeroes are not suppressed.


class AsciiHex {
  
  
  /// Example from('EB 98 E1 70 ')
  static from(str){
    /// 1) Expand string to char array
    /// 2) Convert characters to upper case
    /// 3) Extract ASCII code
    /// 3) Convert array elements to hexadecimal encoding
    return [...str].map(x => x.toUpperCase().charCodeAt(0).toString(16))
  }
  
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
  
  
  /// Convert array of hexadecimal into string: [ 0x45, 0x42 ] to EB
  static hexArrayToString(array){
    if(!array) return null;
    
    if(Buffer.isBuffer(array)){
      return array.toString();
    }
    
    /// Will return erroneus results when called on Buffer
    /// <Buffer 35 41> returns 50 instead of 5A.
    return array.map(x => String.fromCharCode(x)).join('')
  }
  
  
  /// Converts [ 0x20, 0x39, 0x38, 0x20 ] to [ '', '9', '8', '' ] (p.47)
  /// also works on strings [
  static hexArrayToCharArray(array){
    if(!array) return null;
    return array.map(x => x.toString(16)).map(x => parseInt(x, 16)).map(x => String.fromCharCode(x))
  }
  
  
  /// Convenience function:
  /// Converts Uint8Array into readable string for logging or printout purposes
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

/// //////////////////////////////////////////////////////////////////////// ///
/// From and to 'xyH' ASCII HEX format values
/// Examples (p. 59 RS232 Medibus):
/// SOH   01H   0x30, 0x31
/// ETX   03H   0x30, 0x33
/// CR    0DH   0x4f, 0x44
/// DC1   11H   0x31, 0x31
/// DC3   13H   0x31, 0x33
/// NAK   15H   0x31, 0x35
/// CAN   18H   0x31, 0x38
/// ESC   1BH   0x31, 0x42
/// Space 20H   0x32, 0x30
/// //////////////////////////////////////////////////////////////////////// ///

let str = '01'
console.log(`[Hex     ] String: ${str}H | Array: [ ${AsciiHex.from(str)} ]`.green)

str = '03'
console.log(`[Hex     ] String: ${str}H | Array: [ ${AsciiHex.from(str)} ]`.green)

str = 'OD'
console.log(`[Hex     ] String: ${str}H | Array: [ ${AsciiHex.from(str)} ]`.green)

str = '11'
console.log(`[Hex     ] String: ${str}H | Array: [ ${AsciiHex.from(str)} ]`.green)

str = '15'
console.log(`[Hex     ] String: ${str}H | Array: [ ${AsciiHex.from(str)} ]`.green)

str = '18'
console.log(`[Hex     ] String: ${str}H | Array: [ ${AsciiHex.from(str)} ]`.green)

str = '1B'
console.log(`[Hex     ] String: ${str}H | Array: [ ${AsciiHex.from(str)} ]`.green)

str = '20'
console.log(`[Hex     ] String: ${str}H | Array: [ ${AsciiHex.from(str)} ]`.green)

str = '3A'
console.log(`[Hex     ] String: ${str}H | Array: [ ${AsciiHex.from(str)} ]`.green)

str = '24'
console.log(`[Hex     ] String: ${str}H | Array: [ ${AsciiHex.from(str)} ]`.green)

str = 'EB 98 '
console.log(`[Hex     ] String: *${str}* | Array: [ ${AsciiHex.from(str)} ]`.green)


console.log('[Hex     ] [32 ,34]  %s'.green, AsciiHex.hexArrayToString([ 0x32, 0x34 ]));              /// 24H
console.log('[Hex     ] [35 ,41]  %s'.green, AsciiHex.hexArrayToString([ 0x35, 0x41 ]));              /// 5AH
console.log('[Hex     ] [35 ,42]  %s'.green, AsciiHex.hexArrayToString([ 0x35, 0x42 ]));              /// 5BH
console.log('[Hex     ] [35 ,41]  %s'.green, AsciiHex.hexArrayToString(Buffer.from([ 0x35, 0x41 ]))); /// 5AH


/// Data example p. 47  
///             SOH Data     E     B     ''    9     8    ''     E     1    ''     7     0    ''
const oxi = [ 0x01, 0x24, 0x45, 0x42, 0x20, 0x39, 0x38, 0x20, 0x45, 0x31, 0x20, 0x37, 0x30, 0x20];

console.log('[Oxi Checksum ] Dec: %s | toString: %s'.green, AsciiHex.checksum(oxi), AsciiHex.hexArrayToString(AsciiHex.checksum(oxi)));
console.log('[Oxi toString ] Payload: %s'.green, AsciiHex.hexArrayToString(oxi.slice(2)));
console.log('[Checksum ] 1B 2B: %s'.green, AsciiHex.checksum([0x1b, 0x2b]));
console.log('[toString ] %s'.green, AsciiHex.hexArrayToString([ 0x45, 0x42 ]));         /// 'EB'


/// Decode data message
const oxifull = [ 0x01, 0x24, 0x45, 0x42, 0x20, 0x39, 0x38, 0x20, 0x45, 0x31, 0x20, 0x37, 0x30, 0x20, 0x37, 0x41, 0x0d];
const oxiPayload = oxifull.slice(2, -3);
console.log('[Payload] length: %i'.yellow, oxiPayload.length);

const osat = {
  code : AsciiHex.hexArrayToString(oxiPayload.slice(0, 2)),
  data : AsciiHex.hexArrayToString(oxiPayload.slice(2, 6))
}
console.log(osat)

const pulse = {
  code : AsciiHex.hexArrayToString(oxiPayload.slice(6, 8)),
  data : AsciiHex.hexArrayToString(oxiPayload.slice(8, 12))
}
console.log(pulse)

console.log('[Char-code: ] %s'.yellow, Math.abs(40).toString(16))
console.log('[Char-code: ] %s'.yellow, String.fromCharCode(parseInt('40', 16)))


/// ////////////////////////////////////////////////////////////////////////////
/// C Checksum
/// ////////////////////////////////////////////////////////////////////////////

const checksum = (msg) => {
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

console.log('[Checksum ] 1B 2B: %s'.blue, checksum([0x1b, 0x2b]));

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


/// ////////////////////////////////////////////////////////////////////////////
/// Buffer
/// ////////////////////////////////////////////////////////////////////////////

/// Create Buffer from array of hexadecimal numbers
let buf = Buffer.from([ 0x1b, 0x51, 0x36, 0x43, 0x0d ])
console.log('[Buffer] '.yellow, buf)

buf = Buffer.from([0x32, 0x33, 0x41, 0x42]);
console.log(`[Buffer] [0x32, 0x33, 0x41, 0x42] toString: ${buf.toString()}`.yellow); 



/// ////////////////////////////////////////////////////////////////////////////
/// Translation between String and Number
/// ////////////////////////////////////////////////////////////////////////////
/// Number -> String:
/// String.fromCharCode 
/// Translates from (decimal or hexadecimal) number into Character
console.log('[Ascii] String.fromCharCode 41 : Dec: %s | Hex: %s'.cyan, String.fromCharCode(41), String.fromCharCode(0x41));

/// Number -> String:
/// Number(..).toString();
console.log('[Ascii] Number(45).toString()  : %s (base 10)'.cyan, Number(45).toString());
console.log('[Ascii] Number(45).toString(16): %s (base 16)'.cyan, Number(45).toString(16));

/// Conversion on Arrays
console.log('[ 0x45, 0x42 ].fromCharCode    : %s'.cyan, [ 0x45, 0x42 ].map(x => String.fromCharCode(x)));
console.log('[ 0x45, 0x42 ] joined          : %s'.cyan, [ 0x45, 0x42 ].map(x => String.fromCharCode(x)).join(''));

/// Conversion which works on Array of Hexadecimal and Char:
console.log('[Ascii] [ 0x45, 0x42 ]         : %s'.cyan, [ 0x45, 0x42 ].map(x => x.toString(16)).map(x => parseInt(x, 16)).map(x => String.fromCharCode(x)))
console.log('[Ascii] [ \'45\', \'42\' ]         : %s'.cyan, [ '45', '42' ].map(x => x.toString(16)).map(x => parseInt(x, 16)).map(x => String.fromCharCode(x)))



/// ////////////////////////////////////////////////////////////////////////////
/// B ASCII to HEX
/// ////////////////////////////////////////////////////////////////////////////

/// This format uses two bytes to represent a one-byte hexadecimal value in
/// ASCII characters.
/// The HEX numbers A – F are represented in upper case letters only.
/// Leading zeroes are not suppressed.


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

console.log('[Hex     ] String: %s'.green, AsciiHex.from('EB 98'))
console.log('[Hex     ] String: %s'.green, AsciiHex.from('1P'))
console.log('[HexToInt] String: %s'.green, AsciiHex.asciiHexToIntArray('1P'))


console.log('[Hex     ] [35 ,41]  %s'.green, AsciiHex.hexArrayToString([ 0x35, 0x41 ])); /// 5A
console.log('[Hex     ] [35 ,42]  %s'.green, AsciiHex.hexArrayToString([ 0x35, 0x42 ])); /// 5B
console.log('[Hex     ] [35 ,41]  %s'.green, AsciiHex.hexArrayToString(Buffer.from([ 0x35, 0x41 ]))); /// 5A


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



/// ////////////////////////////////////////////////////////////////////////////
/// Text segment
/// ////////////////////////////////////////////////////////////////////////////

const textMsg = [ 0x32, 0x33, 0x33, 0x6b, 0x50, 0x61, 0x03, 0x32, 0x37, 0x4a, 0x41, 0x6e, 0x61, 0x65, 0x73, 0x74, 0x68, 0x65, 0x73, 0x69, 0x65, 0x2d, 0x47, 0x61, 0x73, 0x20, 0x49, 0x53, 0x4f, 0x46, 0x4c, 0x55, 0x52, 0x41, 0x4e, 0x45, 0x03, 0x32, 0x43, 0x37, 0x64, 0x65, 0x75, 0x74, 0x73, 0x63, 0x68, 0x03 ];
buf = Buffer.from(textMsg);

class BufferTextSegment {
  
  #code
  #length
  #text
  #etx
  
  #begin  /// Begin of buffer segment
  #end    /// First element after buffer segment
  
  /**************************************************************************
   * @param{buffer} - (Buffer) - (Message.payload)
   * @param{begin}  - (number) - (position of message in buffer. 0-based)
   * @see  {Medibus Protocol 6.0.0 - Text Message Response - p.18}
   * */
  
  extractSegmentFromBuffer = (buffer, begin) => {
    let index = begin;
    
    /**
     * @descr{First two bytes}  - (Code of text message)
     * @see{Medibus for Primus} - (Text Message - p.34)
     **/
    this.#code = buf.slice(index , index + 2);
    index += 2;
    
    /**
     * @descr{Third byte}                 - (Text length, Ascii-code)
     * @descr{length + 0x30 = Ascii-code} - (Range: '1'=0x30 to 'P'=0x50)
     **/
    this.#length = buf.slice(index, index + 1);
    index += 1;
    
    /**
     * @descr{Transmitted text} - {Ascii encoded)
     **/
    this.#text     = buf.slice(index, index + this.length);
    index += this.length;
    
    
    /**
     * @descr{ETX} - (end-of-text = 0x30)
     **/
    this.#etx = buf.slice(index, index + 1);
    
    /**
     * @descr{End position} - (Start position of next text segment, 0-based)
     **/
    this.#end = index + 1;
    
  }
  
 
  /**
   * @param{buf}   - (Buffer}
   * @param{begin} - (number) - 0-based index of current position in buffer
   **/
  constructor(buf, begin) {
    this.extractSegmentFromBuffer(buf, begin);
    console.log(`[TextSegment] Buffer length: ${buf.length} | Code: ${this.code} | Size: ${this.length} | Text: ${this.text} | ETX: ${AsciiHex.hexString(this.#etx)}H | End: ${this.end}`.cyan);
  }
  

  get code   () { return this.#code.toString()}   /// [ 0x32, 0x33 ] -> '23'
  get length () { return this.#length.readUInt8(0) - 0x30; }
  get text   () { return this.#text.toString(); } //{ return AsciiHex.hexArrayToString(this.#text) };
  get begin  () { return this.#begin; };
  get end    () { return this.#end;  };

}

const bts0 = new BufferTextSegment(buf, 0);
let index = bts0.end;

const bts1 = new BufferTextSegment(buf, index);
index = bts1.end;

const bts2 = new BufferTextSegment(buf, index);


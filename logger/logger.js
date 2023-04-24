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

const colors     = require('colors/safe');
const winston    = require('winston');

const { dateformat } = require('./dateformat');
const { format } = winston;
const { combine, label, json } = format;

const fs = require('fs');
const path = require('path');

const config = require(path.join(__dirname, '..', 'config', 'general'));

/// //////////////////////////////////////////////////////////////////////// ///
/// ToDo: dateformat: Will change to 'import' from verstion 5.0.0
/// See : dateformat.s file
/// //////////////////////////////////////////////////////////////////////// ///

/// //////////////////////////////////////////////////////////////////////// ///
/// GitHub Winston: "CHILL WINSTON! ... I put it in the logs."
/// https://www.urbandictionary.com/define.php?term=Chill%20Winston
/// Comes from The Lenny Henry Show from the late 80's in the UK.
/// He often tell his friend Winston to calm down - "chill, Winston".
/// https://www.comedy.co.uk/tv/the_lenny_henry_show/
/// //////////////////////////////////////////////////////////////////////// ///

/// //////////////////////////////////////////////////////////////////////// ///
/// Levels
/// error:   0
/// warn:    1 
/// info:    2 
/// http:    3
/// verbose: 4 
/// debug:   5 
/// silly:   6 
/// //////////////////////////////////////////////////////////////////////// ///


/// //////////////////////////////////////////////////////////////////////// ///
/// Default logger
/// //////////////////////////////////////////////////////////////////////// ///

/// FileTransport: Dayly rotating file log (eventually create directory)
if (!fs.existsSync(config.logger.logdir)){
  console.log(colors.yellow(`[logger.js] Logging directory '${config.logger.logdir}' does not exist (will be created).`))
  fs.mkdirSync(config.logger.logdir);
}
const defLogFile = 'win_' + dateformat(new Date(), 'yyyy-mm-dd') + '.log';
const defLogPath = path.join(config.logger.logdir, defLogFile);
const defFileStream = fs.createWriteStream(defLogPath, { flags: 'a' })
defFileStream.on('error', function(err) {
  console.log(colors.brightRed(`[logger/logger] createWriteStream Error on file (flag: ${fflag}): ${defLogPath} `))
  defFileStream.end();
});
const fileTransport = new winston.transports.Stream({ stream: defFileStream });
/// Second transport
const consTransport = new winston.transports.Console({
      format: winston.format.colorize({ all: true })
})

/// Define logging-format
const defFormat = winston.format.printf( ({ level, label, message, timestamp, file, func, stack}) => {
  if(!file)  { file = '-'; }
  if(!func)  { func = '-';  }
  if(!stack) { stack = '-'; } 
  /// Can be parsed as csv-format with delimiter |
  return `[${timestamp}] | Level: ${level} | File: ${file} | Function: ${func} | Message: ${message} | Stack: ${stack}`
});


const def = winston.createLogger({
  format: winston.format.combine(
    winston.format.label({label: 'default'}),
    winston.format.timestamp({ format: 'DD.MM.YYYY | HH:mm:ss' }),
    winston.format.splat(),
    defFormat
  ),
  transports: [
    consTransport,
    fileTransport
  ],
  level: config.logger.level, /// Default: info
  exitOnError: false
});

/// //////////////////////////////////////////////////////////////////////// ///
/// Message repository
/// //////////////////////////////////////////////////////////////////////// ///

/// Create file-transport
const msgFile = 'msg_' + dateformat(new Date(), 'yyyy-mm-dd') + '.log';
const msgPath = path.join(config.logger.logdir, msgFile);
const msgFileStream = fs.createWriteStream(msgPath, { flags: 'a' });
msgFileStream.on('error', function(err) {
  console.log(colors.brightRed(`[logger/logger] createWriteStream Error on file (flag: ${fflag}): ${defLogPath} `))
  msgFileStream.end();
});
const msgFileTransport = new winston.transports.Stream({ stream: msgFileStream });

/// Define format
const msgformat = winston.format.printf( ({ msg, timestamp }) => {
  if(!msg){
    var msg = {
      id : 0,
      dir: '-',
      cmd: '-',
      type: '-',
      code: '-'
    }
  }
  return `[${timestamp}] Id: ${msg.id} | ${msg.dir ? 'out' : ' in'} | ${msg.typestr} | code: ${msg.code}`;
});


const msg = winston.createLogger({
  format: winston.format.combine(
    winston.format.label({label: 'default'}),
    winston.format.timestamp({ format: 'DD.MM.YYYY | HH:mm:ss' }),
    winston.format.splat(),
    msgformat
  ),
  transports: [
    msgFileTransport
  ],
  level: config.logger.level,
  exitOnError: false
});

/// //////////////////////////////////////////////////////////////////////// ///
/// Status repository
/// //////////////////////////////////////////////////////////////////////// ///

const statusFile = 'status_' + dateformat(new Date(), 'yyyy-mm-dd') + '.log';
const statusPath = path.join(config.logger.logdir, statusFile);
const statusStream = fs.createWriteStream(statusPath, { flags: 'a' })
const statusTransport = new winston.transports.Stream({ stream: statusStream });

/**
 * @param{code}  - (String number)
 * @param{text}  - (String)
 * @param{begin} - (TimePoint: /model/data/parameterMap) - { id: number, time: Date }
 * @param{end}   - (TimePoint)
 **/
const statusFormat = winston.format.printf( ({ code, text, begin, end }) => {
  if(!code)   { code = '00'; }
  if(!text)   { text = '';   }
  if(!begin)  { begin = { id: 0, time : config.empty.time}; }
  if(!end)    { end = { id: 0, time : config.empty.time}; }
  
  return `Code ${code} | Text: ${text} | Begin: ${begin.id}-${dateformat(begin.time, 'HH:MM:ss')} | End: ${end.id}-${dateformat(end.time, 'HH:MM:ss')}`;
});

const status = winston.createLogger({
  format: winston.format.combine(
    winston.format.label({label: 'default'}),
    winston.format.timestamp({ format: 'DD.MM.YYYY | HH:mm:ss' }),
    winston.format.splat(),
    statusFormat
  ),
  transports: [
    statusTransport
  ],
  level: config.logger.level,
  exitOnError: false
});



/// //////////////////////////////////////////////////////////////////////// ///
/// Init and export
/// //////////////////////////////////////////////////////////////////////// ///

def.log({ level: 'info', file: 'logger', func: '(-)', message: `Log level: ${config.logger.level}`});

module.exports = {
  def   : def,
  msg   : msg,
  status: status
};


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

const bus = {
  handshake: {
    suspend:    0x11,
    resume:     0x13,
    abort:      0x18,
  },
  time : {
    nop:     1000,    /// Time intervall between two nop Commands
    timeout: 3000     /// Pause (waiting for response) after which communication will be re-initialised
  },
  message: {
    terminator: 0x0d, /// CR: carriage return  
    esc:        0x1b, /// Command
    soh:        0x01, /// Response
    /// Translation type -> label
    types: new Map([
      [ 0x1b, 'esc' ],
      [ 0x01, 'soh' ]
    ]),
    typestr: new Map([
      [ 0x1b, 'cmd' ],
      [ 0x01, 'rsp' ]
    ]),
    direction: {
      in: 0,          /// Message received from device
      out: 1,         /// Message to be sent to device
      instr : 'inc',  /// Message text (for testing purposes)
      outstr: 'out'   /// Message text (for testing purposes)
    }
  },
  command: {
    /// Control commands
    icc: 0x51,
    nop: 0x30,
    stop: 0x55,
    corr: 0x16,
    devid: 0x52,
    nak: 0x15,
    /// Miscellaneous commands
    timechange: 0x49,
    config: 0x4a
  },
  request: {
    device: {
      id: 0x52,
      settings: 0x29,
    },
    cur: {
      data: {
        cp1 : 0x24,
        cp2 : 0x2b
      },
      alarm: {
        cp1: 0x27,
        cp2: 0x2e, 
        cp3: 0x23,
      }
    }, /// cur
    lim: {
      alarm: {
        lo: 0x25,
        hi: 0x26
      }
    },
    date: 0x28
  },
  /// Back-translation code -> label 
  codes : new Map([
    [ 0x51, 'ICC'           ],
    [ 0x30, 'NOP'           ],
    [ 0x55, 'STOP'          ],
    [ 0x16, 'CORR'          ],
    [ 0x15, 'NAK'           ],
    [ 0x23, 'CUR_ALARM_CP3' ],
    [ 0x24, 'CUR_DATA_CP1'  ],
    [ 0x25, 'LIM_ALARM_LO'  ],
    [ 0x26, 'LIM_ALARM_HI'  ],
    [ 0x27, 'CUR_ALARM'     ],
    [ 0x29, 'SET_DEV'       ],
    [ 0x28, 'DATE_TIME'     ],
    [ 0x2b, 'CUR_DATA_CP2'  ],
    [ 0x2e, 'CUR_ALARM_CP2' ],  /// p.7
    [ 0x52, 'DEV_ID'        ]
  ]),
  alarms: {
    cp1 : new Map([
      /// Agent related alarms: Codepage 1
      [ '09', 'Insp. Halothane > high Limit' ],
      [ '0B', 'Insp. Enflurane > high Limit' ],
      [ '0C', 'Insp. Isoflurane > high Limit' ],
      [ '1F', 'Insp. Sevoflurane > high Limit' ],
      [ '24', 'Insp. Desflurane > high Limit' ],
      [ '29', 'Insp. Halothane < low Limit' ],
      [ '2A', 'Insp. Enflurane < low Limit' ],
      [ '2B', 'Insp. Isoflurane < low Limit'],
      [ '2C', 'Insp. Desflurane < low Limit' ],
      [ '32', 'Insp. Sevoflurane < low Limit' ],
      [ '66', 'Mixed Agent detected' ],
      [ '67', 'Multi-Gas Monitor Device Failure' ],
      [ '69', 'N2O-Measurement inoperable' ],
      [ '6E', 'Agent-Measurement inoperable' ],
      [ 'EE', 'Two Agents detected' ],

      /// Airway related alarms: Codepage 1
      [ '00', 'Apnea combined source' ],
      [ '0E', 'Apnea - No Volume exhaled for 30 Seconds' ],
      [ '0F', 'Apnea - Pressure absent for 15 Seconds' ],
      [ '10', 'Airway Pressure > high Limit' ],
      [ '19', 'Minute Volume < low Limit' ],
      [ '9B', 'Minute Volume > high Limit' ],
      [ 'A3', 'Mean Airway Pressure < -2 mbar' ],
      [ 'AC', 'Minute volume alarms off' ],
      [ 'AD', 'Pressure Measurement inoperable' ],
      [ 'BA', 'Airway Temperature > high Limit' ],
      [ 'C1', 'Flow Measurement inoperable' ],
      [ 'DA', 'PEEP > high Limit' ],
      [ 'F8', 'PEEP > Pressure Threshold for 15 sec' ],
      
      /// CO2 related alarms: Codepage 1
      [ '0D', 'Apnea - No CO2 Fluct. for 30 Seconds' ],
      [ '27', 'Endtidal CO2 < low Limit' ],
      [ '28', 'Endtidal CO2 > high Limit' ],
      [ '3C', 'Inspiratory CO2 > high Limit' ],
      [ '3D', 'CO2 Patient Sensor Line blocked' ],
      [ '57', 'CO2 Alarm disabled' ],
      [ '6A', 'CO2 Device Failure' ],
      [ 'F7', 'Insp. CO2 alarms off' ],

      /// O2 related alarms: Codepage 1
      [ '08', 'Insp. Oxygen < low Limit' ],
      [ '37', '% Oxygen > high Limit' ],
      [ 'BE', 'O2 Measurement inoperable']

      /// Miscellaneous alarms: Codepage1
      /// SpO2 related alarms: Codepage 1
      /// Ventilator related alarms: Codepage 1
    ]),
    cp2 : new Map([
      /// Agent related alarms: Codepage 2
      [ '3A', 'Insp. N2O high' ],
      [ 'A2', 'Exp.Hal.>high limit' ],
      [ 'A3', 'Exp.Enf.>high limit' ],
      [ 'A4', 'Exp.Iso.>high limit' ],
      [ 'A5', 'Exp.Des.>high limit' ],
      [ 'A6', 'Exp.Sev.>high limit' ],
      [ 'D2', 'Calculated MAC value decreasing' ],

      /// Airway related alarms: Codepage 2
      [ 'A8', 'Insp. Flow sensor inoperable' ],
      [ '67', 'Minute volume low alarm off' ],
      
      /// Miscellaneous alarms: Codepage2
    ])
  },
  /// ToDo: Not yet complete ...
  textMessages: new Map([
    [ '01', 'Ventilationmode IPPV' ],
    [ '06', 'Ventilationmode SIMV' ],
    [ '1E', 'Ventilator is in Standby-Mode' ],
    [ '2B', 'Ventilationmode man./spont.' ],
    [ '54', 'Device is in Standby-Mode' ]
  ])
};


module.exports = Object.freeze(bus);



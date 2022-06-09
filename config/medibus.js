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
      },
      text: 0x2a
    }, /// cur
    lim: {
      alarm: {
        lo: 0x25,
        hi: 0x26
      }
    },
    date: 0x28,
    text: 0x2a
  },
  /// Back-translation code -> label (Message.get code + getInfo)
  /// See: page 8 RS232_Medibus (Commands Codes)
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
    [ 0x2a, 'CUR_TEXT_MSG'  ],
    [ 0x2b, 'CUR_DATA_CP2'  ],
    [ 0x2e, 'CUR_ALARM_CP2' ],  /// p.7
    [ 0x52, 'DEV_ID'        ]
  ]),
  alarms: {
    cp1: [
      /// Agent related alarms: Codepage 1
      { id: 100, code: '09', label: 'Insp. Halothane > high Limit' },
      { id: 101, code: '0B', label: 'Insp. Enflurane > high Limit'},
      { id: 102, code: '0C', label: 'Insp. Isoflurane > high Limit' },
      { id: 103, code: '1F', label: 'Insp. Sevoflurane > high Limit'},
      { id: 104, code: '24', label: 'Insp. Desflurane > high Limit' },
      { id: 105, code: '29', label: 'Insp. Halothane < low Limit'},
      { id: 106, code: '2A', label: 'Insp. Enflurane < low Limit' },
      { id: 107, code: '2B', label: 'Insp. Isoflurane < low Limit'},
      { id: 108, code: '2C', label: 'Insp. Desflurane < low Limit' },
      { id: 109, code: '32', label: 'Insp. Sevoflurane < low Limit'},
      { id: 110, code: '66', label: 'Mixed Agent detected'},
      { id: 111, code: '67', label: 'Multi-Gas Monitor Device Failure'},
      { id: 112, code: '69', label: 'N2O-Measurement inoperable' },
      { id: 113, code: '6E', label: 'Agent-Measurement inoperable'},
      { id: 114, code: 'EE', label: 'Two Agents detected'},
      
      /// Airway related alarms: Codepage 1
      { id: 115, code: '00', label: 'Apnea combined source' },
      { id: 116, code: '0E', label: 'Apnea - No Volume exhaled for 30 Seconds'},
      { id: 117, code: '0F', label: 'Apnea - Pressure absent for 15 Seconds' },
      { id: 119, code: '10', label: 'Airway Pressure > high Limit'},
      { id: 120, code: '19', label: 'Minute Volume < low Limit'},
      { id: 121, code: '9B', label: 'Minute Volume > high Limit'},
      { id: 122, code: 'A3', label: 'Mean Airway Pressure < -2 mbar'},
      { id: 123, code: 'AC', label: 'Minute volume alarms off'},
      { id: 124, code: 'AD', label: 'Pressure Measurement inoperable'},
      { id: 125, code: 'BA', label: 'Airway Temperature > high Limit'},
      { id: 126, code: 'C1', label: 'Flow Measurement inoperable' },
      { id: 127, code: 'DA', label: 'PEEP > high Limit'},
      { id: 128, code: 'F8', label: 'PEEP > Pressure Threshold for 15 sec' },
      
      /// CO2 related alarms: Codepage 1
      { id: 129, code: '0D', label: 'Apnea - No CO2 Fluct. for 30 Seconds'},
      { id: 130, code: '27', label: 'Endtidal CO2 < low Limit'},
      { id: 131, code: '28', label: 'Endtidal CO2 > high Limit'},
      { id: 132, code: '3C', label: 'Inspiratory CO2 > high Limit'},
      { id: 134, code: '3D', label: 'CO2 Patient Sensor Line blocked' },
      { id: 135, code: '57', label: 'CO2 Alarm disabled' },
      { id: 136, code: '6A', label: 'CO2 Device Failure'},
      { id: 137, code: 'F7', label: 'Insp. CO2 alarms off'},

      /// Miscellaneous Alarms: Codepage 1
      { id: 138, code: '4B', label: 'Battery low'},
      { id: 139, code: '65', label: 'Primary Speaker Failure'},
      { id: 140, code: '78', label: 'Communication Error on Port COM 2'},
      { id: 141, code: '79', label: 'Communication Error on Port COM 1' },
      { id: 142, code: 'C9', label: 'Internal Temperature high' },
      { id: 143, code: 'CA', label: 'Fan failure'},
      { id: 144, code: 'EF', label: 'Power fail'},
      
      /// O2 related alarms: Codepage 1
      { id: 145, code: '08', label: 'Insp. Oxygen < low Limit'},
      { id: 146, code: '37', label: '% Oxygen > high Limit'},
      { id: 147, code: 'BE', label: 'O2 Measurement inoperable'},
      
      /// SpO2 related alarms: Codepage 1
      { id: 148, code: '01', label: 'No SpO2 Pulse for 10 Seconds'},
      { id: 149, code: '02', label: 'SpO2 Pulse < low Limit'},
      { id: 150, code: '07', label: 'Oxygen Saturation < low Limit'},
      { id: 151, code: '1E', label: 'SpO2 Pulse > high Limit'},
      { id: 152, code: '22', label: 'Oxygen Saturation > high Limit'},
      { id: 153, code: '35', label: 'SpO2 Sensor disconnected or fault'},
      { id: 154, code: '5B', label: 'Oximeter Alarm disabled'},
      { id: 155, code: '68', label: 'Oximeter Device Failure'},
      
      /// Ventilator related alarms: Codepage 1
      { id: 156, code: '11', label: 'Check Gas Supply'},
      { id: 157, code: '12', label: 'Check Air Supply'},
      { id: 158, code: '13', label: 'Check O2 Supply'},
      { id: 159, code: '9F', label: 'Problems with Ventilator'},
      { id: 160, code: 'A0', label: 'Ventilator Communication lost'},
      { id: 161, code: 'BD', label: 'Check O2 Supply (Advisory)'},
      { id: 162, code: 'C4', label: 'Pressure Limited Respiratory Volume'},
      { id: 163, code: 'C8', label: 'Fresh gas delivery failure'},
      { id: 164, code: 'ED', label: 'Check N2O Supply'},
      { id: 165, code: 'F1', label: 'Check Setting of Pmax.'},
      { id: 166, code: 'F3', label: 'No fresh gas'},
      { id: 167, code: 'F4', label: 'O2-Safety flow open during normal operation'},
    ],
    cp2: [
      /// Agent related alarms: Codepage 2
      { id: 200, code: '3A', label: 'Insp. N2O high' },
      { id: 201, code: 'A2', label: 'Exp.Hal.>high limit' },
      { id: 202, code: 'A3', label: 'Exp.Enf.>high limit'},
      { id: 203, code: 'A4', label: 'Exp.Iso.>high limit'},
      { id: 204, code: 'A5', label: 'Exp.Des.>high limit'},
      { id: 205, code: 'A6', label: 'Exp.Sev.>high limit'},
      { id: 206, code: 'D2', label: 'Calculated MAC value decreasing'},
      
      /// Airway related alarms: Codepage 2
      { id: 207, code: 'A8', label: 'Insp. Flow sensor inoperable' },
      { id: 208, code: '67', label: 'Minute volume low alarm off'  },
      
      /// Miscellaneous Alarms: Codepage 2
      { id: 209, code: 'A1', label: 'Power supply error'},
      { id: 210, code: 'D3', label: 'Gas analyser water trap expired'},
      { id: 211, code: 'D4', label: 'CO2 absorbent depleted'},
      { id: 212, code: 'D5', label: 'CO2 absorbent disconnected'},
      { id: 213, code: 'D6', label: 'Infinity ID breathing hose mismatch'},
      { id: 214, code: 'D7', label: 'Infinity ID breathing hose incompatible'},
      { id: 215, code: 'D8', label: 'Infinity ID functions inoperable' },
      { id: 216, code: 'D9', label: 'Infinity ID breathing hose expired'},
      { id: 217, code: 'F2', label: 'Infinity ID breathing hose missing'},
      
      /// Ventilator related alarms: Codepage 2
      { id: 218, code: '31', label: 'O2 cylinder pressure low without wall supply'},
      { id: 219, code: '32', label: 'O2 cylinder empty without wall supply'},
      { id: 220, code: '33', label: 'O2 cylinder not connected'},
      { id: 221, code: '34', label: 'N2O cylinder empty'},
      { id: 222, code: '35', label: 'N2O delivery failure'},
      { id: 223, code: '36', label: 'O2 delivery failure'},
      { id: 224, code: '37', label: 'AIR delivery failure'},
      { id: 225, code: '38', label: 'Set fresh gas flow not attained'},
      { id: 226, code: '39', label: 'Internal/external switch over valve error'},
      { id: 227, code: '6A', label: 'Circle occluded'},
      { id: 228, code: '8D', label: 'Breathing system disconnected'},
      { id: 229, code: '91', label: 'Loss of data'},
      { id: 230, code: '93', label: 'Apnea ventilation'},
      { id: 231, code: '9C', label: 'Circle leakage'},
      { id: 232, code: 'A0', label: 'Ventilator not in locked position'},
      { id: 233, code: 'A7', label: 'Set tidal volume not attained' },
      { id: 234, code: 'A9', label: 'Setting canceled'},
      { id: 235, code: 'AC', label: 'Fresh-Gas Flow too high'},
      { id: 236, code: 'AD', label: 'Fresh-Gas Flow active'},
      { id: 237, code: 'AF', label: 'Oxygen Cylinder open'},
      { id: 238, code: 'B0', label: 'N2O Cylinder open'},
      { id: 239, code: 'B1', label: 'Air Cylinder open'},
      { id: 240, code: 'B2', label: 'N2O Cylinder Sensor not connected'},
      { id: 241, code: 'B3', label: 'Air Cylinder Sensor not connected'},
      { id: 242, code: 'B4', label: 'O2 Cylinder Sensor not connected'},
      { id: 243, code: 'B5', label: 'Air Cylinder Pressure low'},
      { id: 244, code: 'C7', label: 'Air Fresh Gas Flow Measurement inoperable'},
      { id: 245, code: 'C8', label: 'O2 Fresh Gas Flow Measurement inoperable'},
      { id: 246, code: 'C9', label: 'N2O Fresh Gas Flow Measurement inoperable'},
      { id: 247, code: 'CA', label: 'No Air Supply'},
      { id: 248, code: 'CB', label: 'No N2O Supply'},
      { id: 249, code: 'D0', label: 'Pressure relief valve opened'}
    ]
  },
  text: {
    /**
     * @descr{Provices Map keys for extraction of stored text messages}
     * @see{Text.setEmptyParamObject} - (/model/data/text)
     **/
    parameters: {
      device: {
        language: 'language',
        co2unit: 'co2unit',
        agentunit: 'agentUnit',
        hlm: 'hlm',
        standby: 'standby',
        leaktest: 'leaktest'
      },
      ventilation: {
        inhal: 'inhal',
        secInhal: 'secInhal',
        carrier: 'carrier',
        ventmode: 'ventmode',
        autoflow: 'autoflow',
        psvadd: 'psvadd',
        sync: 'sync'
      }
    },
    messages: new Map([
      [ '01', { text: 'Ventilationmode IPPV' ,              param: 'ventmode', value: 'IPPV' } ],
      [ '06', { text: 'Ventilationmode SIMV' ,              param: 'ventmode', value: 'SIMV' } ],
      [ '1E', { text: 'Ventilator is in Standby-Mode',      param: 'ventmode', value: 'Standby' } ],
      
      [ '22', { text: 'Selected CO2 Unit is mmHg',          param: 'co2unit',  value: 'mmHg' } ],
      [ '23', { text: 'Selected CO2 Unit is kPa',           param: 'co2unit',  value: 'kPa' } ],
      [ '24', { text: 'Selected CO2 Unit is %',             param: 'co2unit',  value: '%' } ],
      
      [ '25', { text: 'Halothane detected',                 param: 'inhal',    value: 'Halothane' } ],
      [ '26', { text: 'Enflurane detected',                 param: 'inhal',    value: 'Enflurane' } ],
      [ '27', { text: 'Isoflurane detected',                param: 'inhal',    value: 'Isoflurane' } ],
      [ '28', { text: 'Desflurane detected',                param: 'inhal',    value: 'Desflurane' } ],
      [ '29', { text: 'Sevoflurane detected',               param: 'inhal',    value: 'Sevoflurane' } ],
      [ '2A', { text: 'No Anaesthesia Gas detected',        param: 'inhal',    value: 'None' } ],
      
      [ '2B', { text: 'Ventilationmode man./spont.',        param: 'ventmode', value: 'Man/Spont' } ],
      [ '34', { text: 'Ventilationmode PCV',                param: 'ventmode', value: 'PCV' } ],
      [ '36', { text: 'Ventilationmode FRESH GAS EXTERNAL', param: 'ventmode', value: 'Fresh Gas' } ],
      [ '53', { text: 'Device is performing leakage test',  param: 'leaktest', value: 'Yes' } ],
      [ '54', { text: 'Device is in Standby-Mode',          param:  'standby', value:  'Standby' } ],
      [ '59', { text: 'Volume controlled Ventilation Mode', param: 'ventmode', value: 'Vol control' } ],
      [ '5A', { text: 'Pressure controlled Ventilation Mode',   param: 'ventmode', value: 'Press control' } ],
      [ '5B', { text: 'Pressure Support Mode',                  param: 'ventmode', value: 'PSV' } ],
      [ '5C', { text: 'Pressure Support added to intermittend Ventilation Mode', param: 'psvadd', value: 'PSV added' } ],
      [ '5D', { text: 'Synchronized intermittend Ventilation',  param: 'sync', value: 'Synchronized'} ],
      [ '5E', { text: 'AutoFlow added to Volume Mode',      param: 'autoflow',  value: 'True'  } ],
      
      [ '58', { text: 'HLM Mode active',                    param: 'hlm',       value: 'Yes' } ],
      [ '2C', { text: 'Selected Language',                  param: 'language',  value: '' } ],
      
      [ '37', { text: 'Selected Carrier Gas is Air',        param: 'carrier',   value: 'Air' } ],
      [ '38', { text: 'Selected Carrier Gas is N2O',        param: 'carrier',   value: 'N2O' } ],
      
      [ '4A', { text: '2nd Agent Halothane detected',       param: 'secInhal',  value: 'Halothane' } ],
      [ '4B', { text: '2nd Agent Enflurane detected',       param: 'secInhal',  value: 'Enflurane' } ],
      [ '4C', { text: '2nd Agent Isoflurane detected',      param: 'secInhal',  value: 'Isoflurane' } ],
      [ '4D', { text: '2nd Agent Desflurane detected',      param: 'secInhal',  value: 'Desflurane' } ],
      [ '4E', { text: '2nd Agent Sevoflurne detected',      param: 'secInhal',  value: 'Sevoflurane' } ],
      [ '4F', { text: 'No 2nd Anesthesia Gas detected',     param: 'secInhal',  value: 'None' } ],
      
      [ '56', { text: 'Selected Agent Unit is kPa',         param: 'agentUnit', value: 'kPa' } ],
      [ '57', { text: 'Selected Agent Unit is %',           param: 'agentUnit', value: '%' } ]
      
      
    ]),
    etx: 0x03
  }
};


module.exports = Object.freeze(bus);



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

    cp1: new Map([

      /// Agent related alarms: Codepage 1
      [ '09', { id: 100, priority: '10/24/31' , code: '09', label: 'Insp. Halothane > high Limit'                                      } ],
      [ '0B', { id: 101, priority: '10/24/31' , code: '0B', label: 'Insp. Enflurane > high Limit'                                      } ],
      [ '0C', { id: 102, priority: '10/24/31' , code: '0C', label: 'Insp. Isoflurane > high Limit'                                     } ],
      [ '1F', { id: 103, priority: '10/24/31' , code: '1F', label: 'Insp. Sevoflurane > high Limit'                                    } ],
      [ '24', { id: 104, priority: '10/24/31' , code: '24', label: 'Insp. Desflurane > high Limit'                                     } ],
      [ '29', { id: 105, priority: '16/15'    , code: '29', label: 'Insp. Halothane < low Limit'                                       } ],
      [ '2A', { id: 106, priority: '16/15'    , code: '2A', label: 'Insp. Enflurane < low Limit'                                       } ],
      [ '2B', { id: 107, priority: '16/15'    , code: '2B', label: 'Insp. Isoflurane < low Limit'                                      } ],
      [ '2C', { id: 108, priority: '16/15'    , code: '2C', label: 'Insp. Desflurane < low Limit'                                      } ],
      [ '32', { id: 109, priority: '16/15'    , code: '32', label: 'Insp. Sevoflurane < low Limit'                                     } ],
      [ '66', { id: 110, priority: '15'       , code: '66', label: 'Mixed Agent detected'                                              } ],
      [ '67', { id: 111, priority: '1'        , code: '67', label: 'Multi-Gas Monitor Device Failure'                                  } ],
      [ '69', { id: 112, priority: '1'        , code: '69', label: 'N2O-Measurement inoperable'                                        } ],
      [ '6E', { id: 113, priority: '1'        , code: '6E', label: 'Agent-Measurement inoperable'                                      } ],
      [ 'EE', { id: 114, priority: '7'        , code: 'EE', label: 'Two Agents detected'                                               } ],
   
      /// Airway related alarms: Codepage 1
      [ '00', { id: 115, priority: '24/31'    , code: '00', label: 'Apnea combined source'                                             } ],
      [ '0E', { id: 116, priority: '24/31'    , code: '0E', label: 'Apnea - No Volume exhaled for 30 Seconds'                          } ],
      [ '0F', { id: 117, priority: '24/31'    , code: '0F', label: 'Apnea - Pressure absent for 15 Seconds'                            } ],
      [ '10', { id: 119, priority: '27'       , code: '10', label: 'Airway Pressure > high Limit'                                      } ],
      [ '19', { id: 120, priority: '22'       , code: '19', label: 'Minute Volume < low Limit'                                         } ],
      [ '9B', { id: 121, priority: '13'       , code: '9B', label: 'Minute Volume > high Limit'                                        } ],
      [ 'A3', { id: 122, priority: '30'       , code: 'A3', label: 'Mean Airway Pressure < -2 mbar'                                    } ],
      [ 'AC', { id: 123, priority: '1'        , code: 'AC', label: 'Minute volume alarms off'                                          } ],
      [ 'AD', { id: 124, priority: '8'        , code: 'AD', label: 'Pressure Measurement inoperable'                                   } ],
      [ 'BA', { id: 125, priority: '26'       , code: 'BA', label: 'Airway Temperature > high Limit'                                   } ],
      [ 'C1', { id: 126, priority: '8'        , code: 'C1', label: 'Flow Measurement inoperable'                                       } ],
      [ 'DA', { id: 127, priority: '14'       , code: 'DA', label: 'PEEP > high Limit'                                                 } ],
      [ 'FB', { id: 128, priority: '31'       , code: 'F8', label: 'PEEP > Pressure Threshold for 15 sec'                              } ],
   
      /// CO2 related alarms: Codepage 1
      [ '0C', { id: 129, priority: '10/24/31' , code: '0D', label: 'Apnea - No CO2 Fluct. for 30 Seconds'                              } ],
      [ '27', { id: 130, priority: '18'       , code: '27', label: 'Endtidal CO2 < low Limit'                                          } ],
      [ '28', { id: 131, priority: '18'       , code: '28', label: 'Endtidal CO2 > high Limit'                                         } ],
      [ '3C', { id: 132, priority: '11'       , code: '3C', label: 'Inspiratory CO2 > high Limit'                                      } ],
      [ '3D', { id: 134, priority: '7'        , code: '3D', label: 'CO2 Patient Sensor Line blocked'                                   } ],
      [ '57', { id: 135, priority: '1'        , code: '57', label: 'CO2 Alarm disabled'                                                } ],
      [ '6A', { id: 136, priority: '1'        , code: '6A', label: 'CO2 Device Failure'                                                } ],
      [ 'F7', { id: 137, priority: '1'        , code: 'F7', label: 'Insp. CO2 alarms off'                                              } ],

      /// Miscellaneous Alarms: Codepage 1
      [ '4B', { id: 138, priority: '13/7'     , code: '4B', label: 'Battery low'                                                       } ],
      [ '65', { id: 139, priority: '1'        , code: '65', label: 'Primary Speaker Failure'                                           } ],
      [ '78', { id: 140, priority: '1'        , code: '78', label: 'Communication Error on Port COM 2'                                 } ],
      [ '79', { id: 141, priority: '1'        , code: '79', label: 'Communication Error on Port COM 1'                                 } ],
      [ 'C9', { id: 142, priority: '10/29'    , code: 'C9', label: 'Internal Temperature high'                                         } ],
      [ 'CA', { id: 143, priority: '6'        , code: 'CA', label: 'Fan failure'                                                       } ],
      [ 'EF', { id: 144, priority: '7/10/12'  , code: 'EF', label: 'Power fail'                                                        } ],
      
      /// O2 related alarms: Codepage 1
      [ '08', { id: 145, priority: '31'       , code: '08', label: 'Insp. Oxygen < low Limit'                                          } ],
      [ '37', { id: 146, priority: '12'       , code: '37', label: '% Oxygen > high Limit'                                             } ],
      [ 'BE', { id: 147, priority: '8/11'     , code: 'BE', label: 'O2 Measurement inoperable'                                         } ],
      
      /// SpO2 related alarms: Codepage 1
      [ '01', { id: 148, priority: '31'       , code: '01', label: 'No SpO2 Pulse for 10 Seconds'                                      } ],
      [ '02', { id: 149, priority: '31'       , code: '02', label: 'SpO2 Pulse < low Limit'                                            } ],
      [ '07', { id: 150, priority: '31'       , code: '07', label: 'Oxygen Saturation < low Limit'                                     } ],
      [ '1E', { id: 151, priority: '21'       , code: '1E', label: 'SpO2 Pulse > high Limit'                                           } ],
      [ '22', { id: 152, priority: '21'       , code: '22', label: 'Oxygen Saturation > high Limit'                                    } ],
      [ '35', { id: 153, priority: '10'       , code: '35', label: 'SpO2 Sensor disconnected or fault'                                 } ],
      [ '5B', { id: 154, priority: '1'        , code: '5B', label: 'Oximeter Alarm disabled'                                           } ],
      [ '68', { id: 155, priority: '1'        , code: '68', label: 'Oximeter Device Failure'                                           } ],
            
      /// Ventilator related alarms: Codepage 1
      [ '11', { id: 156, priority: '7/16/31'  , code: '11', label: 'Check Gas Supply'                                                  } ],
      [ '12', { id: 157, priority: '10'       , code: '12', label: 'Check Air Supply'                                                  } ],
      [ '13', { id: 158, priority: '11/31'    , code: '13', label: 'Check O2 Supply'                                                   } ],
      [ '9F', { id: 159, priority: '10/28'    , code: '9F', label: 'Problems with Ventilator'                                          } ],
      [ 'A0', { id: 160, priority: '30/10'    , code: 'A0', label: 'Ventilator Communication lost'                                     } ],
      [ 'BD', { id: 161, priority: '10/11'    , code: 'BD', label: 'Check O2 Supply (Advisory)'                                        } ],
      [ 'C4', { id: 162, priority: '13'       , code: 'C4', label: 'Pressure Limited Respiratory Volume'                               } ],
      [ 'C8', { id: 163, priority: '29/10'    , code: 'C8', label: 'Fresh gas delivery failure'                                        } ],
      [ 'ED', { id: 164, priority: '10'       , code: 'ED', label: 'Check N2O Supply'                                                  } ],
      [ 'F1', { id: 165, priority: '12'       , code: 'F1', label: 'Check Setting of Pmax.'                                            } ],
      [ 'F3', { id: 166, priority: '26/9'     , code: 'F3', label: 'No fresh gas'                                                      } ],
      [ 'F4', { id: 167, priority: '18'       , code: 'F4', label: 'O2-Safety flow open during normal operation'                       } ],
    ]),

  
    cp2: new Map([

      /// Agent related alarms: Codepage 2
      [ '3A', { id: 200, priority: '12'       , code: '3A', label: 'Insp. N2O high'                                                    } ],

      [ 'A2', { id: 201, priority: '31'       , code: 'A2', label: 'Exp.Hal.>high limit'                                               } ],
      [ 'A3', { id: 202, priority: '31'       , code: 'A3', label: 'Exp.Enf.>high limit'                                               } ],
      [ 'A4', { id: 203, priority: '31'       , code: 'A4', label: 'Exp.Iso.>high limit'                                               } ],
      [ 'A5', { id: 204, priority: '31'       , code: 'A5', label: 'Exp.Des.>high limit'                                               } ],
      [ 'A6', { id: 205, priority: '31'       , code: 'A6', label: 'Exp.Sev.>high limit'                                               } ],
      [ 'D2', { id: 206, priority: '14/7'     , code: 'D2', label: 'Calculated MAC value decreasing'                                   } ],
       
      /// Airway related alarms: Codepage 2
      [ 'A8', { id: 207, priority: '8'        , code: 'A8', label: 'Insp. Flow sensor inoperable'                                      } ],
      [ '67', { id: 208, priority: '1'        , code: '67', label: 'Minute volume low alarm off'                                       } ],
      
      /// Miscellaneous Alarms: Codepage 2
      [ 'A1', { id: 209, priority: '1'        , code: 'A1', label: 'Power supply error'                                                } ],
      [ 'D3', { id: 210, priority: '7'        , code: 'D3', label: 'Gas analyser water trap expired'                                   } ],
      [ 'D4', { id: 211, priority: '7'        , code: 'D4', label: 'CO2 absorbent depleted'                                            } ],
      [ 'D5', { id: 212, priority: '11'       , code: 'D5', label: 'CO2 absorbent disconnected'                                        } ],
      [ 'D6', { id: 213, priority: '11'       , code: 'D6', label: 'Infinity ID breathing hose mismatch'                               } ],
      [ 'D7', { id: 214, priority: '11'       , code: 'D7', label: 'Infinity ID breathing hose incompatible'                           } ],
      [ 'D8', { id: 215, priority: '7'        , code: 'D8', label: 'Infinity ID functions inoperable'                                  } ],
      [ 'D9', { id: 216, priority: '7'        , code: 'D9', label: 'Infinity ID breathing hose expired'                                } ],
      [ 'F2', { id: 217, priority: '7'        , code: 'F2', label: 'Infinity ID breathing hose missing'                                } ],

      /// Ventilator related alarms: Codepage 2
      [ '31', { id: 218, priority: '10'       , code: '31', label: 'O2 cylinder pressure low without wall supply'                      } ],
      [ '32', { id: 219, priority: '28/7'     , code: '32', label: 'O2 cylinder empty without wall supply'                             } ],
      [ '33', { id: 220, priority: '28'       , code: '33', label: 'O2 cylinder not connected'                                         } ],
      [ '34', { id: 221, priority: '25/7'     , code: '34', label: 'N2O cylinder empty'                                                } ],
      [ '35', { id: 222, priority: '10/25/31' , code: '35', label: 'N2O delivery failure'                                              } ],
      [ '36', { id: 223, priority: '31/11'    , code: '36', label: 'O2 delivery failure'                                               } ] ,
      [ '37', { id: 224, priority: '10/25/31' , code: '37', label: 'AIR delivery failure'                                              } ],
      [ '38', { id: 225, priority: '14/10'    , code: '38', label: 'Set fresh gas flow not attained'                                   } ],
      [ '39', { id: 226, priority: '30/10'    , code: '39', label: 'Internal/external switch over valve error'                         } ],
      [ '6A', { id: 227, priority: '25'       , code: '6A', label: 'Circle occluded'                                                   } ],
      [ '8D', { id: 228, priority: '15/31'    , code: '8D', label: 'Breathing system disconnected'                                     } ],
      [ '91', { id: 229, priority: '14/1'     , code: '91', label: 'Loss of data'                                                      } ],
      [ '93', { id: 230, priority: '11/9'     , code: '93', label: 'Apnea ventilation'                                                 } ],
      [ '9C', { id: 231, priority: '7'        , code: '9C', label: 'Circle leakage'                                                    } ],
      [ 'A0', { id: 232, priority: '27/10'    , code: 'A0', label: 'Ventilator not in locked position'                                 } ],
      [ 'A7', { id: 233, priority: '12'       , code: 'A7', label: 'Set tidal volume not attained'                                     } ],
      [ 'A9', { id: 234, priority: '14'       , code: 'A9', label: 'Setting canceled'                                                  } ],
      [ 'AC', { id: 235, priority: '14'       , code: 'AC', label: 'Fresh-Gas Flow too high'                                           } ],
      [ 'AD', { id: 236, priority: '13'       , code: 'AD', label: 'Fresh-Gas Flow active'                                             } ],
      [ 'AF', { id: 237, priority: '7'        , code: 'AF', label: 'Oxygen Cylinder open'                                              } ],
      [ 'B0', { id: 238, priority: '7'        , code: 'B0', label: 'N2O Cylinder open'                                                 } ],
      [ 'B1', { id: 239, priority: '7'        , code: 'B1', label: 'Air Cylinder open'                                                 } ],
      [ 'B2', { id: 240, priority: '8'        , code: 'B2', label: 'N2O Cylinder Sensor not connected'                                 } ],
      [ 'B3', { id: 241, priority: '8'        , code: 'B3', label: 'Air Cylinder Sensor not connected'                                 } ],
      [ 'B4', { id: 242, priority: '8'        , code: 'B4', label: 'O2 Cylinder Sensor not connected'                                  } ],
      [ 'B5', { id: 243, priority: '7/24'     , code: 'B5', label: 'Air Cylinder Pressure low'                                         } ],
      [ 'C7', { id: 244, priority: '11'       , code: 'C7', label: 'Air Fresh Gas Flow Measurement inoperable'                         } ],
      [ 'C8', { id: 245, priority: '11'       , code: 'C8', label: 'O2 Fresh Gas Flow Measurement inoperable'                          } ],
      [ 'C9', { id: 246, priority: '11'       , code: 'C9', label: 'N2O Fresh Gas Flow Measurement inoperable'                         } ],
      [ 'CA', { id: 247, priority: '25/10'    , code: 'CA', label: 'No Air Supply'                                                     } ],
      [ 'CB', { id: 248, priority: '25/10'    , code: 'CB', label: 'No N2O Supply'                                                     } ],
      [ 'D0', { id: 249, priority: '10'       , code: 'D0', label: 'Pressure relief valve opened'                                      } ]
    ])
  },
  text: {
    /**
     * @descr{Provices Map keys for extraction of stored text messages}
     * @see{Text.setEmptyParamObject}  - (/model/data/text)
     * @usedBy{/param/text/parameters} - (/routes/param)
     **/
    parameters: {
      device: {
        language:  'language',
        co2unit:   'co2unit',
        agentunit: 'agentUnit',
        hlm:       'hlm',
        standby:   'standby',
        leaktest:  'leaktest'
      },
      ventilation: {
        inhal:    'inhal',
        secInhal: 'secInhal',
        carrier:  'carrier',
        ventmode: 'ventmode',
        autoflow: 'autoflow',
        psvadd:   'psvadd',
        sync:     'sync',
        airway:   'airway',
        tubetype: 'tubetype'
      }
    },
    
    /**
     * @usedBy{/param/text/messages}         - (/routes/param)
     * @see   {Medibus for Primnus }         - (p.34)
     * @see   {Medibux.X Profile Definition} - (p.109 - 127)
     **/
    messages: new Map([
      [ '01', { param: 'ventmode'      , value: 'IPPV'            , text: 'Ventilationmode IPPV'                } ],
      [ '02', { param: 'ventmode'      , value: 'VC-AC'           , text: 'Ventilationmode VC-AC'               } ],
      [ '06', { param: 'ventmode'      , value: 'SIMV'            , text: 'Ventilationmode SIMV'                } ],
      [ '0A', { param: 'ventmode'      , value: 'SPN-CPAP'        , text: 'Ventilationmode SPN_CPAP'            } ],
      [ '0C', { param: 'ventmode'      , value: 'VC-MMC'          , text: 'Ventilationmode VC-MMC'              } ],
      [ '0D', { param: 'ventmode'      , value: 'PC-MMV'          , text: 'Ventilationmode PC-MMV'              } ],
      [ '0E', { param: 'ventmode'      , value: 'BIPAP'           , text: 'Ventilationmode BIPAP'               } ],
      [ '11', { param: 'ventmode'      , value: 'APNOE'           , text: 'Ventilationmode Apnoe ventilation'   } ],
      [ '12', { param: 'ventmode'      , value: 'TEST'            , text: 'Product Test mode'                   } ],
      [ '13', { param: 'incuwarmermode', value: 'Air mode'        , text: 'Incu Warmer Air Mode'                } ],
      [ '14', { parem: 'incuwarmermode', value: 'Skin mode'       , text: 'Incu Warmer Skin Mode'               } ],
      [ '1E', { param: 'ventmode'      , value: 'Standby'         , text: 'Ventilator is in Standby-Mode'       } ],
      [ '15', { param: 'incuwarmeroxy' , value: 'Oxygen Control'  , text: 'Incu Warmer Oxygen Control active'   } ],
      [ '16', { param: 'incuwarmerhum' , value: 'Humidity Control', text: 'Incu Warmer Humidity Control active' } ],
      [ '18', { param: 'ventmode'      , value: 'PC-SIMV'         , text: 'Ventilationmode PC-SIMV'             } ],
      [ '1A', { param: 'ventmode'      , value: 'PC-APRV'         , text: 'Ventilationmode PC-ARPV'             } ],
      [ '1B', { param: 'ventmode'      , value: 'PC-HFO'          , text: 'Ventilationmode PC-HFO'              } ],
      [ '1C', { param: 'suctmaneuver'  , value: 'Suc-Manvr'       , text: 'Suction maneuver'                    } ],
      [ '1D', { param: 'loflomeneuver' , value: 'LoFlo-Manvr'     , text: 'Low-Flow maneuver'                   } ],
      [ '1E', { param: 'ventmode'      , value: 'Standby'         , text: 'Ventilator standby'                  } ],
      [ '20', { param: 'agemode'       , value: 'Adult mode'      , text: 'Adult device mode'                   } ],
      [ '21', { param: 'agemode'       , value: 'Neonatal mode'   , text: 'Neonatal device mode'                } ],
      [ '22', { param: 'co2unit'       , value: 'mmHg'            , text: 'CO2 unit mmHg'                       } ],
      [ '23', { param: 'co2unit'       , value: 'kPa'             , text: 'CO2 unit kPa'                        } ],
      [ '24', { param: 'co2unit'       , value: '%'               , text: 'CO2 unit is %'                       } ],
      [ '25', { param: 'inhal'         , value: 'Halothane'       , text: 'Halothane detected'                  } ],
      [ '26', { param: 'inhal'         , value: 'Enflurane'       , text: 'Enflurane detected'                  } ],
      [ '27', { param: 'inhal'         , value: 'Isoflurane'      , text: 'Isoflurane detected'                 } ],
      [ '28', { param: 'inhal'         , value: 'Desflurane'      , text: 'Desflurane detected'                 } ],
      [ '29', { param: 'inhal'         , value: 'Sevoflurane'     , text: 'Sevoflurane detected'                } ],
      [ '2A', { param: 'inhal'         , value: 'None'            , text: 'No Anaesthesia Gas detected'         } ],
      [ '2B', { param: 'ventmode'      , value: 'Man/Spont'       , text: 'Ventilationmode man./spont.'         } ],
      [ '2C', { param: 'language'      , value: ''                , text: 'Selected Language'                   } ],
      [ '34', { param: 'ventmode'      , value: 'PCV'             , text: 'Ventilationmode PCV'                 } ],
      [ '35', { param: 'ventmode'      , value: 'SPN-PPS'         , text: 'Ventilationmode SPN-PPS'             } ],
      [ '36', { param: 'ventmode'      , value: 'Fresh Gas'       , text: 'Ventilationmode FRESH GAS EXTERNAL'  } ],
      [ '37', { param: 'carrier'       , value: 'Air'             , text: 'Selected Carrier Gas is Air'         } ],
      [ '38', { param: 'carrier'       , value: 'N<sub>2</sub>O'  , text: 'Selected Carrier Gas is N2O'         } ],
      [ '3A', { param: 'agemode'       , value: 'Pediatric mode'  , text: 'Pediatric device mode'               } ], 
      [ '3B', { param: 'incuwarmermode', value: 'Manual mode'     , text: 'Manual mode'                         } ],
      [ '3C', { param: 'icuwarmeropen' , value: 'Open care'       , text: 'Open care therapy'                   } ],
      [ '3D', { param: 'bililuxmode'   , value: 'Photo on'        , text: 'Photo therapy on'                    } ],
      [ '3E', { param: 'ventmode'      , value: 'PC-PSV'          , text: 'Ventilationmode PC-PSV'              } ],
      [ '42', { param: 'gender'        , value: 'Female'          , text: 'Female patient gender'               } ],
      [ '43', { param: 'gender'        , value: 'Male'            , text: 'Male patient gender'                 } ],
      [ '45', { param: 'eeagentctrl'   , value: 'EE Agent control', text: 'End expiratory Agent control'        } ],
      [ '47', { param: 'ventmode'      , value: 'PC-AC'           , text: 'Ventilation mode PC-AC'              } ],
      [ '48', { param: 'airway'        , value: 'IV'              , text: 'Device configured for intubated patient ventilation'               } ],
      [ '49', { param: 'airway'        , value: 'NIV'             , text: 'Device configured for mask ventilation'                            } ],      
      [ '4A', { param: 'secInhal'      , value: 'Halothane'       , text: '2nd Agent Halothane detected'        } ],
      [ '4B', { param: 'secInhal'      , value: 'Enflurane'       , text: '2nd Agent Enflurane detected'        } ],
      [ '4C', { param: 'secInhal'      , value: 'Isoflurane'      , text: '2nd Agent Isoflurane detected'       } ],
      [ '4D', { param: 'secInhal'      , value: 'Desflurane'      , text: '2nd Agent Desflurane detected'       } ],
      [ '4E', { param: 'secInhal'      , value: 'Sevoflurane'     , text: '2nd Agent Sevoflurne detected'       } ],
      [ '4F', { param: 'secInhal'      , value: 'None'            , text: 'No 2nd Anesthesia Gas detected'      } ],
      
      // 50...
      
      [ '53', { param: 'leaktest'      , value: 'Leaktest'       , text: 'Device is performing leakage test'    } ],
      [ '54', { param: 'standby'       , value: 'Standby'        , text: 'Device is in Standby-Mode'            } ],      
      [ '56', { param: 'agentUnit'     , value: 'kPa'            , text: 'Selected Agent Unit is kPa'           } ],
      [ '57', { param: 'agentUnit'     , value: '%'              , text: 'Selected Agent Unit is %'             } ],      
      [ '58', { param: 'hlm'           , value: 'HLM'            , text: 'HLM Mode active'                      } ],      
      [ '59', { param: 'ventmode'      , value: 'Vol control'    , text: 'Volume controlled Ventilation Mode'   } ],
      [ '5A', { param: 'ventmode'      , value: 'Press control'  , text: 'Pressure controlled Ventilation Mode' } ],
      [ '5B', { param: 'ventmode'      , value: 'PSV'            , text: 'Pressure Support Mode'                } ],
      [ '5C', { param: 'psvadd'        , value: 'PSV added'      , text: 'Pressure Support added to intermittend Ventilation Mode'            } ],
      [ '5D', { param: 'sync'          , value: 'Synchronized'   , text: 'Synchronized intermittend Ventilation'                              } ],
      [ '5E', { param: 'autoflow'      , value: 'True'           , text: 'AutoFlow added to Volume Mode'        } ],
      
      [ '68', { param: 'tubetype'      , value: 'Endodracheal'   , text: 'Tube type endotracheal'               } ],
      [ '6D', { param: 'atcauto'       , value: 'Automatic'      , text: 'Automatic tube compensation (ATC) added to current ventilation mode' } ],
      [ '6E', { param: 'atctype'       , value: 'Exspiratory'    , text: 'Expiratory ATC enabled'               } ],
      [ '6F', { param: 'atctype'       , value: 'Inspiratory'    , text: 'Inspiratory ATC enabled'              } ],
      [ '70', { param: 'tubetype'      , value: 'Tracheostoma'   , text: 'Tube type tracheostoma'               } ],
      [ '71', { param: 'apneavent'     , value: 'Enabled'        , text: 'Apnea ventilation enabled'            } ],
      [ '76', { param: 'humid'         , value: 'Unheated'       , text: 'Active humid unheated'                } ],
      [ '78', { param: 'hme'           , value: 'HME / Filter'   , text: 'HME / Filter'                         } ],
      [ '9F', { param: 'trachpres'     , value: 'Enabled'        , text: 'Tracheal pressure calculation enabled as real-time value'            } ]
    ]),
    etx: 0x03
  },
  /**
   * @see{Medibus-Primus DeviceSettings} - (p.13)
   * @usedBy{settingsMessageResponse}    - (/model/medibus/settingsMessageResponse)
   * @usedBy{/param/settings}            - (/routes/param)
   **/
  settings: {
    o2:           '01',
    tidalvolume:  '04',
    insptime:     '05',
    frequency:    '0A',
    peep:         '0C',
    pps:          '12',
    pmax:         '13',
    insptime:     '27',
    flowtrigger:  '29',
    slopetime:    '2E',
    freshgas:     '2F',
    minfreq:      '42',
    pinsp:        '45',
    age:          '4A',
    weight:       '4B'
  }
};

module.exports = Object.freeze(bus);



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

const path         = require('path');
const EventEmitter = require('events');

const general = require(path.join(__dirname, '..', 'config',  'general'));
const win     = require(path.join(__dirname, '..', 'logger',  'logger'));
const monitor = require(path.join(__dirname, '..', 'monitor', 'monitor'));


/// //////////////////////////////////////////////////////////////////////// ///
/// Status levels
/// //////////////////////////////////////////////////////////////////////// ///

/// status.txt defines label of emitted events:
const status = Object.freeze({
  closed       : { val: 0, level: 'port', txt: 'closed',        label: 'Closed'       },
  inactive     : { val: 1, level: 'bus' , txt: 'inactive',      label: 'Inactive'     },
  listen       : { val: 2, level: 'bus' , txt: 'listen',        label: 'Listen'       },
  stopping     : { val: 3, level: 'bus' , txt: 'stopping',      label: 'Stopping'     },
  initialising : { val: 4, level: 'bus' , txt: 'initialising',  label: 'Initializing' },
  protocol     : { val: 5, level: 'com' , txt: 'protocol',      label: 'Protocol'     }
});

const handshake = Object.freeze({
  resume       : { val: 0, txt : 'Resume'  },
  suspend      : { val: 1, txt : 'Suspend' },
  abort        : { val: 2, txt : 'Abort'   }
});


class StatusController extends EventEmitter {
  
  #status
  #handshake
  #summary

  constructor(){
    super()
    this.#status    = status.closed;
    this.#handshake = handshake.resume;
    
    this.#summary = {
      create:   new Date(),
      uptime:   0
    };
    
  }
  
  
  /// ////////////////////////////////////////////////////////////////////// ///
  /// Status
  /// ////////////////////////////////////////////////////////////////////// ///
  
  get status () { return this.#status;       }
  get level  () { return this.#status.level; }
  
  /**
   * @usedBy{Ventilation.getValueObject} (/model/data/ventilation)
   **/
  get text   () { return this.#status.txt;   }
  get label  () { return this.#status.label; }
  toString   () { return this.#status.txt;   }
  get summary() {
    this.#summary.uptime = Math.floor( (Date.now() - this.#summary.create) / 1000 )
    return this.#summary;
  }
  
  /// Defines whether an appropriate response will be sent upon ICC
  get listen () { return this.#status.val >= status.listen.val; }
  
  /// When false, the next outgoing messsage will be a STOP
  get sending ()  { return this.#status.val > status.initialising.val; }
  get stopping () { return this.#status.val == status.stopping.val; }
 
  set status(s) { this.setStatus(s); }
  
  setStatus = (s) => {
    switch(s.val){      
      case status.protocol.val:
        this.#status = status.protocol;
        break;
        
      case status.listen.val:
        this.#status = status.listen;
        break;
        
      case status.initialising.val:
        this.#status = status.initialising;
        break;
        
      case status.stopping.val:
        /// Called upon /port/stop
        this.#status = status.stopping;
        break;
        
      case status.inactive.val:
        this.#status = status.inactive;
        break;
        
      case status.closed.val:
        /// Called by portController.handlePortClosed
        this.#status = status.closed;
        break;
        
      default:
        this.#status = status.closed;
    }
    win.def.log({ level: 'info', file: 'statusController', func: 'set status', message: `New status: ${this.#status.txt}`});
    monitor.comMsg('status', `Com Status: ${this.#status.txt}`, this.status);
    this.emit(this.#status.txt, this.#status);
    
    return this.#status;
  }
  

  
  /// ////////////////////////////////////////////////////////////////////// ///
  /// Handshake
  /// ////////////////////////////////////////////////////////////////////// ///
  
  get handshake() { return this.#handshake; }
  
  setHandshake = (h) => {
    switch(h.val){
              
      case handshake.suspend:
        this.#handshake = handshake.suspend;
        break;
        
      case handshake.abort:
        this.#handshake = handshake.abort;
        break;
        
      default:
        this.#handshake = handshake.resume;
    }
    win.def.log({ level: 'verbose', file: 'statusController', func: 'set handshake', message: `New handshake: ${this.#handshake.txt}`});
    monitor.portMsg('handshake', `Port Status: ${this.#handshake.txt}`);
    this.emit(this.#handshake.txt, this.#handshake);
    
    return this.#handshake;
  }
}

const controller = new StatusController()

module.exports = {
  status: status,
  handshake: handshake,
  controller: controller
}

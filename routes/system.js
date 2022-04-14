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
 
const express = require('express');
const path = require('path');
const os = require('os');

const General = require(path.join(__dirname, '..', 'config', 'general'));

const router = express.Router();

router.get('/', function(request, result, next){
  result.status(200).json({
    interface: General.interface,
    arch: os.arch(),
    cpus: os.cpus(),
    endianess: os.endianness(),
    eol: os.EOL,
    freemem: os.freemem(),
    hostname: os.hostname(),
    networkInterfaces: os.networkInterfaces(),
    platform: os.platform(),
    release: os.release(),
    totalmem: os.totalmem(),
    type: os.type(),
    uptime: os.uptime()
  });
});


module.exports = router;

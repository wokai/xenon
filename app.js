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

/// ////////////////////////////////////////////////////////////////////////////
/// A Setup
/// ////////////////////////////////////////////////////////////////////////////

/// A.1 Logger
const morgan  = require('morgan');
const colors  = require('colors/safe');
const format  = require("dateformat");
const Stream  = require('stream');

const express = require('express');
const http    = require('http');
const path    = require('path');
const fs      = require('fs');

const app = express();


/// //////////////////////////////////////////////////////////////////////// ///
/// Logger
/// //////////////////////////////////////////////////////////////////////// ///

const win = require('./logger/logger');

/// //////////////////////////////////////////////////////////////////////// ///
/// morgan
/// //////////////////////////////////////////////////////////////////////// ///

/// Daily rotating write stream
const filename = `morgan_${format(new Date(), 'yyyy-mm-dd')}.log`;
const log = fs.createWriteStream(path.join(__dirname, 'logfiles', filename), { flags: 'a' })
app.use(morgan(':method :url :status :res[content-length] - :response-time ms', { 
  stream: log
}));

/// Colored morgan output on console:
app.use(
  morgan(function (tokens, req, res) {
    return [
      colors.green(tokens.method(req, res)),
      colors.yellow(tokens.url(req, res)),
      colors.green(tokens.status(req, res)),
      colors.yellow(' -' + (tokens.res(req, res, 'content-length') | '' ) + '-'),
      colors.cyan(tokens['response-time'](req, res) + ' ms')
    ].join(' ')
  })
);


/// ////////////////////////////////////////////////////////////////////////////
/// Object instantiation
/// ////////////////////////////////////////////////////////////////////////////

const { eventLoop } = require('./bus/eventLoop');
const runtime       = require('./model/runtime');

/// ////////////////////////////////////////////////////////////////////////////
/// Create HTTP and IO server.
/// ////////////////////////////////////////////////////////////////////////////

/// Creation of HTTP server moved here from www-file because creation of IO-Socket
/// requires server instance.
const socket = require('./monitor/socket');
const server = http.createServer(app);
socket.connect(server);


/// Must be loaded after init of socket connection.
const index_router  = require(path.join(__dirname, 'routes', 'index'));
const port_router   = require(path.join(__dirname, 'routes', 'port'));
const io_router     = require(path.join(__dirname, 'routes', 'socket'));
const data_router   = require(path.join(__dirname, 'routes', 'data'));
const com_router    = require(path.join(__dirname, 'routes', 'com'));
const system_router = require(path.join(__dirname, 'routes', 'system'));
const param_router  = require(path.join(__dirname, 'routes', 'param'));
const epi_router    = require(path.join(__dirname, 'routes', 'episode'));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index_router);
app.use('/port', port_router);
app.use('/data', data_router);
app.use('/io', io_router);
app.use('/com', com_router);
app.use('/system', system_router);
app.use('/param', param_router);
app.use('/episode', epi_router);

/// Bootstrap
app.use('/jquery',    express.static(path.join(__dirname, 'node_modules', 'jquery', 'dist')));
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules', 'bootstrap', 'dist')));
app.use('/css',       express.static(path.join(__dirname, 'node_modules', 'bootstrap', 'dist', 'css')));
app.use('/feather',   express.static(path.join(__dirname, 'node_modules', 'feather-icons', 'dist')));
app.use('/angular',   express.static(path.join(__dirname, 'node_modules', 'angular')));
app.use('/icons',     express.static(path.join(__dirname, 'node_modules', 'bootstrap-icons', 'icons')));
app.use('/socket',    express.static(path.join(__dirname, 'node_modules', 'socket.io', 'client-dist')));



/// ////////////////////////////////////////////////////////////////////////////
/// Error Handling
/// ////////////////////////////////////////////////////////////////////////////
app.use((err, req, res, next) => {
  /// Eventually log errors here ... ?
  console.log(colors.brightRed('[app.js] Error caught: %s'), err.stack);
  res.status(500).send(err.stack);
});


process.on('uncaughtException', error => {  
    console.error(colors.brightRed(`[Process] Error: ${error.message}\n[Process] Exit.`));
    console.error(error)
    process.exit(1);
});
process.on('unhandledRejection', error => {  
    console.error(colors.brightRed(`[Process] unhandledRejection: ${error.message}\n[Process] Exit.`.brightRed));
    console.error(error)
    process.exit(1);
});

process.on('SIGTERM', () => { console.log(`[Process] SIGTERM`.green) });

/*
/// Generated by ctrl + C
/// See: 
/// https://www.gnu.org/software/libc/manual/html_node/Termination-Signals.html
process.on('SIGINT' , () => { 
  console.log(`[Process] SIGINT`.green);
  server.close(() => {
    console.log('HTTP server closed'.green)
  })
  
});
*/

module.exports = {
  app: app, 
  server: server 
};

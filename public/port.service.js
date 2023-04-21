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

(function(angular) {
'use strict';

var app = angular.module('globalModule');

/// ////////////////////////////////////////////////////////////////////////////
/// A Definition of Service
/// ////////////////////////////////////////////////////////////////////////////

app.factory('PortService', function($http, $rootScope, $timeout, $q) {
  
  /// ////////////////////////////////////////////////////////////////////// ///
  /// Parameter set loaded once from server (when config is null)
  /// { preset, select, devices }
  /// ////////////////////////////////////////////////////////////////////// ///
  var config = null;
  
  var params = {};
  var paths = [];
  
  
  /// Current client side communication parameters
  /// path, baudRate, parity, stopBits, dataBits
  var current = {};
  
  /// Current server side communication parameters
  /// open, path, baudRate, dataBits, parity, stopBits
  var portStatus = {};

  /// Communication status: Status of Medibus communication protocol
  /// as maintained by StatusController
  var comStatus = {};


  /// //////////////////////////////////////////////////////////////////////////
  /// Notification
  /// //////////////////////////////////////////////////////////////////////////
  
  
  /// Used to set a complete parameter set
  const updateParams = (p) => {
    current.path     = p.path;
    current.baudRate = p.baudRate;
    current.dataBits = p.dataBits;
    current.parity   = p.parity;
    current.stopBits = p.stopBits;
  }
  
  
  /// Clients will be notified of parameter changes (from inside portService)
  const notifyPortStatus = () => { $rootScope.$emit('port:status', portStatus); }
  const notifyComStatus  = () => { $rootScope.$broadcast('com:status',  comStatus); }

  /// //////////////////////////////////////////////////////////////////////////
  /// Default settings downloaded once from server
  /// //////////////////////////////////////////////////////////////////////////
  
  const getConfig = () => {
    const q = $q.defer();
    
    if(config){
      q.resolve(config)
    } else {
      $http.get('/port/defaults')
        .then((response) => {
          /// { preset, select, devices }
          config = response.data;
          q.resolve(config)
          console.log(`[PortService] getConfig. Status: ${response.status} | Text: ${response.statusText}`)
        }, (response) => {
          q.reject(response);
          console.log(`[PortService] getConfig. Status: ${response.status} | Text: ${response.statusText}`)
        });
    }
    return q.promise;
  }
  
  
  /// //////////////////////////////////////////////////////////////////////////
  /// Port data
  /// //////////////////////////////////////////////////////////////////////////
  
  /// Used by globalCtrl for Socket-notifications
  const setPortStatus = (status) => { 
    portStatus = status;
    notifyPortStatus();
  }
  
  const setComStatus = (status) => {
    comStatus = status;
    notifyComStatus();
  }
  
  /// //////////////////////////////////////////////////////////////////////////
  /// Paths as maintained by node SerialPort object
  /// //////////////////////////////////////////////////////////////////////////
  const getPaths = function() {
    const q = $q.defer();
    $http.get('/port/paths')
      .then((response) => {
        q.resolve(response.data)
        console.log(`[PortService] getPaths. Status: ${response.status} | Text: ${response.statusText}`)
      }, (response) => {
        q.reject(response)
        console.log(`[PortService] getPaths. Status: ${response.status} | Text: ${response.statusText}`)
      });
    return q.promise;
  }
  

  
  /// ////////////////////////////////////////////////////////////////////// ///
  /// Updates serial port communication settings:
  /// 1) Port must be open. Otherwise update rejects
  /// 2) Parameters: baudRate, dataBits, parity, stopBits
  /// ////////////////////////////////////////////////////////////////////// ///
  
  const uploadParams = (params) => {
    
    updateParams(params);
    
    console.log('[port.service] uploadParams. Path: ', current.path.path,
      ', Baud-Rate: ', current.baudRate,
      ', Data-Bits: ', current.dataBits,
      ', Parity   : ', current.parity,
      ', stopBits : ', current.stopBits);
    
    $http.post('/port/params', {
        baudRate: parseInt(current.baudRate),
        dataBits: parseInt(current.dataBits),
        parity  : current.parity,
        stopBits: parseInt(current.stopBits)
      }).then(function(response){
        console.log(`[PortService] uploadParams. Status: ${response.status} | Text: ${response.statusText}`)
        portStatus = response.data.status;
        /// No further action required because Port-Status-Indicator will be notified via socket.
      }, function(response) {
        // ToDo: Indicate error ...
        console.log(`[PortService] uploadParams. Status: ${response.status} | Text: ${response.statusText} | Reason: ${response.data.text}`)
        portStatus = response.data.status;
        notifyParam();
    })
  }
  
  const downloadPortStatus = () => {
    $http.get('/port/status')
      .then((response) => {
        /// open, openText, path: { path }, baudRate, dataBits, parity, stopBits
        portStatus = response.data;
        console.log(`[PortService] downloadPortStatus. Status: ${response.status} | Text: ${response.statusText}`)
        notifyPortStatus();
      }, (response) => {
        console.log(`[PortService] downloadPortStatus. Status: ${response.status} | Text: ${response.statusText}`)
      });
  }
  downloadPortStatus()
  
  const downloadComStatus = () => {
    $http.get('/com/status')
      .then((response) => {
        comStatus = response.data;
        console.log(`[PortService] downloadComStatus. Status: ${response.status} | Text: ${response.statusText}`)
        notifyComStatus();
      }, (response) => {
        console.log(`[PortService] downloadComStatus. Status: ${response.status} | Text: ${response.statusText}`)
      });
  }
  downloadComStatus();
  
  /// ////////////////////////////////////////////////////////////////////// ///
  /// Re-creates serial-port object using current set of parameters
  /// As this would automatically close the serial connection, the
  /// init-button is disabled when port is open.
  /// ////////////////////////////////////////////////////////////////////// ///
  
  const initialisePort = (params) => {
    
    updateParams(params);
    
    $http.post('/port/init', {
      path    : current.path.path,
      baudRate: parseInt(current.baudRate),
      dataBits: parseInt(current.dataBits),
      parity  : current.parity,
      stopBits: parseInt(current.stopBits)
    }).then(function(response) {
      portStatus = response.data.status;
      notifyPortStatus();
      console.log(`[PortService] initialisePort. Status: ${response.status} | Text: ${response.statusText}`)
    }, function(response) {
      console.log(`[PortService] initialisePort. Status: ${response.status} | Text: ${response.statusText}`)
    })
  }
  
  /// //////////////////////////////////////////////////////////////////////////
  /// Port status
  /// //////////////////////////////////////////////////////////////////////////
  
  const openPort = function() {
    $http.get('/port/open')
    .then(function(response) {
        /// { status, text, open }
        console.log(`[PortService] openPort. Status: ${response.status} | Text: ${response.statusText} | Reason: ${response.data.text}`)
      }, function(response) {
        console.log(`[PortService] openPort. Status: ${response.status} | Text: ${response.statusText} | Reason: ${response.data.text}`)
      })
  };
  
  const stopCom = function() {
    $http.get('/port/stop')
    .then(function(response) {
      console.log(`[PortService] stopCom. Status: ${response.status} | Text: ${response.statusText}`)
    }, function(response) {
    })
    .catch(function(error){
    })
  }

  const closePort = function() {
    $http.get('/port/close')
    .then(function(response){
        console.log(`[PortService] closePort. Status: ${response.status} | Text: ${response.statusText}`)
      }, function(response) {
        console.log(`[PortService] closePort. Status: ${response.status} | Text: ${response.statusText}`)
    })
  };

  
  
  /// //////////////////////////////////////////////////////////////////////////
  /// Exported object
  /// //////////////////////////////////////////////////////////////////////////
  
  return {
    setPortStatus: setPortStatus,
    getPortStatus: () => { return portStatus; },
    setComStatus:  setComStatus,
    getComStatus:  () => { return comStatus; },
    getConfig: getConfig,
    getCurrent: () => { return current; },
    getPaths: getPaths,
    uploadParams: uploadParams,
    initialisePort: initialisePort,
    downloadPortStatus: downloadPortStatus, 
    openPort: openPort,
    closePort: closePort,
    stopCom: stopCom,
    status: status
  }

});  /// PortService


/// ////////////////////////////////////////////////////////////////////////////
/// B Components
/// ////////////////////////////////////////////////////////////////////////////


/// Usage:  <rg-indicator data="status.open"></rg-indicator>
app.component('rgIndicator', {
  template: '<div class="{{bgclass}} mt-1 mr-3" style="height:{{size}}px; width:{{size}}px; border-radius:50%; display: inline-block;"></div>',
  bindings: { data: '<' },
  controller: function($scope, $element){
    var true_class = 'bg-success';
    var false_class= 'bg-danger';
    $scope.size = 15;   
    var attr = $element.attr("data");
    /// Inbound listener
    $scope.$parent.$watch(attr, newVal => {
      if(newVal)  { $scope.bgclass = true_class; } 
      else        { $scope.bgclass = false_class; }
    });
  }
});


app.component('controlButtonGroup', {
  templateUrl: 'controlButtonGroup.html',
  controller: function($scope, $rootScope, PortService) {

    $scope.portStatus = {};
    $scope.$on('$destroy', $rootScope.$on('port:status', (status) => {
        $scope.portStatus = PortService.getPortStatus();
    }));
    
    $scope.openPort       = PortService.openPort;
    $scope.closePort      = PortService.closePort;
    $scope.stopCom        = PortService.stopCom;
  }
});


app.component('serialPortConfig', {
  templateUrl: 'serialPortConfig.html',
  controller: function($scope, $rootScope, PortService) {
    
    $scope.config = {};
    $scope.current = {};
    $scope.portStatus = {};
    
    /// User selects device
    $scope.onDeviceUpdate = () => {
      $scope.current.baudRate = $scope.device.baudRate;
      $scope.current.parity   = $scope.device.parity;
      $scope.current.stopBits = $scope.device.stopBits;
      $scope.current.dataBits = $scope.device.dataBits;
    }
    
    /// Defaults as defined in /config/port.js
    PortService.getConfig()
      .then((config) => { 
          $scope.config = config; 
          $scope.devices = config.devices;
          $scope.device = config.devices[0];
          $scope.onDeviceUpdate();
        }, 
        (reject) => { /* ToDo ?? */ }
      );
    
    
    $scope.getPaths = () => {
      PortService.getPaths()
        .then(paths => { 
          $scope.paths = paths;
          if($scope.paths.length) {
            $scope.current.path = $scope.paths[0];
          } else {
            $scope.current.path = null;
          }
        }, (reject) => {
          /* ToDo ?? */
          $scope.paths = [];
          $scope.current.path = null;
        });
    }
    $scope.getPaths();
    

    $scope.$on('$destroy', $rootScope.$on('port:status', (status) => {
        $scope.portStatus = PortService.getPortStatus();
    }));
    
    $scope.initialisePort = () => {
      PortService.initialisePort($scope.current);
    }
    
    $scope.setParams = () => {
      PortService.uploadParams($scope.current);
    }
    
    $scope.status         = PortService.status;
    $scope.openPort       = PortService.openPort;
    $scope.closePort      = PortService.closePort;
    $scope.stopCom        = PortService.stopCom;
  }
});


app.component('portStatusRow', {
  templateUrl: 'portStatusRow.html',
  controller: function($scope, $rootScope, PortService){
    $scope.$on('$destroy', $rootScope.$on('port:status', () => { 
      $scope.portStatus = PortService.getPortStatus();
    }));
  }
});

app.component('portOpenIndicator', {
  template: '<span class="text-success" ng-if="portStatus.open" >{{ portStatus.openText }}</span><span class="text-danger" ng-if="!portStatus.open">{{ portStatus.openText }}</span>',
  controller: function($scope, $rootScope, PortService){
    $scope.$on('$destroy', $rootScope.$on('port:status', () => { 
      $scope.portStatus = PortService.getPortStatus();
    }));
  }
});

app.component('portStatusIndicator', {
  templateUrl: 'portStatusIndicator.html',
  controller: function($scope, $rootScope, PortService) {
    
    $scope.title = 'Port status indicator';
    
    /// Colouring of comStatus
    $scope.colors = [
      'text-secondary', /// closed
      'text-dark',      /// inactive
      'text-warning',   /// listen
      'text-primary',   /// stopping
      'text-danger',    /// initializing
      'text-success',   /// Protocol
      'text-info',      /// Message
    ];
    
    $scope.$on('$destroy', $rootScope.$on('port:status', () => { 
      $scope.portStatus = PortService.getPortStatus();
    }));
    
    $scope.$on('$destroy', $scope.$on('com:status', () => {
      $scope.comStatus = PortService.getComStatus();
    }));
  }
});


})(window.angular); /// function(angular)



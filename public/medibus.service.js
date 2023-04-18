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

(function(angular) {
'use strict';

var app = angular.module('globalModule');

/// ////////////////////////////////////////////////////////////////////////////
/// A Definition of Service
/// ////////////////////////////////////////////////////////////////////////////

/// ------------------------------------------------------------------------ ///
/// A.1 MedibusService
/// ------------------------------------------------------------------------ ///

app.factory('MedibusService', function($http, $rootScope) {
  
  const data = {
      device : {
      id : 'Device id',
      name : 'Device name',
      device : '00.00',
      medibus : '00.00',
      date : 'dd.mmm.yy',
      time : 'hh:mm:ss'
    },
    vent: {}
  }
  
  const device = {
    id : 'Device id',
    name : 'Device name',
    devRevision : '00.00',
    busRevision : '00.00',
    date : 'dd.mmm.yy',
    time : 'hh:mm:ss'
  };
  
  const busStatus = {
    messageId: 0,
    lastmessage: 'hh:mm:ss'
  }
  
  const currentCp1Alarms = [];
  
  const setDeviceData = function(data) {
    device.id = data.id;
    device.name = data.name;
    device.devRevision = data.devRevision;
    device.busRevision = data.busRevision;
  }
  
  /**
   * Request current codepage 1 alarms
   * @source{CurrentAlarms.getAlarmArray} (/model/data/alarm) 
   **/
  let getCurrentCp1Alarms = function() {
    $http.get('/data/alarm/cp1')
    .then(function(response) {
      currentCp1Alarms.length = 0;
      currentCp1Alarms.push(...response);
    }, function(response) {
      currentCp1Alarms.length = 0;
    })
    .catch(function(error) {
      currentCp1Alarms.length = 0;
      console.log('[MedibusService] getCurrentCp1Alarms Error: ', error)
    });
  }
  
  var getDeviceData = function() {
    $http.get('/data/device')
    .then(function(response) {
        device.id = response.data.id;
        device.name = response.data.name;
        device.devRevision = response.data.devRevision;
        device.busRevision = response.data.busRevision;
      }, function(response) {
        console.log('[MedibusService] getDeviceData: ', response.data.status, 'Message: ', response.data.message);
      })
    .catch(function(error){
      console.log('[MedibusService] getDeviceData Error: ', error);
    })
  };
  getDeviceData();
  
  const setDateTime = function(data) {
    device.date = data.date;
    device.time = data.time;
  }
  
  var getDateTime = function() {
    $http.get('/data/datetime')
      .then(function(response) {
          device.date = response.data.date;
          device.time = response.data.time;
        }, function(response) {
          console.log('[MedibusService] getDateTime: ', response.data.status, 'Message: ', response.data.message);
        })
      .catch(function(error) {
        console.log('[MedibusService] getDateTime Error: ', error);
      });
  }
  getDateTime()
  
  /**
   * @source{Monitor.dataMsg} - {Ventilation.getValueObject}
   * @see   {http://localhost:4000/data/vent}
   **/
  var getVentData = function() {
    $http.get('/data/vent')
      .then(function(response) {
          data.vent = response.data;
          console.log('[MedibusService] getVentData. Date: ', response.data.time.date, ', Time: ', response.data.time.time);
        }, function(response) {
          console.log('[MedibusService] getVentData. Notification');
        })
      .catch(function(error){
        console.log('[MedibusService] getVentData Error: ', error);
      });
  }
  getVentData();
  
  /**
   * @used{index.html} - (socket.on | io.data)
   * @source{Monitor.dataMsg} - {Ventilation.getValueObject} - (/model/data/ventilation)
   * @see   {http://localhost:4000/data/vent}
   **/
  const setVentData = function(vent) { 
    busStatus.messageId = vent.msgId;
    busStatus.lastmessage = new Date(vent.time).toLocaleTimeString();
    data.vent = vent;
  }  
  
  var getAlarmData = function(){
    $http.get('/data/alarm/limits')
      .then(function(response) {
        data.alarm = response.data;
        console.log('[MedibusService] getAlarmData. Date: ', response.data.date, ', Time: ', response.data.time);
      }, function(response){
         console.log('[MedibusService] getAlarmData. Notification');
      }).catch(function(error) {
        console.log('[MedibusService] getAlarmData Error: ', error);
      });
  }
  getAlarmData();
  
  
  /// ////////////////////////////////////////////////////////////////////// ///
  /// Temporal datasets
  /// ////////////////////////////////////////////////////////////////////// ///
  var temp = {
    data: {
      time: [],
      tidalvolume: [],
      fio2: [],
      feco2: [],
      isoflurane: []
    }
  };

  
  /// //////////////////////////////////////////////////////////////////////////
  /// Exported object
  /// //////////////////////////////////////////////////////////////////////////
  return {
    data: data,
    device: device,
    busStatus: busStatus,
    setDeviceData: setDeviceData,
    getDeviceData: getDeviceData,
    getDateTime: getDateTime,
    setDateTime: setDateTime,
    getVentData: getVentData,
    getAlarmData: getAlarmData,
    setVentData: setVentData,
    getTemp: function() { return temp; }
  }

});  /// MedibusService


/// ////////////////////////////////////////////////////////////////////////////
/// B Components
/// ////////////////////////////////////////////////////////////////////////////

app.directive('parseHtml', function() {
  return {
    restrict: 'A',
    scope: {},
    link: function(scope, element, attr) {
      element.append(angular.element(`<span>${attr.parseHtml}<span>`));
    }
  }
});


/// ------------------------------------------------------------------------ ///
/// B.1 Device Status indicator
/// ------------------------------------------------------------------------ ///

app.component('deviceNameIndicator', {
  template: '<span>{{ device.name }}</span>',
  controller: function($scope, MedibusService) {
    $scope.device =  MedibusService.device;
  }
});

app.component('deviceStatusIndicator', {
  templateUrl: 'deviceStatusIndicator.html',
  controller: function($scope, MedibusService) {
    $scope.device =  MedibusService.device;
    $scope.title = 'Device status indicator';
  }
});


app.component('busStatusIndicator', {
  templateUrl: 'busStatusIndicator.html',
  controller: function($scope, MedibusService) {
    $scope.busStatus = MedibusService.busStatus;
    $scope.title = 'Bus status: Last incoming message'
  }
});


app.component('alarmStatusIndicator', {
  templateUrl: 'alarmStatusIndicator.html',
  controller: function($scope, MedibusService) {
    $scope.title = 'Current alarms';
    
    /**
     * @content{data.vent.alarm.cp1}
     * @source (data) {Ventilation.getValueObject()} - (/model/data/ventilation)
     * @source (alarm){AlarmPeriod.dataObject}       - (/model/data/alarm)
     **/
    $scope.data = MedibusService.data;
  }
});

app.component('currentAlarmNumber', {
  template: '<span>{{ data.vent.alarm.cp1.length }}</span>',
    controller: function($scope, MedibusService) {    
    /**
     * @content{data.vent.alarm.cp1}
     * @source (data) {Ventilation.getValueObject()} - (/model/data/ventilation)
     * @source (alarm){AlarmPeriod.dataObject}       - (/model/data/alarm)
     **/
    $scope.data = MedibusService.data;
  }
});

/// ------------------------------------------------------------------------ ///
/// B.2 Ventilation parameters
/// ------------------------------------------------------------------------ ///

app.component('ventParam', {
  templateUrl: 'ventParam.html',
  controller: function($scope, MedibusService) {
    $scope.data = MedibusService.data;
  }
});


app.component('txtStatusParam', {
  templateUrl: 'txtStatusParam.html',
  controller: function($scope, MedibusService) {
    $scope.data = MedibusService.data;
  }
});

app.component('ventModeIndicator', {
  template: '<span>{{ data.vent.text.ventmode.text }}</span>',
  controller: function($scope, MedibusService) {
    $scope.data = MedibusService.data;
  }
});

app.component('settingsParam', {
  templateUrl: 'settingsParam.html',
  controller: function($scope, MedibusService) {
    $scope.data = MedibusService.data;
  }
});


app.component('settingsIdIndicator', {
  template: '<span>ID {{ data.vent.settings.msgId }}</span>',
  controller: function($scope, MedibusService) {
    $scope.data = MedibusService.data;
  }
});

app.component('settingsTimeIndicator', {
  template: "<span>Time {{ data.vent.settings.time | date:'HH:mm:ss' }}</span>",
  controller: function($scope, MedibusService) {
    $scope.data = MedibusService.data;
  }
});


app.component('alarmParam', {
  templateUrl: 'alarmParam.html',
  controller: function($scope, MedibusService){
    $scope.data = MedibusService.data;
  }
});

app.component('paramLimited', {
  templateUrl: 'paramLimited.html',
  bindings: { param: '=', label: '@', unit: '@'},
  controller: function($scope) {}
});

app.component('anaesthParam', {
  templateUrl: 'anaesthParam.html',
  controller: function($scope,  MedibusService){
    $scope.data = MedibusService.data;
  }
});

app.component('evitaParam', {
  templateUrl: 'evitaParam.html',
  controller: function($scope, MedibusService){
    $scope.data = MedibusService.data;
  }
});


})(window.angular); /// function(angular)




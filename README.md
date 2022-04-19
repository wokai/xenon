# Header

 - Xenon: Query Dräger Medibus via NodeJs
 - Date: 14.04.2022


--------------------------------------------------------------------------------

<!--- --------------------------------------------------------------------- --->
# Dräger Medibus
<!--- --------------------------------------------------------------------- --->

Dräger Medibus is a communication protocol by which Dräger medical devices 
provide data via RS232.

Devices which support Dräger Medibus include Anesthesia devices (Dräger Primus)
and intensive care ventilators (Dräger evita).

<!--- --------------------------------------------------------------------- --->
# NodeJs
<!--- --------------------------------------------------------------------- --->

NodeJs is an open-source platform which executes JavaScript outside Browsers.
With concepts of asynchronous programming, streams, the
[serialport](https://www.npmjs.com/package/serialport) package and 
definition of a REST-Api via [express](https://www.npmjs.com/package/express),
the NodeJs platform provides tools for the implementation of a communication
interface.

<!--- --------------------------------------------------------------------- --->
# Xenon
<!--- --------------------------------------------------------------------- --->

Xenon provides a HTTP server which allows starting and stopping communication
via Medibus protocol. The device can be controlled and queried via REST.
A HTTP endpoint with a AngularJS single page application provides a user 
interface.

This implementation still is preliminary and under construction.
Suggestions for further development are welcome.

Xenon can be installed on localhost or a second system, which should be
reachable via network.
The system is designed to work on a lightweight system (such as *Raspberry pi*). 


## Setup instruction



 - Download project
 - Run `npm install`
 - Connect your system to a Dräger Medibus (RS232) port 
    - Use a standard USB to RS232 cable
    - On a Linux system, the device will be visible on path `/dev/ttyUSB0`
 - Running `npm start` will launch the system
 - Per default, the system will listen to port 4000
 - There are standard parameter sets for Dräger Primus and Dräger Evita configured
 - Open port and watch the incoming data
 - Close port in order to avoid `COM1 error` messages on the Dräger device


<!--- --------------------------------------------------------------------- --->
# See also
<!--- --------------------------------------------------------------------- --->

There are two other repositories which shall extend the functionality of
this software package:

 - [Thalas](https://github.com/wokai/thalas), a NodeJs backend which facilitates
    remote control of multiple *Xenon* instances along with scheduled queries
    and storage of data in a MySql database (under construction).
 - [ngThalas](https://github.com/wokai/ngThalas), an Angular frontend for 
  *Thalas* (under construction).

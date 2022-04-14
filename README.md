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
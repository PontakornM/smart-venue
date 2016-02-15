var App = angular.module('webApp', ['btford.socket-io']);
var audio = new Audio("ding.wav");


var socketX = io.connect("http://172.30.80.19:8000");

socketX.emit('setID', {uuid: 'B9407F30F5F8466EAFF925556B57FE6D'});

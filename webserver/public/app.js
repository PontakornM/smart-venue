var App = angular.module('webApp', ['btford.socket-io']);
var audio = new Audio("ding.wav");


var socketX = io.connect("http://172.30.80.123:8000");

socketX.emit('setID', {uuid: '0X001'});

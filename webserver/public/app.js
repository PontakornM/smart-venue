var App = angular.module('webApp', ['btford.socket-io']);
var audio = new Audio("ding.wav");


var socketX = io.connect("http://172.30.80.20:8000");

socketX.emit('setID', {uuid: '2F234454CF6D4A0FADF2F4911BA9FFA6'});

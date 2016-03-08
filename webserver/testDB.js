
var databases = '172.30.80.56:27017/svdb';
var collection = 'registar';
// var express = require('express');
// var server = require('http').Server(app);
var socket = require('socket.io-client').connect('http://172.30.88.96:9000');


socket.on('DataService',function(docs){
  console.log(docs);
});


// var item =  { type: 1, zone: "A"};
// var item =  {uuid : "0X005", type: 1, zone: "B"};

var user = {uuid : "0X001", type: 0, zone: "C"};
// socket.emit('InsertDataService',user);

// var db = require('mongojs')('172.30.80.56:27017/svdb',['registar']);
//

//
// // db.registar.insert(item);
// // console.log(db);
// db.registar.find(function(err, docs){
// console.log("Hello");
// })

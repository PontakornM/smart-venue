
var databases = '172.30.80.56:27017/svdb';
var collection = 'registar';
// var express = require('express');
// var server = require('http').Server(app);
var socket = require('socket.io-client').connect('http://localhost:9000');


  socket.on('DataService',function(docs){
    console.log(docs);
  });


// var item =  { type: 1, zone: "A"};
var item =  {uuid : "0X003", type: 1, zone: "C"};

// var user = {uuid : "0X001", type: 0, zone: "A"};
socket.emit('InsertDataService',item);

// var db = require('mongojs')('172.30.80.56:27017/svdb',['registar']);
//

//
// // db.registar.insert(item);
// // console.log(db);
// db.registar.find(function(err, docs){
// console.log("Hello");
// })

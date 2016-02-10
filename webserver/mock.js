var dbName = 'svdb'
var collection = 'registrar'

var db = require('mongojs')(dbName,[collection]);
var moment = require('moment');

var mockData = [
  {uuid : "0X001", type: 0, zone: "A", timeStamp: moment().format()},
  {uuid : "0X002", type: 0, zone: "A", timeStamp: moment().format()},
  {uuid : "0X003", type: 1, zone: "A", timeStamp: moment().format()},
  {uuid : "0X004", type: 0, zone: "B", timeStamp: moment().format()},
  {uuid : "0X005", type: 1, zone: "B", timeStamp: moment().format()},
]

var item =  {uuid : "0X006", type: 1, zone: "B", timeStamp: moment().format()};
console.log(moment().format());


// db.registrar.find(function (err, docs) {
//
// })
  // db.registrar.insert(mockData);
  // db.registrar.insert(item);
  db.registrar.update({uuid: '0X001'},{ $set : { zone: "B" , timeStamp: moment().format()} });
  // db.registrar.update({uuid: '0X005'},{ $set : { zone: "B" , timeStamp: moment().format()} });

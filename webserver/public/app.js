var App = angular.module('webApp', ['btford.socket-io']);


var links = {
  monalisa: "http://www.proprofs.com/games/puzzle/sliding/resize_image.php?image=http://to55er.files.wordpress.com/2009/05/mona-lisa.jpg&new_width=450",
  impresssunrise: "http://blogs.longwood.edu/incite/files/2012/01/Monet-Impression-Sunrise1.png"
}

// var data = [
//   {uuid:"FFFFFFFFFFFF00X1",zone:'A',title:"Monalisa",painter:"Leonado Di caprio",img:links.monalisa,},
//   {uuid:"FFFFFFFFFFFF00X1",zone:'A',title:"Monalisa",painter:"Leonado Di caprio",img:links.monalisa,},
//   {uuid:"FFFFFFFFFFFF00X1",zone:'A',title:"Monalisa",painter:"Leonado Di caprio",img:links.monalisa,},
//   {uuid:"FFFFFFFFFFFF00X1",zone:'A',title:"Monalisa",painter:"Leonado Di caprio",img:links.monalisa,},
//   {uuid:"FFFFFFFFFFFF00X1",zone:'A',title:"Monalisa",painter:"Leonado Di caprio",img:links.monalisa,},
//   {uuid:"FFFFFFFFFFFF00X1",zone:'A',title:"Monalisa",painter:"Leonado Di caprio",img:links.monalisa,},
//   {uuid:"FFFFFFFFFFFF00X1",zone:'A',title:"Monalisa",painter:"Leonado Di caprio",img:links.monalisa,},
//   {uuid:"FFFFFFFFFFFF00X2",zone:'B',title:"Impress Sunrise",painter:"Claude Monet",img:links.impresssunrise,},
//   {uuid:"FFFFFFFFFFFF00X2",title:"Impress Sunrise",painter:"Claude Monet",img:links.impresssunrise,}
// ]

//
var socketX = io.connect("http://192.168.1.10:8000");
//
// socketX.emit('setID', {uuid: 'E2C56DB5DFFB48D2B060D0F5A71096E0'});

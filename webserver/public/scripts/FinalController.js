var data;

App
  .factory('socket', function(socketFactory){
    var myIoSocket = socketX;

     mySocket = socketFactory({
       ioSocket: myIoSocket
     });

     return mySocket;
  })
  .controller('FinalController', function($scope,$window,socket,$interval){

    $scope.blabla = 0;
    $scope.bla = 0;
    $scope.directional = {};
  $scope.testAndroid = function(){
    if(Android){
      // Android.makeToast("WTF");

      $interval(function(){
        $scope.dir = Android.makeNavigate();
      },100);
      // var fuck= Android.makeNavigate();

    }
  }
  var deviceWidth = $window.innerWidth;
  var zone = null;

  $scope.admin = (deviceWidth > 500);


  // $scope.notifDialog = [
  //   {type:'success', title:'Monalisa arrived'},
  //   {type:'danger', title:'Monalisa lost'}
  //   {type:'info', title:'Monalisa lost'}
  // ];

  $scope.notifDialog = [];
  $scope.data = [];
  $scope.watchList = [];



  //admin function

  socket.on("WatchListService",function(wdata){
      $scope.watchList = wdata.watch;
      // console.log("Yolo~")
      setNotifDialogDanger();
  });

  socket.on("DataServiceClient",function(_data){
    $scope.data = _data.array;
    $scope.eachZone = _.filter(_data.array,function(item){return item.type != 0;});
    $scope.eachZone = _.sortBy($scope.eachZone,'zone');
    $scope.eachZone = _.groupBy($scope.eachZone,'zone');


    // console.log($scope.eachZone);
    if($scope.selectZoneItem){
       $scope.selectZone($scope.currentZone == "in coming. . ."? null:$scope.currentZone);
    }
  })

  socket.on("NewDataService",function(data){
    if(data.ndata.type != '0'){
      console.log(data.ndata);
      setNotifDialogSuccess(data.ndata);
    }
  });

  socket.on("NowHereService",function(data){
    console.log("Now Here: "+data.data);
    setNotifDialogSuccess(data.data);
  })

  var setNotifDialogDanger = function(){

    for(var index in $scope.watchList){
      if(_.findIndex($scope.notifDialog,{uuid:$scope.watchList[index].uuid}) == -1){

        var tmp = $scope.watchList[index];

        tmp.type = 'danger';
        tmp.title = tmp.title + ' lost from ' + tmp.zone;

        $scope.notifDialog.push(tmp);

        console.log("Yolo!!!!" + $scope.notifDialog[0].uuid)
      }
    }
  }

  var setNotifDialogSuccess = function(obj){
    var tmp = obj;

    if(tmp.zone){
      tmp.type = 'success';
      tmp.title = tmp.title + ' availiable on zone  ' + tmp.zone;
    }
    else{
      tmp.type = 'info';
      tmp.title = tmp.title + ' is coming . . . ';
    }

    $scope.notifDialog.push(tmp);
    console.log($scope.notifDialog);

    setTimeout(function(){  $scope.notifDialog = _.reject($scope.notifDialog,{uuid:tmp.uuid}); },1000);
  }

  socket.on("UserServiceClient",function(_user){
    $scope.user = _user;
    // console.log($scope.user);
    zone = _user.zone;
  })


  $scope.checkZone = function(_zone){
    if(zone == _zone)
    return true;

    return false;
  }

  $scope.closeDialog = function(component){
    $scope.notifDialog = _.reject($scope.notifDialog,function(obj){ return obj.uuid == component.dialog.uuid});
    console.log(component.dialog);
    socket.emit('ClearWatchListServiceClient',{data:component.dialog});
  }


  $scope.selectZoneItem = null;
  $scope.currentZone = null;



  $scope.selectZone = function(_zone){

      if(_zone == null){
          $scope.currentZone = "in coming. . .";
      }
      else {
          $scope.currentZone = _zone;
      }
      $scope.selectZoneItem =   $scope.eachZone[''+_zone]?  $scope.eachZone[''+_zone]:[];
  }

  $scope.backToMain = function(){
      $scope.selectZoneItem = null;
      $scope.currentZone = null;
      $scope.settingSelected = false;
  }


  $scope.settingSelected = false;
  $scope.selectSetting = function(){
    $scope.currentZone = "Setting";
    $scope.settingSelected = true;
  }

  $scope.formSelected = false;
  $scope.editItem = null;
  $scope.selectForm = function(_item) {
      $scope.formSelected = true;
      $scope.editItem = _item;
  }

  $scope.updateDataService = function(_uuid,_name,_artist,_url,_description,_zone){
    var datax= {uuid:_uuid,title:_name,painter:_artist,img:_url,description:_description};

    console.log(datax);
    socket.emit('UpdateDataServiceClient',datax);
    $scope.closeForm();
  }

  $scope.insertDataService = function(_uuid,_name,_artist,_url,_description,_zone) {
    var datax= {uuid:_uuid,title:_name,painter:_artist,img:_url,description:_description};

    console.log(datax);
    socket.emit('InsertDataServiceClient',datax);

    $scope.closeForm();
  }

  $scope.closeForm = function() {
      $scope.formSelected = false;
      $scope.editItem = null;
  }

  $scope.informItem = null;
  $scope.selectInformation = function(_item){
    $scope.informItem = _item;
  }

  $scope.closeInformation = function() {
      $scope.informItem = null;
  }

  $scope.lockControl = function(_uuid,_lock){
    var datax = {uuid:_uuid,lock:_lock};
    console.log(datax);
    socket.emit('UpdateDataServiceClient',datax);
  }

  $scope.lockControlAll = function(_lock){
    for (var zone in $scope.eachZone){
        if(zone == null)
          return;
        // console.log(zone);
        for(var index in $scope.eachZone[zone]){
            var _uuid = $scope.eachZone[zone][index].uuid;
            var datax = {uuid:_uuid,lock:_lock}
            socket.emit('UpdateDataServiceClient',datax);
        }
    }
  }

})

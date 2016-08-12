var ws = new WebSocket('wss://' + location.host + '/call');
var video;
var webRtcPeer;
var state = null;

const I_CAN_START = 1;
window.onload = function() {
	video = document.getElementById('video');
}

window.onbeforeunload = function() {
	ws.close();
}

ws.onmessage = function(message) {
	var parsedMessage = JSON.parse(message.data);
	console.info('Received message: ' + message.data);

	switch (parsedMessage.id) {
	case 'response':
		response(parsedMessage);
		break;
	case 'stopCommunication':
        dispose();
		break;
	case 'iceCandidate':
		webRtcPeer.addIceCandidate(parsedMessage.candidate)
		break;
	default:
		console.error('Unrecognized message', parsedMessage);
	}
}

function response(message) {
	if (message.response != 'accepted') {
		var errorMsg = message.message ? message.message : 'Unknow error';
		console.info('Call not accepted for the following reason: ' + errorMsg);
        dispose();
	} else {
//        webRtcPeer.processSdpAnswer(message.sdpAnswer);
			setState(I_CAN_START);
	webRtcPeer.processAnswer(message.sdpAnswer);
	}
}

function start() {
	if (!webRtcPeer) {
		showSpinner(video);

		//        webRtcPeer = kurentoUtils.WebRtcPeer.startSendRecv(undefined, video, function(offerSdp) {
		//			var message = {
		//				id : 'client',
		//				sdpOffer : offerSdp
		//			};
		//			sendMessage(message);
		//		});
		var options = {
		localVideo: undefined,
	    	remoteVideo: video,
	    	onicecandidate : onIceCandidate
		}
		webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options, function(error) {
				if(error) return onError(error);
				this.generateOffer(onOffer);
				});
					var message = {
						id : 'client',
						sdpOffer : onOffer
					};
			//		sendMessage(message);
	}
}

function setState(nextState) {
	state = nextState;
}
function onIceCandidate(candidate) {
	   console.log('Local candidate' + JSON.stringify(candidate));
	 //  if (state == I_CAN_START){
	   var message = {
	      id : 'onIceCandidate',
	      candidate : candidate
	   };
	   sendMessage(message);
//	}
}

function onOffer(error, offerSdp) {
	if(error) return onError(error);

	console.info('Invoking SDP offer callback function ' + location.host);
	var message = {
		id : 'client',
		sdpOffer : offerSdp
	}
	sendMessage(message);
}
function onError(error) {
	console.error(error);
}
function stop() {
	var message = {
		id : 'stop'
	}
	sendMessage(message);
    dispose();
}

function dispose() {
	if (webRtcPeer) {
        webRtcPeer.dispose();
        webRtcPeer = null;
	}
	hideSpinner(video);
}

function sendMessage(message) {
	var jsonMessage = JSON.stringify(message);
	console.log('Senging message: ' + jsonMessage);
	ws.send(jsonMessage);
}

function showSpinner() {
	for (var i = 0; i < arguments.length; i++) {
		arguments[i].poster = './img/transparent-1px.png';
		arguments[i].style.background = 'center transparent url("./img/spinner.gif") no-repeat';
	}
}

function hideSpinner() {
	for (var i = 0; i < arguments.length; i++) {
		arguments[i].src = '';
		arguments[i].poster = './img/webrtc.png';
		arguments[i].style.background = '';
	}
}

var baserURL="http://localhost:8080";

angular.module('cBodies', []);

angular.module('cBodies').controller('CbodiesController', function($rootScope,$scope,$interval,$http,cBodiesService){
    $scope.count = 0;
    $scope.printedData = "No data yet...";
    $scope.getCbodies = function() {
        $scope.printedData = "Fetching . . .";
        cBodiesService.getCbodies($scope.city, $scope.country).then(function(data) {
          $scope.printedData = data;
        }, function() {
          $scope.printedData = "Could not obtain data";
        });
    }

    $scope.fetchMessage = function(/* reuse this or reimplement with sensor ID... */) {
      $interval(function(prevGreeting) {
        $scope.getCbodies();
      }, 200);
    }
  }
);

//////
// STATUS
//////
angular.module('cBodies').factory('cBodiesService', function($http) {
  return {
    getCbodies: function(city, country) {
      //var query = city + ',' + country;
      //console.log("Using Service cBodiesService");
      return $http.get(baserURL+'/api/cbodies/1/analog/IN/1'
      // , {
      //   params: {
      //     q: query
      //   }
      // }
       ).then(function(response) { //then() returns a promise whichis resolved with return value of success callback
         //console.log("GOT RESPONSE Using Service cBodiesService");
         //return response.data.weather[0].description; ///extractweather data
         return response.data; ///extractweather data
      });
    }
  }
});

angular.module('cBodies').directive('analogSensor', function($http) {
  return {
    restrict: 'AEC',
    scope : {
      label:'@sensorAttr'
    },
    replace: true,
    //template: '<canvas nx="slider" min="0" label="{{label}}" max="255" id="{{label}}"></canvas>',
    template: '<input type="text" ng-model="analogValue">',
    link: function(scope, elem, attrs) {
      console.log(elem);
      scope.$watch('analogValue', function(value) {
        if (value == undefined) value = 2;
        console.log('Analog value changed!' + value);
        var data = {"contextElements":[{"type": "Scenario","isPattern": "false","id": "Scenario1",
                                        "attributes": [
                                            {
                                                "name": "analogIN1",
                                                "type": "float",
                                                "value": value
                                            }
                                        ]
                                    }],
                    "updateAction": "UPDATE"
                };
        console.log("ATTRIBUTE: ");
        console.log(data.contextElements[0].attributes[0].value);
        $http.post(baserURL+'/api/cbodies/update',data).success(function(response, status) {
          console.log(response);
        });
        // this does another call? just in case gloabl object does not work
        // and it is required to work in a per sensor/object basis calls
      });
      // scope.clearMessage = function() {
      //   scope.message = '';
      // }
      elem.bind('mouseover', function() {
        console.log("MOUSOVER "+scope.label);
        //elem.colors.accent("#ffffff");
      });

    }
  }
});

//Create an account on Firebase, and use the credentials they give you in place of the following
var config = {
    apiKey: "AIzaSyD0vuwKDx-DhaLPpN3B2Y4eIYkwQAEoytE",
    authDomain: "ngpe-1505201056116.firebaseapp.com",
    databaseURL: "https://ngpe-1505201056116.firebaseio.com",
    projectId: "ngpe-1505201056116",
    storageBucket: "ngpe-1505201056116.appspot.com",
    messagingSenderId: "350276677407"
};
firebase.initializeApp(config);

var database = firebase.database().ref();
var yourId = Math.floor(Math.random()*1000000000);


//Create an account on Viagenie (http://numb.viagenie.ca/), and replace {'urls': 'turn:numb.viagenie.ca','credential': 'websitebeaver','username': 'websitebeaver@email.com'} with the information from your account
var servers = {
    'iceServers': [
        {'urls': 'stun:stun.services.mozilla.com'}, 
        // {'urls': 'stun:stun.l.google.com:19302'}, 
        {'urls': 'turn:numb.viagenie.ca',
        'credential': 'hfGfp4GwqR67JYV2',
        'username': 'rahuljain1311@gmail.com'}
    ]
};

var pc = new RTCPeerConnection(servers);
pc.onicecandidate = (event => event.candidate?sendMessage(yourId, JSON.stringify({'ice': event.candidate})) : console.log("Sent All Ice") );

function sendMessage(senderId, data) {
    
    console.log("Sent All Ice senderId", senderId, "data = ", data);
    var msg = database.push({ sender: senderId, message: data });
    msg.remove();
}

function readMessage(data) {

    var msg = JSON.parse(data.val().message);
    var sender = data.val().sender;
    if (sender != yourId) {
        if (msg.ice != undefined)
            pc.addIceCandidate(new RTCIceCandidate(msg.ice));
        else if (msg.sdp.type == "offer")
            pc.setRemoteDescription(new RTCSessionDescription(msg.sdp))
              .then(() => pc.createAnswer())
              .then(answer => pc.setLocalDescription(answer))
              .then(() => sendMessage(yourId, JSON.stringify({'sdp': pc.localDescription})));
        else if (msg.sdp.type == "answer")
            pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
    }
};

database.on('child_added', readMessage);

function startGame() {
    
    pc.createOffer()
        .then(offer => pc.setLocalDescription(offer) )
        .then(() => sendMessage(yourId, JSON.stringify({'sdp': pc.localDescription})) );
}

/*************************** ICE connection established ************************************/



// Offerer side
var channel = pc.createDataChannel("milimili");
// channel.onopen = function(event) {
//   channel.send('Player 1 ', yourId);
// }
// channel.onmessage = function(event) {

//     console.log('from offerer');
//     var object = JSON.parse(event.data);
//     console.log('A message received on Offerer side', object);
//     if(object.id){ // this will be my logic
//         if(object.id !== yourId){
//             document.getElementById('chat').appendChild(document.createElement('div'));
//             document.getElementById("chat").lastChild.innerHTML += object.id + ': ' + object.message;
//         }
//     }
//     else 
//         console.log('Player1: ', event.data);
// }


// Answerer side
pc.ondatachannel = function(event) {
  var channel = event.channel;
//   channel.onopen = function(event) {
//     channel.send('Hi back from answerer!');
//   }
  channel.onmessage = function(event) {

    console.log('from answerer');
    var object = JSON.parse(event.data);
    console.log('A message received on Answerer side', object, object.id);
    if(object.id){ // this will be my logic
        if(object.id != yourId){
            document.getElementById('chat').appendChild(document.createElement('div'));
            document.getElementById("chat").lastChild.innerHTML += object.id + ': ' + object.message;
        }
    }
    // else 
    //     console.log('Here in onmessage of Offerer', event.data);
  }
}

function chat() {
    var message = document.getElementById("myInput").value;
    var data = {
        id: yourId,
        message: message
    };
    console.log('data = ', data);
    document.getElementById('chat').appendChild(document.createElement('div'));
    document.getElementById("chat").lastChild.innerHTML += yourId + ': ' + message;
    channel.send(JSON.stringify(data));
}

// handle enter plain javascript
function handleEnter(e){
    var keycode = (e.keyCode ? e.keyCode : e.which);
    if (keycode == '13') {
      chat();
    }
}
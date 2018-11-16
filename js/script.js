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
var myId = Math.floor(Math.random()*1000000000);

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

var peerConnections = {};

/*************************** Config setup complete ************************************/

function enterGame(){

    const name = 'RJ'
    sendMessageFirebase2(myId, name);
}

function sendMessageFirebase2(senderId, data) {

    var msg = database.push({ senderId: senderId, message: data });
    msg.remove();
}

function sendMessageFirebase3(senderId, data, receiverId) {

    var msg = database.push({ senderId: senderId, message: data, receiverId: receiverId});
    msg.remove();
}

database.on('child_added', readMessage);

function readMessage(data) {

    var senderId = data.val().senderId;
    var senderMessage = JSON.parse(data.val().message);
    var receiverId = data.val().receiverId;
    
    if(!senderId){ // We dont need to process this case

    }
    else if(!receiverId){ // The sender is broadcasting its unique id for the first time

        peerConnections.senderId = new RTCPeerConnection(servers);
        var pc = peerConnections[senderId];
        pc.onicecandidate = (event => event.candidate?sendMessageFirebase3(myId, JSON.stringify({'ice': event.candidate}), senderId) : console.log("Sent All Ice") );
        pc.createOffer()
            .then(offer => pc.setLocalDescription(offer) )
            .then(() => sendMessageFirebase3(myId, JSON.stringify({'sdp': pc.localDescription}), senderId) );

        // Update players dropdown
        var selectPlayersDropDown = document.getElementById("players"); 
        var player = document.createElement("option");
        player.textContent = senderId;
        player.value = senderId;
        selectPlayersDropDown.appendChild(player);

        // TODO: We need to remove the users when they close the browser window 
    }
    else { // Sender just wants to talk to Receiver

        if(myId === receiverId && myId !== senderId){ // Message is meant for the receiver

            var pc = peerConnections[senderId];
            if (senderMessage.ice != undefined)
                pc.addIceCandidate(new RTCIceCandidate(senderMessage.ice));
            else if (senderMessage.sdp.type == "offer")
                pc.setRemoteDescription(new RTCSessionDescription(senderMessage.sdp))
                    .then(() => pc.createAnswer())
                    .then(answer => pc.setLocalDescription(answer))
                    .then(() => sendMessageFirebase3(myId, JSON.stringify({'sdp': pc.localDescription}), senderId));
            else if (senderMessage.sdp.type == "answer")
                pc.setRemoteDescription(new RTCSessionDescription(senderMessage.sdp));
        }
    }
}

/*************************** ICE connection established ************************************/


// var pc = new RTCPeerConnection(servers);
// pc.onicecandidate = (event => event.candidate?sendMessage(yourId, JSON.stringify({'ice': event.candidate})) : console.log("Sent All Ice") );

// function startGame() {
//   pc.createOffer()
//     .then(offer => pc.setLocalDescription(offer) )
//     .then(() => sendMessage(yourId, JSON.stringify({'sdp': pc.localDescription})) );
// }

// function readMessage(data) {

//     var msg = JSON.parse(data.val().message);
//     var sender = data.val().sender;
//     if (sender != yourId) {
//         if (msg.ice != undefined)
//             pc.addIceCandidate(new RTCIceCandidate(msg.ice));
//         else if (msg.sdp.type == "offer")
//             pc.setRemoteDescription(new RTCSessionDescription(msg.sdp))
//               .then(() => pc.createAnswer())
//               .then(answer => pc.setLocalDescription(answer))
//               .then(() => sendMessage(yourId, JSON.stringify({'sdp': pc.localDescription})));
//         else if (msg.sdp.type == "answer")
//             pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
//     }
// };

// Offerer side
var channel = pc.createDataChannel("milimili");
channel.onopen = function(event) {
  channel.send('Player 1 ', yourId);
}
channel.onmessage = function(event) {

    var object = JSON.parse(event.data);
    console.log('A message received on Offerer side', object);
    if(object.id){ // this will be my logic
        if(object.id !== yourId){
            document.getElementById('chat').appendChild(document.createElement('div'));
            document.getElementById("chat").lastChild.innerHTML += object.id + ': ' + object.message;
        }
    }
    else 
        console.log('Player1: ', event.data);
}


// Answerer side
pc.ondatachannel = function(event) {
  var channel = event.channel;
  channel.onopen = function(event) {
    channel.send('Hi back from answerer!');
  }
  channel.onmessage = function(event) {

    var object = JSON.parse(event.data);
    console.log('A message received on Answerer side', object, object.id);
    if(object.id){ // this will be my logic
        if(object.id != yourId){
            document.getElementById('chat').appendChild(document.createElement('div'));
            document.getElementById("chat").lastChild.innerHTML += object.id + ': ' + object.message;
        }
    }
    else 
        console.log('Here in onmessage of Offerer', event.data);
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
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
var myId = String(Math.floor(Math.random()*1000000000));

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
var channel = {};

/*************************** Config setup complete ************************************/

function connectWithOtherPlayers(){

    // TODO: Update name of each sender
    const name = 'RJ'
    sendMessageFirebase2(myId, JSON.stringify({'name': name}));
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

    console.log(' reading message --- myid = ',myId,  'senderId = ', senderId, 'receiver ID = ', receiverId, 'sender message = ', senderMessage);
    
    if (senderId && myId !== senderId) {

        if(!receiverId && !peerConnections[senderId]){ // Some sender has sent it and I am not that sender. There is no receiver as well.

            console.log('Sender is broadcasting= ', senderId);  
            
            // TODO: Update name of each sender
            const name = 'RJ'
            sendMessageFirebase2(myId, JSON.stringify({'name': name}));

            peerConnections[senderId] = new RTCPeerConnection(servers);
            peerConnections[senderId].onicecandidate = (event => event.candidate?sendMessageFirebase3(myId, JSON.stringify({'ice': event.candidate}), senderId) : console.log("Sent All Ice") );
    
            
        }
        else if(myId === receiverId ) { // Sender just wants to talk to Receiver and Message is meant for the receiver. I am the receiver
    
            if (senderMessage.ice != undefined){
                peerConnections[senderId].addIceCandidate(new RTCIceCandidate(senderMessage.ice));
            }
            else if (senderMessage.sdp.type == "offer")

                // TODO: I am not able to put this .then chain in brackets :(

                peerConnections[senderId].setRemoteDescription(new RTCSessionDescription(senderMessage.sdp))
                .then(() => peerConnections[senderId].createAnswer())
                .then(answer => peerConnections[senderId].setLocalDescription(answer))
                .then(() => sendMessageFirebase3(myId, JSON.stringify({'sdp': peerConnections[senderId].localDescription}), senderId))
                .then(() => {

                    console.log('after sending offer!', peerConnections[senderId]);

                    // Update players dropdown
                    var selectPlayersDropDown = document.getElementById("players"); 
                    var player = document.createElement("option");
                    player.textContent = senderId;
                    player.value = senderId;
                    selectPlayersDropDown.appendChild(player);

                    channel[senderId] = peerConnections[senderId].createDataChannel("milimili" + myId + senderId);
                    console.log('channel[senderId] = ', channel[senderId]);

                    channel[senderId].onmessage = function(event) {
            
                        var object = JSON.parse(event.data);
                        console.log('A message received on Offerer side', object);
                        if(object.id){
                            if(object.id !== myId){
                                document.getElementById('chat').appendChild(document.createElement('div'));
                                document.getElementById("chat").lastChild.innerHTML += object.id + ': ' + object.message;
                            }
                        }
                        else 
                            console.log('Player1: ', event.data);
                    }
                    peerConnections[senderId].ondatachannel = function(event) {
                        var internalChannel= event.channel;
                        internalChannel.onmessage = function(event) {
            
                            var object = JSON.parse(event.data);
                            console.log('A message received on Answerer side', object, object.id);
                            if(object.id){
                                if(object.id != myId){
                                    document.getElementById('chat').appendChild(document.createElement('div'));
                                    document.getElementById("chat").lastChild.innerHTML += object.id + ': ' + object.message;
                                }
                            }
                        }
                    }



                })
            else if (senderMessage.sdp.type == "answer"){
                peerConnections[senderId].setRemoteDescription(new RTCSessionDescription(senderMessage.sdp))
                .then(() => {

                    console.log('after receiving offer in the answer!');
            
                    // TODO: We need to remove the users when they close the browser window 
            
                    channel[senderId] = peerConnections[senderId].createDataChannel("milimili" + myId + senderId);
                    console.log('channel[senderId] = ', channel[senderId]);

                    channel[senderId].onmessage = function(event) {
            
                        var object = JSON.parse(event.data);
                        console.log('A message received on Offerer side', object);
                        if(object.id){
                            if(object.id !== myId){
                                document.getElementById('chat').appendChild(document.createElement('div'));
                                document.getElementById("chat").lastChild.innerHTML += object.id + ': ' + object.message;
                            }
                        }
                        else 
                            console.log('Player1: ', event.data);
                    }
                    peerConnections[senderId].ondatachannel = function(event) {
                        var internalChannel= event.channel;
                        internalChannel.onmessage = function(event) {
            
                            var object = JSON.parse(event.data);
                            console.log('A message received on Answerer side', object, object.id);
                            if(object.id){
                                if(object.id != myId){
                                    document.getElementById('chat').appendChild(document.createElement('div'));
                                    document.getElementById("chat").lastChild.innerHTML += object.id + ': ' + object.message;
                                }
                            }
                        }
                    }

                });
            }
        }
    }
} 

function shareICECandidates (){
    
    const promises = [];
    channel[myId] = {};
    for (var receiverId in peerConnections){

        promises.push(shareICECandidatesPromise(receiverId));
    }
    return Promise.all(promises);
}

function shareICECandidatesPromise(receiverId) {

    return peerConnections[receiverId].createOffer()
    .then(offer => { 
        
        console.log(offer); peerConnections[receiverId].setLocalDescription(offer);  
    })
    .then(() => {

        sendMessageFirebase3(myId, JSON.stringify({'sdp': peerConnections[receiverId].localDescription}), receiverId);
    });
}

/*************************** ICE connection established ************************************/

function chat() {
    var message = document.getElementById("myInput").value;

    var dropdownElement = document.getElementById("players");
    var receiverId = dropdownElement.options[dropdownElement.selectedIndex].text;

    var data = {
        id: myId,
        message: message
    };
    console.log('data = ', data);
    document.getElementById('chat').appendChild(document.createElement('div'));
    document.getElementById("chat").lastChild.innerHTML += myId + ': ' + message;
    channel[receiverId].send(JSON.stringify(data));
}

// handle enter plain javascript
function handleEnter(e){
    var keycode = (e.keyCode ? e.keyCode : e.which);
    if (keycode == '13') {
      chat();
    }
}

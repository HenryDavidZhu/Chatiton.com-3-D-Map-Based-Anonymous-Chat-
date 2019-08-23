// Import required utilities (express, socketio, uniqid, SortedMap)
var express = require("express");
var socket = require("socket.io");
var uniqid = require("uniqid");

// Initialize Node.JS application
var app = express();
var server = app.listen(process.env.PORT || 3000);
app.use(express.static("public", {
    dotfiles: 'allow'
}));

var io = socket(server, { pingTimeout: 63000 }); // Automatically disconnect user after 63s of inactivity
io.sockets.on("connection", userConnect); // Listen for user connection

function userConnect(user) {
    user.on("initializeUser", connectUser); 

    function connectUser(userInfo) {
    	// Format of user information: [username, short biography, sex]
    	var username = userInfo[0];
    	var age = userInfo[1];
    	var shortBio = userInfo[2];
    	var sex = userInfo[3];
    	console.log("username: " + username);
    	console.log("age = " + age);
    	console.log("shortBio: " + shortBio);
    	console.log("sex: " + sex);
    	console.log("----------------------------------------------");
    }
}

// Server architecture (don't worry about this yet)
function System() {

}

function ChatController() {

}
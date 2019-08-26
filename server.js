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

function Client(username, age, shortBio, sex, city) {
    // Download user attributes
    this.username = username;
    this.age = age;
    this.shortBio = shortBio;
    this.sex = sex;
    this.city = city;
}

function System() {
    this.mapping = {}; // Maps a city to a list of active users in that city
}

System.prototype.monitorSystem = function() { // Output mapping of cities to active users (for debugging purposes)
    for (var city in this.mapping) {
        console.log("city = " + city);

        var clients = this.mapping[city];
        for (var client in clients) {
            console.log("client: " + client);
        }

        console.log("");
    }
}

function ChatController() {
}

var system = new System();

function userConnect(user) {
    user.on("initializeUser", connectUser); 

    function connectUser(userInfo) {
    	// Format of user information: [username, short biography, sex]
    	var username = userInfo[0];
    	var age = userInfo[1];
    	var shortBio = userInfo[2];
    	var sex = userInfo[3];
        var city = userInfo[4];

        // Initialize new client
        var client = new Client(username, age, shortBio, sex, city);

        // Map the client to its city in the system's mapping
        if (system.mapping[city]) {
            system.mapping[city].push(client);
        } else {
            system.mapping[city] = [client];
        }

        system.monitorSystem();
    }
}
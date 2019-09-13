// Import required utilities (express, socketio, uniqid, mongo)
var express = require("express");
var socket = require("socket.io");
var uniqid = require("uniqid");

// Initialize Node.JS application
var app = express();
var server = app.listen(process.env.PORT || 3000);
app.use(express.static("public", {
    dotfiles: 'allow'
}));

// Defines a connected user, given the following properties: username, age, shortBio, sex, city
function Client(username, age, shortBio, sex, city) {
    this.username = username;
    this.age = age;
    this.shortBio = shortBio;
    this.sex = sex;
    this.city = city;
}

// System: contains all networking logic and data for the site
function System() {
    this.mapping = {}; // Maps a city to a list of active users (Client object) in that city ([city name] > [Client1, Client2, .... Client N])
}

// Output mapping of cities to active users (for debugging purposes)
System.prototype.monitorSystem = function() { 
    for (var city in this.mapping) { // Iterate through every city in the mapping
        console.log("City - " + city); 
        var clients = this.mapping[city]; // Get the list of active users (Client objects) in that city

        for (var i = 0; i < clients.length; i++) { // Iterate through every client in the city
            var client = clients[i];
            console.log("client: " + client.username); 
        }

        console.log("");
    }
}

System.prototype.returnCitySizes = function(cityList) {
    // Returns a dictionary mapping each city name in cityList to the list of active users in that city
    console.log("");
    
    var citySizes = {};

    for (var i = 0; i < cityList.length; i++) { // Iterate through every city's name in the list
        var city = cityList[i];

        if (city in this.mapping) { // See if any active users are in the city
            citySizes[city] = this.mapping[city]; // Update the list of active users in the city
        }
    }
    return citySizes;
}

var system = new System(); // Initialize the site's networking system
var io = socket(server, { pingTimeout: 63000 }); // Automatically disconnect user after 63s of inactivity
io.sockets.on("connection", userConnect); // Listen for user connection

function userConnect(user) {
    user.on("initializeUser", connectUser); // When a user submits their profile form, initialize the user into the system

    function connectUser(userInfo) {
        // Retrieve the user's information: username, age, shortBio, sex, and the city the user is in
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

    user.on("getCitySizes", getCitySizes);

    function getCitySizes(cityList) {
        // Return to the requesting client the cityMapping ([city name] > [number of active users])
        var cityMapping = system.returnCitySizes(cityList); 
        io.to(user.id).emit("returnCityData", cityMapping);
    }
}
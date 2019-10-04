// Import required utilities (express, socketio, uniqid, mongo)
var express = require("express");
var socket = require("socket.io");
var uniqid = require("uniqid");
var crypto = require("crypto");
var algorithm = "aes-256-cbc";
var {Heap} = require("heap-js");
var bodyParser = require('body-parser');
var cors = require('cors');
var Pusher = require('pusher');
require('dotenv').config({ path: 'variable.env' });

// Initialize Node.JS application
var app = express();
var server = app.listen(process.env.PORT || 3000);
app.use(express.static("public", {
    dotfiles: 'allow'
}));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Define authentication procedure for a client
app.post('/pusher/auth', function(req, res) {
    var socketId = req.body.socket_id;
    var channel = req.body.channel_name;
    var auth = pusher.authenticate(socketId, channel);
    res.send(auth);
});

// Initialize Pusher
var pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_APP_KEY,
    secret: process.env.PUSHER_APP_SECRET,
    cluster: process.env.PUSHER_APP_CLUSTER,
    useTLS: true,
    encryptionMasterKey: process.env.PUSHER_CHANNELS_ENCRYPTION_KEY,
});

// Defines a connected user, given the following properties: id, username, age, shortBio, sex, city
function Client(id, username, age, shortBio, sex, city) {
    this.id = id;
    this.username = username;
    this.age = age;
    this.shortBio = shortBio;
    this.sex = sex;
    this.city = city;
}

// System: contains all networking logic and data for the site
function System() {
    this.mapping = {}; // Maps a city to a list of active users (Client object) in that city ([city name] > [Client1, Client2, .... Client N])
    this.idToCity = {}; // Maps a user's id to the city they are chatting from 
}

// Output mapping of cities to active users (for debugging purposes)
System.prototype.monitorSystem = function() { 
    for (var city in this.mapping) { // Iterate through every city in the mapping
        console.log("City - " + city); 
        var clients = this.mapping[city]; // Get the list of active users (Client objects) in that city

        for (var i = 0; i < clients.length; i++) { // Iterate through every client in the city
            var client = clients[i];
        }

        console.log("");
    }
}

System.prototype.returnCitySizes = function(cityList) {
    // Returns a dictionary mapping each city name in cityList to the list of active users in that city    
    var citySizes = {};

    for (var i = 0; i < cityList.length; i++) { // Iterate through every city's name in the list
        var city = cityList[i];

        if (city in this.mapping) { // See if any active users are in the city
            citySizes[city] = this.mapping[city]; // Update the list of active users in the city
        }
    }
    return citySizes;
}

// Retrieves the top k cities with the highest number of active users in cityList
// Returns a mapping of the top cities' names to the number of active users in that city
System.prototype.getTopCities = function(userId, clusterId, cityList, cityRanking) {
    // Map each city's name to the number of active users in that city
    var citySizes = {};
    var totalUsers = 0;

    for (var i = 0; i < cityList.length; i++) { // Iterate through every city in the list
        // Determine the number of active users in the city
        var numUsers = 0;
        if (system.mapping[cityList[i]]) {
            numUsers = system.mapping[cityList[i]].length;
        }
        citySizes[cityList[i]] = numUsers;
        totalUsers += numUsers;
    }

    io.to(userId).emit("totalClusterUsers", [clusterId, totalUsers]);

    // Sort the list of cities in the cluster
    cityList.sort();

    // Construct a mapping of the city names to the number of users in that city
    var startIndex = cityRanking - 1;
    if (cityList.length < startIndex + 1) {
        return {};
    }

    var endIndex = startIndex + 10;
    if (cityList.length > endIndex + 1) {
        endIndex = cityList.length - 1;
    }

    var topKCities = cityList.slice(startIndex, endIndex + 1);
    var topCityMapping = {};

    for (var m = 0; m < topKCities.length; m++) {
        topCityMapping[topKCities[m]] = citySizes[topKCities[m]];
    }

    return topCityMapping;
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
        var client = new Client(user.id, username, age, shortBio, sex, city);

        // Map the client to its city in the system's mapping
        if (system.mapping[city]) {
            system.mapping[city].push(client);
        } else {
            system.mapping[city] = [client];
        }

        // Map the client's id to its city
        system.idToCity[user.id] = city;

        system.monitorSystem(); // Monitor the mapping of cities to their active users
    }

    // When user disconnects
    user.on("disconnect", userDisconnect);

    function userDisconnect() {
        // Remove all associations to the disconnected user server-side
        // Retrieve the city of that user
        var userCity = system.idToCity[user.id];

        // Search system.mapping to find the list of clients in the user's city
        var cityList = system.mapping[userCity];

        if (cityList) {
            // Conduct a linear search to find which element in the list is the user
            var userIndex = 0;

            for (var i = 0; i < cityList.length; i++) {
                console.log("cityList[" + i + "].id = " + cityList[i].id);
                if (cityList[i].id == user.id) {
                    userIndex = i;
                    break;
                }
            }

            // Remove the user from the city list
            cityList.splice(userIndex, 1);
        }
    }

    // Retrieve the number of users in each city from a list of city names
    user.on("getCitySizes", getCitySizes);

    function getCitySizes(cityList) {
        // Return to the requesting client the cityMapping ([city name] > [number of active users])
        var cityMapping = system.returnCitySizes(cityList); 
        io.to(user.id).emit("returnCityData", cityMapping);
    }

    // Retrieve the number of users in the top k cities
    user.on("retrieveTopKCitySizes", getTopCitySizes);

    function getTopCitySizes(retrievalData) {
        var clusterId = retrievalData[0];
        var cityList = retrievalData[1];
        var cityRanking = retrievalData[2];
        var pointCount = retrievalData[3];
        io.to(user.id).emit("returnTopCities", [clusterId, system.getTopCities(user.id, clusterId, cityList, cityRanking), cityRanking, pointCount]);        
    }

    // When a user wants to send a message to another user
    user.on("sendMsg", sendMsg);

    function sendMsg(msgData) {
        var msgContent = msgData[0];
        var receiverId = msgData[1];

        console.log("sending message to " + receiverId);

        // Send the message to the receiver
        io.to(receiverId).emit("receiveMessage", [msgContent, receiverId]);
    }
}
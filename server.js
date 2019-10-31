// Import required utilities/modules
var express = require("express");
var socket = require("socket.io");

var bodyParser = require('body-parser');
var cors = require('cors');
var SocketAntiSpam = require("socket-anti-spam");


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

// Defines a connected user, given the following properties: id, username, age, shortBio, sex, city
function Client(id, username, age, shortBio, sex, city, country) {
    this.id = id;
    this.username = username;
    this.age = age;
    this.shortBio = shortBio;
    this.sex = sex;
    this.city = city;
    this.country = country;
}

// System: contains all networking logic and data for the site
function System() {
    this.mapping = {}; // Maps a city to a list of active users (Client object) in that city ([city name] > [Client1, Client2, .... Client N])
    this.idToCity = {}; // Maps a user's id to the city they are chatting from 
    this.idToIp = {}; // Maps a user's socket.id property to their IP address
    this.idToUser = {}; // Maps the socket.id property of au user to an Object representing that user
    this.idToAddress = {}; // Maps a user's socket.id property to their IP address (used to negate spam scores)

    // Users are kicked if they receive 4 complains 
    // After 4 kicks, users are temp banned for 30 minutes
    this.ipNumReports = {}; // Maps a user (its id) to the number of complains that user has had 
    this.ipNumKicks = {}; // The number of kicks (FROM REPORTING) a user has had
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

    // Send a signal to the client containing the total number of users in a cluster
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

    // Retrieve the top 10 cities in cityList starting from startIndex's place
    var topKCities = cityList.slice(startIndex, endIndex + 1);
    var topCityMapping = {};

    for (var m = 0; m < topKCities.length; m++) {
        topCityMapping[topKCities[m]] = citySizes[topKCities[m]];
    }

    return topCityMapping;
}

// Negates the increase in spam score caused by socket-anti-spam module (we only want sending messages to count as spam)
function spamNegation(clientAddress) {
    if (socketAntiSpam.users[clientAddress]) {
        socketAntiSpam.users[clientAddress].score--; 
    }
}

var system = new System(); // Initialize the site's networking system
var io = socket(server, { pingTimeout: 63000 }); // Automatically disconnect user after 63s of inactivity
const socketAntiSpam = new SocketAntiSpam({
    banTime:            35,         // Ban time in minutes
    kickThreshold:      7,          // User gets kicked after this many spam score
    kickTimesBeforeBan: 3,          // User gets banned after this many kicks
    banning:            true,       // Uses temp IP banning after kickTimesBeforeBan
    io:                 io,  // Bind the socket.io variable
});
io.sockets.on("connection", userConnect); // Listen for user connection


function userConnect(user) {
    var clientIp = user.request.connection._peername.port; // Get the IP address of the uesr
    var clientAddress = user.client.request.headers['x-forwarded-for'] || user.client.conn.remoteAddress

    user.on("initializeUser", connectUser); // When a user submits their profile form, initialize the user into the system

    function connectUser(userInfo) {
        spamNegation(clientAddress);

        // Check if the user is banned
        const bans = socketAntiSpam.getBans()

        bans.then(function(result) {
            if (result.includes(user.id)) {
                io.to(user.id).emit("ban", true); // Signal to the user that he has been temporarily banned
            }
        });

        // Retrieve the user's information: username, age, shortBio, sex, and the city the user is in
        var username = userInfo[0];
        var age = userInfo[1];
        var shortBio = userInfo[2];
        var sex = userInfo[3];
        var city = userInfo[4];
        var country = userInfo[5];

        // Initialize new client
        console.log("connecting new user:");
        console.log("user.id = " + user.id);
        console.log("username = " + username);
        console.log("shortBio = " + shortBio);
        console.log("sex = " + sex);
        console.log("city = " + city);
        console.log("country = " + country);
        var client = new Client(user.id, username, age, shortBio, sex, city, country);

        // Map the client to its city in the system's mapping
        if (system.mapping[city]) {
            system.mapping[city].push(client);
        } else {
            system.mapping[city] = [client];
        }
        system.idToUser[user.id] = client;

        // Map the client's id to its city
        system.idToCity[user.id] = city;
    }

    // When user disconnects
    user.on("disconnect", userDisconnect);

    function userDisconnect() {
        spamNegation(clientAddress);

        var userId = user.id;
        // Remove all associations to the disconnected user server-side
        delete system.idToIp[userId];
        delete system.idToAddress[userId];
        delete system.idToUser[userId];

        // Retrieve the city of that user
        var userCity = system.idToCity[userId];

        delete system.idToCity[userId];

        // Search system.mapping to find the list of clients in the user's city
        var cityList = system.mapping[userCity];

        if (cityList) {
            // Conduct a linear search to find which element in the list is the user
            var userIndex = 0;

            for (var i = 0; i < cityList.length; i++) {
                if (cityList[i].id == userId) { // Found the disconnected user
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
        spamNegation(clientAddress);

        // Return to the requesting client the cityMapping ([city name] > [number of active users])
        var cityMapping = system.returnCitySizes(cityList); 
        io.to(user.id).emit("returnCityData", cityMapping);
    }

    // Retrieve the number of users in the top k cities
    user.on("retrieveTopKCitySizes", getTopCitySizes);

    function getTopCitySizes(retrievalData) {
        spamNegation(clientAddress);

        var clusterId = retrievalData[0];
        var cityList = retrievalData[1];
        var cityRanking = retrievalData[2];
        var pointCount = retrievalData[3];

        // Return the top cities in the cluster
        io.to(user.id).emit("returnTopCities", [clusterId, system.getTopCities(user.id, clusterId, cityList, cityRanking), cityRanking, pointCount]);        
    }

    // When a user wants to send a message to another user
    user.on("sendMsg", sendMsg);

    function sendMsg(msgData) {
        // Extract the message content and the sender/receiver information from the data inputted
        var msgContent = msgData[0];
        var you = msgData[1];
        var chattingWith = msgData[2];

        // Increase the spam score
        if (io.sockets.sockets[chattingWith] != undefined) {
            // Send the message to the receiver
            io.to(chattingWith).emit("receiveMessage", [msgContent, you]);
        } else {
            // The user has disconnected, send a signal to the user indicating that
            io.to(you.id).emit("disconnectedUser", chattingWith);
        }
    }

    // Map a user's id to his or her's ip address
    user.on("ipMapping", updateIp);

    function updateIp(ipAddress) {
        spamNegation(clientAddress);

        system.idToIp[user.id] = ipAddress;
    }

    // When a user is reported
    user.on("reportUser", reportUser);

    function reportUser(reportData) {
        spamNegation(clientAddress);

        var reporterIp = system.idToIp[reportData[0]]; // Ip of the user that is reporting another user
        var userId = reportData[1]; // Id of the user that is being reported

        var userIpAddress = system.idToIp[userId];

        if (userIpAddress in system.ipNumReports) {
            system.ipNumReports[userIpAddress].add(reporterIp);

            if (system.ipNumReports[userIpAddress].length == 4) { // Send a signal to the user that he or she is kicked
                io.to(userId).emit("reportKick", true);
            }
        } else {
            system.ipNumReports[userIpAddress] = new Set();
            system.ipNumReports[userIpAddress].add(reporterIp); 
        }
    }

    // Retrieves 20 random users
    user.on("getRandomUsers", retrieveRandomUsers);
    
    function retrieveRandomUsers(n) {
        spamNegation(clientAddress);
        // n is the number of random users that need to be retrieved
        nCounter = 0;
        randomUsers = [];

        console.log("system.idToUser.length = " + Object.keys(system.idToUser).length);

        for (var id in system.idToUser) {
            randomUsers.push(system.idToUser[id]);
            nCounter++;

            if (nCounter == n) {
                break;
            }
        }

        console.log("randomUsers = " + randomUsers + ", randomUsers.length = " + randomUsers.length);
        io.to(user.id).emit("randomUsers", randomUsers);
    }
}

// Call functions with created reference 'socketAntiSpam'
socketAntiSpam.event.on('ban', (socket, data) => {
    io.to(socket.id).emit("ban", true);
});

socketAntiSpam.event.on('kick', (socket, data) => {
    io.to(socket.id).emit("kick", true);
})

socketAntiSpam.event.on('spamscore', (socket, data) => {
  // We have the socket var that received a new spamscore update

  // The second parameter is a object that was binded to the socket with some extra information
  // It's how socket-anti-spam keeps track of sockets and their states

  // If you want the spamscore you can get it via:
  console.log(socket.id + ": " + data.score);
})
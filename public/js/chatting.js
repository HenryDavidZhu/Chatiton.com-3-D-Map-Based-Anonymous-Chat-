// TreeMap implementation borrowed from: https://github.com/somdipdey/JavaScript-implementation-of-java.util.TreeMap-Class
var chattingWith = ""; // The id of the user you're currently chatting with
var currentRoom = "";
var securityLevel = 2048;
var usersChattingWith = {}; // A map of users you have been chatting with (id > ChatUser Object)
var chats = {}; // A map of the ids of the users you have been chatting with to a list of messages within that chat
var userTimestamps = new TreeMap(); // TreeMap that maps the latest timestamps of the messages sent between a users (timestamp > ChatUser Object)
var date = new Date(); // Date object used to timestamp messages and when a user has opened a chat with a new user
var you; // ChatUser Object describing who you are :D!

// Defines a class to represent a user one is chatting with
function ChatUser(id, username, userSex, userAge, shortBio, userLastMessage, lastTimestamp) {
	this.id = id;
	this.username = username;
	this.userSex = userSex;
	this.userAge = userAge;
	this.shortBio = shortBio;
	this.lastMessage = userLastMessage;
	this.lastTimestamp = lastTimestamp;
	this.escaped = false; // See if we have escaped all the properties (this property )
}

// Defines a class to represent a chat message
function Message(senderId, timestamp, msgContent) {
	this.senderId = senderId;
	this.timestamp = timestamp;
	this.msgContent = msgContent;
}

// Helper function to update all the messages exchanged within a chat
function updateChat(userId) {
	if (userId in chats) {
		var chatList = chats[userId];

		$("#chat-panel").empty();
		for (var i = 0; i < chatList.length; i++) {
			var chatMsg = chatList[i];

			if (chatMsg.senderId == socket.id) { // Messages you sent
				$("#chat-panel").append("<div class='user-msg'>" + chatMsg.msgContent + "</div>");
			} else { // Messages that you didn't sent
				$("#chat-panel").append("<div class='user-msg-receiver'>" + chatMsg.msgContent + "</div>");
			}
		}
		console.log("chats[" + userId + "] = " + chats[userId].length);
	}
}

// Opens the chat dialog 
function openChat(userId, username, userSex, userAge, shortBio) {
	// Structure of userProperties:
	// [user.id, user.username, user.sex, user.age, user.shortBio]
	// Shift the tab from "Chats" to "City"
	$("#city-button").removeClass("active");
	$("#city-list").css("display", "none");
	$("#chat-button").addClass("active");

	// Empty active-chat
	$("#display-chats").empty();

	// Insert chat messages into chat box

	var userSexSymbol = "&#9794;";
	if (userSex == "female") {
		userSexSymbol = "&#9792;";
	}
	$("#user-bar").html("<button onclick=\"returnToChatList()\">back</button>&nbsp;<b>" + username + "</b>, " + userSexSymbol + ", " + userAge + "<br>" + shortBio);

	chattingWith = userId; 

	date = new Date();
	// Update the map of users you've been chatting with (usersChattingWith) IF necessary
	if (!(chattingWith in usersChattingWith)) {
		console.log("userId = " + userId + ", date.getTime() = " + date.getTime());
		usersChattingWith[userId] = new ChatUser(userId, username, userSex, userAge, shortBio, "", date.getTime());
	} else {
		usersChattingWith[userId].lastTimestamp = date.getTime();
	}

	console.log("userId = " + userId);
	updateChat(userId);

	$("#chat-list").css("display", "block");
	$("#active-chat").css("display", "block");
}

$("#send-msg").submit(function(e) {
	e.preventDefault(); // Prevents the page from reloading when the user submits a form

	// Check if a chatting channel established 
	socket.emit("sendMsg", [$("#msg-text").val(), you, chattingWith]);

	// Add that message to the chats list
	date = new Date();
	chats[chattingWith].push(new Message(socket.id, date.getTime(), $("#msg-text").val()));

	updateChat(chattingWith);
});

// Returns back to the list of users you are chatting with
function returnToChatList() {
	$("#display-chats").empty();

	var sortedIds = []; // A list of user ids sorted by when they have last chatted with you
	userTimestamps = new TreeMap(); // Reset/clear the treemap

	// Populate the treemap based upon the users in usersChattingWith
	Object.keys(usersChattingWith).forEach(function(userId) {
		var user = usersChattingWith[userId];
		var userLastMessage = user.lastMessage;

		if (!userLastMessage) {
			userLastMessage = "You have not started chatting with this user yet."
		}

		// Populate the TreeMap (multiply the timestamp by -1 so that the chat tabs are added starting from the most recent)
		var userTimestamp = -1 * user.lastTimestamp;
		userTimestamps.set(userTimestamp, user);
	});

	// TreeMap.js is a little unintuitive (the first parameter is the value and the second parameter is the key)
	userTimestamps.each(function(user, timestamp) {
		var userId = addEscapeChars(user.id);
		var username = addEscapeChars(user.username);
		var userAge = addEscapeChars(user.userAge);
		var userSex = addEscapeChars(user.userSex);
		var userShortBio = addEscapeChars(user.shortBio);

		var userLastMessage = user.lastMessage;
		if (userLastMessage) {
			userLastMessage = addEscapeChars(user.lastMessage);
		} else {
			userLastMessage = "Start chatting with " + username + "!";
		}

		var userSexSymbol = "&#9794;";
		if (userSex == "female") {
			userSexSymbol = "&#9792;";
		}
		console.log("userShortBio: ");
		console.log(userShortBio);
		$("#display-chats").append("<div class='user-panel' id='" + userId + '\' onclick="openChat(\'' + userId + '\',\'' 
			+ username + '\',\'' + userSex + '\',\'' + userAge  + '\',\'' + userShortBio + "')\"><b>" + username
			+ "</b>, " + userSexSymbol + ", " + userAge + "<br>" + removeEscapeChars(userLastMessage) + "</div>");
	});

	$("#active-chat").css("display", "none");
	$("#display-chats").css("display", "block");
}

// When the user receives a message
socket.on("receiveMessage", receiveMsg);

function receiveMsg(data) {
	var msgContent = data[0];
	var sender = data[1];
	var senderId = data[1].id;

	var userId = addEscapeChars(sender.id);
	var username = addEscapeChars(sender.username);
	var userAge = addEscapeChars(sender.userAge);
	var userSex = addEscapeChars(sender.userSex);
	var userShortBio = addEscapeChars(sender.shortBio);
	var userLastMessage = sender.lastMessage;

	// Show the notificaiton modal
	$("#notification-modal").html("<a onclick='openChat(\'" + userId + '\',\'' 
			+ username + '\',\'' + userSex + '\',\'' + userAge  + '\',\'' + userShortBio 
			+ ")'>You received a message from <b>" + sender.username + "</b>!");
	$("#notification-modal").css("display", "block");

	if (senderId in chats) {
		chats[senderId].push(new Message(senderId, date.getTime(), msgContent));
	} else {
		chats[senderId] = [new Message(senderId, date.getTime(), msgContent)];
	}

	// Update the map of users you've been chatting with (usersChattingWith) IF necessary
	console.log("sender = " + sender + ", sender.id = " + sender.id);
	console.log("chattingWith in usersChattingWith: " + (chattingWith in usersChattingWith));
	usersChattingWith[senderId] = sender;
	
	console.log("usersChattingWith[senderId] = usersChattingWith[" + senderId + "] = " + usersChattingWith[senderId]);
	usersChattingWith[senderId].lastMessage = msgContent;
	usersChattingWith[senderId].lastTimestamp = date.getTime();

	
	setTimeout(function() {
	   $("#notification-modal").css("display", "none");
	}, 7000);

	updateChat(userId);

	console.log("received msg from " + senderId);
}
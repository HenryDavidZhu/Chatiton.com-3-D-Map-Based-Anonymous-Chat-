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

// Defines a class to represent a chat session between two users
function ChatSession() {
	this.messageList = []; // List of Message objects
	this.opened = false;
}

// Helper function to update all the messages exchanged within a chat
function updateChat(userId) {
	if (userId in chats) { // Go through every chat between each user
		var chatList = chats[userId]; // Get the list of messages exchanged with the user (chat history)

		$("#chat-panel").empty(); // Clear the list of messages in the panel

		// Go through every message in the chat history
		for (var i = 0; i < chatList.length; i++) {
			var chatMsg = chatList[i];

			// Convert time in miliseconds to a readable format
			var timestampString = new Date(chatMsg.timestamp).toString();
			var timestampComponents = timestampString.split(" ");
			var day = timestampComponents[0];
			var time = timestampComponents[4];
			var timeComponents = time.split(":");
			var timeLabel = "am";
			var hrs = parseInt(timeComponents[0]);
			var minutes = parseInt(timeComponents[1]);

			if (hrs >= 12) {
				timeLabel = "pm";

				if (hrs > 12) {
					hrs -= 12;
				}
			}

			if (minutes < 10) {
				minutes = "0" + String(minutes);
			}

			var fullTimeString = day + ", " + hrs + ":" + minutes + " " + timeLabel;

			// Display the messages
			if (chatMsg.senderId == socket.id) { // Messages you sent
				$("#chat-panel").append("<div class='user-msg'><div class='inner'>" + chatMsg.msgContent + "<br><span class='timestamp'>" + fullTimeString 
					+ "</span></div></div>");
			} else { // Messages that you didn't sent
				$("#chat-panel").append("<div class='user-msg-receiver'><div class='inner'>" + chatMsg.msgContent + "<br><span class='timestamp'>" + fullTimeString
					+ "</span></div></div>");
			}
		}

		console.log($("#chat-list")[0]);
		var activeChat = document.getElementById("chat-list");
		activeChat.scrollTop = activeChat.scrollHeight;
		$('#chat-list').scrollTop($('#chat-list')[0].scrollHeight);
		console.log($("#chat-list").css("scrollTop"));
	}
}

// Opens the chat dialog 
function openChat(userId, username, userSex, userAge, shortBio) {
	// Open up the chatting interface
	$("#city-button").removeClass("active");
	$("#city-list").css("display", "none");
	$("#chat-button").addClass("active");

	// Empty the list of chats
	$("#display-chats").empty();

	// Insert chat messages into chat box
	var userSexSymbol = "&#9794;";
	if (userSex == "female") {
		userSexSymbol = "&#9792;";
	}
	$("#user-bar").html("<button onclick=\"returnToChatList()\">back</button>&nbsp;<b>" + username + "</b>, " + userSexSymbol + ", " + userAge  + " <button class='report' id='report-" + userId + "'>report</button><br>" + shortBio);

	// Report a user
	$("#report-" + userId).click(function() {
		var reportUser = confirm("Is this user a spammer or sending abusive/inappropriate messages? If so, press \"Ok\" to report this user.");

		if (reportUser) {
			socket.emit("reportUser", [socket.id, userId]); // Send a singal to the server indicating that a user is behaving inappropriately
		}
	});

	chattingWith = userId; 

	date = new Date();
	// Update the map of users you've been chatting with (usersChattingWith) IF necessary
	if (!(chattingWith in usersChattingWith)) {
		usersChattingWith[userId] = new ChatUser(userId, username, userSex, userAge, shortBio, "", date.getTime());
	} else {
		usersChattingWith[userId].lastTimestamp = date.getTime();
	}

	updateChat(userId);

	// Show the chatting interface
	$("#chat-list").css("display", "block");
	$("#active-chat").css("display", "block");
}

$("#send-msg").submit(function(e) {
	e.preventDefault(); // Prevents the page from reloading when the user submits a form
	var msgText = $("#msg-text").val(); // Retrieve the message the uesr is going to send

	// Ensure that bots are deflected by checking if the honeypot inputs are left blank
	if ($("#aaifh4712").val().length != 0 && !$("#aaifh4772").val().length != 0) {
		alert("Hmm... abnormal behavior was detected. Please try again.")
	}
	else {
		if (msgText && msgText.length <= 300) {
			// Check if a chatting channel established 
			if (socket.id != chattingWith) { // If a user is sending a message to him or herself, there's no need to use up server memory 
				socket.emit("sendMsg", [msgText, you, chattingWith]);

				if (usersChattingWith[chattingWith]) { // Set the last message
					usersChattingWith[chattingWith].userLastMessage = new Message(socket.id, date.getTime(), msgText);
				}
			}

			// Add the message to the chats list
			date = new Date();
			if (chats[chattingWith]) {
				chats[chattingWith].push(new Message(socket.id, date.getTime(), msgText));
			} else {
				chats[chattingWith] = [new Message(socket.id, date.getTime(), msgText)];
			} 

			// Clear the chat input
			$("#msg-text").val("");

			updateChat(chattingWith); // Update the chat
		} else {
			alert("Your message must be between 1 and 300 characters long."); // Notify user of an invalid input
		}
	}
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

		$("#display-chats").append("<div class='user-panel' id='" + userId + "\'" + "><div class='user-panel-left'" + '><div class="left" onclick="openChat(\'' + userId + '\',\'' 
			+ username + '\',\'' + userSex + '\',\'' + userAge  + '\',\'' + userShortBio + "')\"" + '><b>' + username
			+ "</b>, " + userSexSymbol + ", " + userAge + "<br>" + removeEscapeChars(userLastMessage) + "</div></div><div class='user-panel-close'><button id='" + userId 
			+ "-close'>&times;</button></div></div>");
		
		// Delete the chat when user clicks the delete chat button
		$("#" + userId + "-close").click(function() {
			// Delete the chat from the local storage
			var deleteChat = confirm("This will permanently delete your chat with " + username + ". Proceed?");

			if (deleteChat) {
				delete chats[chattingWith];
				delete usersChattingWith[chattingWith];
				$("#chat-panel").empty();
				returnToChatList();
			}
		});
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
	usersChattingWith[senderId] = sender;	
	usersChattingWith[senderId].lastMessage = msgContent;
	usersChattingWith[senderId].lastTimestamp = date.getTime();

	
	setTimeout(function() {
	   $("#notification-modal").css("display", "none");
	}, 137000);

	// If the id of the user you're currently chatting with matches the sender of the message, update the chat panel
	if (chattingWith == userId) {
		updateChat(userId);
	}
}

// When you try to send a message to a user but he or she disconnected
socket.on("disconnectedUser", disconnectedUser);

function disconnectedUser(chattingWith) {
	delete chats[chattingWith];
	delete usersChattingWith[chattingWith];

	// Empty the chat panel
	$("#display-chats").empty();

	alert("The user you are chatting with disconnected :(.")

	returnToChatList();
}

// When a user needs to be kicked for spamming messages
socket.on("kick", kickUser);

function kickUser() {
	alert("Our spam detection system has indicated that you are spamming. You have been kicked. You have 3 chances in total before"
		+ " you get temp banned for 30 minutes.");
	window.location.replace("http://localhost:3000/");
}

// When a user needs to be kicked after being reported 4 times
socket.on("reportKick", reportKickUser);

function reportKickUser() {
	alert("During this chatting session, you have been reported 4 times for inappropriate behavior. You have been kicked. You have 3 choices in total before"
		+ " you get temp banned for 30 minutes.");
	window.location.replace("http://localhost:3000/");
}

// When a user needs to be temp banned for spamming messages
socket.on("ban", banUser);

function banUser() {
	alert("Due to what was perceived as inappropriate behavior from you, you have been temporarily banned from chatiton.com for 35 minutes.");
	window.location.replace("http://localhost:3000/");
}
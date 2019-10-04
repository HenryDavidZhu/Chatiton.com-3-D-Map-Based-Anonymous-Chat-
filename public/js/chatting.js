var chattingWith = ""; // The id of the user you're currently chatting with
var currentRoom = "";
var securityLevel = 2048;
var usersChattingWith = {}; // A map of users you have been chatting with (id > ChatUser Object)
var chats = {}; // A map of the ids of the users you have been chatting with to a list of messages within that chat

// Defines a class to represent a user one is chatting with
function ChatUser(userId, username, userSex, userAge, shortBio) {
	this.userId = userId;
	this.username = username;
	this.userSex = userSex;
	this.userAge = userAge;
	this.shortBio = shortBio;
	this.lastMessage = "";
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

	userSexSymbol = "&#9794;";
	if (userSex == "female") {
		userSexSymbol = "&#9792;";
	}
	$("#user-bar").html("<button onclick=\"returnToChatList()\">&larr;</button>&nbsp;<b>" + username + "</b>, " + userSexSymbol + ", " + userAge + "<br>" + shortBio);

	chattingWith = userId; 

	// Update the map of users you've been chatting with (usersChattingWith) IF necessary
	if (!(chattingWith in usersChattingWith)) {
		usersChattingWith[userId] = new ChatUser(userId, username, userSex, userAge, shortBio);
	}

	$("#chat-list").css("display", "block");
	$("#active-chat").css("display", "block");
}

$("#send-msg").submit(function(e) {
	e.preventDefault(); // Prevents the page from reloading when the user submits a form

	// Check if a chatting channel established 
	socket.emit("sendMsg", [$("#msg-text").val(), chattingWith]);
});

// Returns back to the list of users you are chatting with
function returnToChatList() {
	$("#display-chats").empty();

	// Populate active-chat with users in usersChattingWith
	for (var userId in usersChattingWith) {
		var userObject = usersChattingWith[userId];
		
		// Print out the mapping of the userId to its respective object
		console.log("userId = " + userId + " : " + userObject);

		$("#display-chats").append("<div class='user-panel' id='" + userObject.userId + '\' onclick="openChat(\'' + userObject.userId + '\',\'' 
			+ userObject.username + '\',\'' + userObject.userSex + '\',\'' + userObject.userAge  + '\',\'' + userObject.userShortBio + "')\"><b>" + userObject.username 
			+ ", " + "(" + userObject.userSex + ", " + userObject.userAge + ")</b> <br>" + userObject.shortBio + "</div>");
	}

	$("#active-chat").css("display", "none");
	$("#display-chats").css("display", "block");
}

// When the user receives a message
socket.on("receiveMessage", receiveMsg);

function receiveMsg(data) {
	alert("RECEIVED MESSAGE!");
	var msgContent = data[0];
	var senderId = data[1];

	// Show the notificaiton modal
	$("#notification-modal").html("You received a message from <b>USERA</b>.");
	$("#notification-modal").css("display", "block");

	
	
	setTimeout(function() {
	   $("#notification-modal").css("display", "none");
	}, 7000);

	console.log("received msg from " + senderId);
}
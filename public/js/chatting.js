// Opens the chat dialog 
function openChat(userId, username, userSex, userAge, shortBio) {

	// Structure of userProperties:
	// [user.id, user.username, user.sex, user.age, user.shortBio]
	// Shift the tab from "Chats" to "City"
	$("#city-button").removeClass("active");
	$("#city-list").css("display", "none");
	$("#chat-button").addClass("active");

	userSexSymbol = "&#9794;";
	if (userSex == "female") {
		userSexSymbol = "&#9792;";
	}
	$("#user-bar").html("<b>" + username + "</b>, " + userSexSymbol + ", " + userAge + "<br>" + shortBio);

	$("#chat-list").css("display", "block");
}

$("#send-msg").submit(function(e) {
	e.preventDefault(); // Prevents the page from reloading when the user submits a form
});
// Opens the chat dialog 
function openChat(userId) {
	// Shift the tab from "Chats" to "City"
	$("#city-button").removeClass("active");
	$("#city-list").css("display", "none");
	$("#chat-button").addClass("active");
	$("#chat-list").css("display", "block");

	// Open up chat dialog
}

$("#send-msg").submit(function(e) {
	e.preventDefault(); // Prevents the page from reloading when the user submits a form
});
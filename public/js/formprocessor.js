// Send user data to the server
var socket = io.connect(); // Initializes the socket

$('#login-form').submit(function(e) {
	e.preventDefault(); // Prevents page from refreshing
	// Retrieve user information
    var username = $("#username").val();
    var bio = $("#bio").val();
    var age = $("#age").val();
    var sex = $("#sex").find(":selected").val();

    // Retrieve the user's city
	$.getJSON('https://api.ipdata.co/?api-key=9d7fbbd2c959422769e2dbfc3293914cff99ec4b2c3e554283ba6cb6', function(data) {
		var city = data["city"];
		socket.emit("initializeUser", [username, age, bio, sex, city]); // Send client data to server handler
	});	
});
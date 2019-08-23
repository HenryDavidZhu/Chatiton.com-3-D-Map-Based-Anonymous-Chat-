// Send user data to the server
var socket = io.connect(); // Initializes the socket

$('#login-form').submit(function(e) {
	e.preventDefault(); // Prevents page from refreshing
	// Retrieve user information
    var username = $("#username").val();
    var bio = $("#bio").val();
    var age = $("#age").val();
    var sex = $("#sex").find(":selected").val();
    socket.emit("initializeUser", [username, age, bio, sex]);
});
// Send user data to the server
var socket = io.connect(); // Initializes the socket

// Checks if a user has geolocation enabled on their browser
function checkGeolocation() { 
	if (!navigator.geolocation) {
		locationError();
	}
}

function locationError() {
	alert("Geolocation is not working on your browser. You must enable geolocation to use chatiton.com.");
}

checkGeolocation();

$('#login-form').submit(function(e) {
	e.preventDefault(); // Prevents page from refreshing
	// Retrieve user information
    var username = $("#username").val();
    var bio = $("#bio").val();
    var age = $("#age").val();
    var sex = $("#sex").find(":selected").val();

    // Fade out login menu
    $("#login-wrapper").fadeOut();

    // Retrieve the user's city
	$.getJSON('https://api.ipdata.co/?api-key=9d7fbbd2c959422769e2dbfc3293914cff99ec4b2c3e554283ba6cb6', function(data) {
		var city = data["city"];
		var cityKeyToUpdate = "";
		updateCityNames();

		console.log("city = " + city);
		console.log("cityNames = " + cityNames);

		// Match up the city retrieved using ipdata.co with the formatted city embedded in the map 
		for (var i = 0; i < cityNames.length; i++) {
			if (cityNames[i].includes(city + "-")) {
				cityKeyToUpdate = cityNames[i];
			}
		}

		socket.emit("initializeUser", [username, age, bio, sex, cityKeyToUpdate]); // Send client data to server handler
		// Emit a request to the server to update the number of active users in the client's current city
		console.log("cityKeyToUpdate = " + cityKeyToUpdate);
		socket.emit("cityUpdate", cityKeyToUpdate);
	});	

	//socket.emit("getCitySizes", ["Bellevue"]);
});
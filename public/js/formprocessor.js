// Send user data to the server
var socket = io.connect(); // Initializes the socket
var lat;
var long;

function getCoordinates() { 
// Obtains [lat, long] of a user
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(returnCoordinates, locationError);
  } else { 
    locationError();
  }
}

function returnCoordinates(position) { 
	// Retrieves the user's coordinates and zooms into the user's location on the map
	lat = position.coords.latitude
	long = position.coords.longitude;

	console.log("lat = " + lat + ", long = " + long);

	map.flyTo({
		center: [long, lat],
		zoom: 10
	});
}

function locationError() {
	alert("Geolocation is not working on your browser. You must enable geolocation to use chatiton.com");
}

getCoordinates();

$('#login-form').submit(function(e) {
	e.preventDefault(); // Prevents page from refreshing
	// Retrieve user information
    var username = $("#username").val();
    var bio = $("#bio").val();
    var age = $("#age").val();
    var sex = $("#sex").find(":selected").val();

    // JUST FOR TESTING PURPOSES RN
    socket.emit("initializeUser", [username, age, bio, sex, "Bellevue"]); // Send client data to server handler

    // Fade out login menu
    $("#login-wrapper").fadeOut();

    // Retrieve the user's city
	$.getJSON('https://api.ipdata.co/?api-key=9d7fbbd2c959422769e2dbfc3293914cff99ec4b2c3e554283ba6cb6', function(data) {
		var city = data["city"];
	});	
});
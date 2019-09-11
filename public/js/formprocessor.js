/*
2 API Testing Keys:
If one of them doesn't work, switch to the other. If both don't work, wait 5-10 minutes
for the API keys to recharge, and plug in the one that works (you can test out if an API key
works by going to your browser and entering the API links below):

1. https://api.ipdata.co/?api-key=982a1375474d4f171923e408626833ab269d418e63036d66243c8059
2. https://api.ipdata.co/?api-key=9d7fbbd2c959422769e2dbfc3293914cff99ec4b2c3e554283ba6cb6
*/

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

socket.on("returnCityData", downloadCityData);

function downloadCityData(cityMapping) {
	// Updates the sizes/colour of the city circles based on how many active users are in the city
	for (cityName in cityMapping) {
		var cityId = parseInt(cityName.split("-")[1]);
		console.log(cityName + ".numUsers >" + cityMapping[cityName]);
		console.log(typeof cityId);
		console.log(typeof cityMapping[cityName]);

		if (cityMapping[cityName] > 0) {
			console.log("cityName = " + cityName + ", cityMapping[" + cityName + "] = " + cityMapping[cityName].length);
			cityMap[cityName] = cityMapping[cityName].length;
		}
		map.setFeatureState({source: "cities", id : cityId}, {numUsers : cityMapping[cityName].length});
	}

	// Download the updated city mapping
	cityUserList = cityMapping;
}

$('#login-form').submit(function(e) {
	e.preventDefault(); // Prevents page from refreshing

	if (flying) {
		alert("Wait until flyTo has finished.");
	} else {
		// Fade in the chat panel
		$("#chat-menu").fadeIn();

		// Retrieve user information
	    var username = $("#username").val();
	    var bio = $("#bio").val();
	    var age = $("#age").val();
	    var sex = $("#sex").find(":selected").val();

	    // Fade out login menu
	    $("#login-wrapper").fadeOut();

	    // Retrieve the user's city
		$.getJSON('https://api.ipdata.co/?api-key=982a1375474d4f171923e408626833ab269d418e63036d66243c8059', function(data) {
			var city = data["city"];
			var cityKeyToUpdate = "";
			updateCityNames();

			console.log("city = " + city);
			console.log("cityNames = " + cityNames);

			// Match up the city retrieved using ipdata.co with the formatted city embedded in the map 
			Object.keys(cityNames).forEach(function(cityId) {
				if (cityId.includes(city + "-")) {
					cityKeyToUpdate = cityId;
					var cityObject = cityNames[cityId];
					cityLong = cityObject.geometry.coordinates[0];
					cityLat = cityObject.geometry.coordinates[1];
				}
			});

			console.log("cityLong = " + cityLong + ", cityLat = " + cityLat);
			console.log("userLong = " + userLong + ", userLat = " + userLat);
			
			flying = true;
			map.flyTo({
				center: [cityLong, cityLat]
			});

			// Draw a circle at the user's location
			map.addSource("userCityCircle", {
			    "type": "geojson",
			    "data": {
			        "type": "FeatureCollection",
			        "features": [{
			            "type": "Feature",
			            "geometry": {
			                "type": "Point",
			                "coordinates": [cityLong, cityLat]
			            }
			        }]
			    }
			});

			map.addLayer({
			    "id": "userCityCircle",
			    "type": "circle",
			    "source": "userCityCircle",
			    "layout": {
			        "visibility": "none"
			    },
			    "paint": {
			        "circle-radius": 14,
			        "circle-color": "#ff6666",
			        "circle-opacity": 0.6
			    }
			});

			socket.emit("initializeUser", [username, age, bio, sex, cityKeyToUpdate]); // Send client data to server handler
			// Emit a request to the server to update the number of active users in the client's current city
			console.log("cityKeyToUpdate = " + cityKeyToUpdate);
			socket.emit("cityUpdate", cityKeyToUpdate);

			var cityId = parseInt(cityKeyToUpdate.split("-")[1]);

			// Create a popup, but don't add it to the map yet.
			var popup = new mapboxgl.Popup({
				closeButton: false,
				closeOnClick: false
			});
			 
			map.on('mouseenter', 'cities', function(e) {
				var cityId = e.features[0].properties.city;
				var listOfUsers = cityUserList[cityId];

				// Retrieve the number of active users in the city
				var userCount = 0;
				if (listOfUsers) {
					userCount = listOfUsers.length;
				}

				// Display popup onto map
				var popupCoordinates = [e.lngLat.lng, e.lngLat.lat];
				popup.setLngLat(popupCoordinates)
					.setHTML("There are " + userCount + " active user(s) here.")
					.addTo(map);

				// Shift the tab from "Chats" to "City"
				$("#chat-button").removeClass("active");
				$("#city-button").addClass("active");

				// Populate the city tab with the list of users in that city
				$("#city-list").empty();
				for (var i = 0; i < listOfUsers.length; i++) {
					var user = listOfUsers[i];
					$("#city-list").append("<div class='user-panel'><div class='user-profile'><b>" + user.username + " (" + user.sex + ", " + user.age + ")</b><br>" + user.shortBio + "</div>" + 
						"<div class='initiate'><i class='far fa-comment-dots'></i></div></div>")
				}
			});
			 
			map.on('mouseleave', 'cities', function() {
				popup.remove();
			});

			// Enable map interactivity after everything has been loaded
			$("#map").css("pointer-events", "auto");

			// Get the cities in the user's current view, and send a request to the server, asking how many users are in each city
			updateCityNames();

			socket.emit("getCitySizes", Object.keys(cityNames));
		});	
	}
});
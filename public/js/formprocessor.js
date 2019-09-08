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
	for (city in cityMapping) {
		console.log("cityMapping[" + city + "] = " + cityMapping[city]);
	}
}

$('#login-form').submit(function(e) {
	e.preventDefault(); // Prevents page from refreshing

	if (flying) {
		alert("Wait until flyTo has finished.");
	} else {
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

			// Highlight the city the user is in
			map.setFeatureState({source: 'cities', id : cityId}, {userCity: true});

			// Create a popup, but don't add it to the map yet.
			var popup = new mapboxgl.Popup({
				closeButton: false,
				closeOnClick: false
			});
			 
			map.on('mouseenter', 'cities', function(e) {
				var popupCoordinates = [e.lngLat.lng, e.lngLat.lat];

				popup.setLngLat(popupCoordinates)
					.setHTML("There are no active users here.")
					.addTo(map);
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
/*
2 API Testing Keys:
If one of them doesn't work, switch to the other. If both don't work, wait 5-10 minutes
for the API keys to recharge, and plug in the one that works (you can test out if an API key
works by going to your browser and entering the API links below):

1. https://api.ipdata.co/?api-key=982a1375474d4f171923e408626833ab269d418e63036d66243c8059
2. https://api.ipdata.co/?api-key=9d7fbbd2c959422769e2dbfc3293914cff99ec4b2c3e554283ba6cb6
*/

var socket = io.connect(); // Initializes the socket
var clusterSource;

// Helper function to add escape characters to single and double quotes of a string
function addEscapeChars(string) {
	return string.replace(/'/g, String.raw`\'`).replace(/"/g, String.raw`\"`);
}

// Checks if a user has geolocation enabled on their browser
function checkGeolocation() {
	// If a user does not have geolocation enabled, pop up an error Message
	if (!navigator.geolocation) {
		alert("Geolocation is not working on your browser. You must enable geolocation to use chatiton.com.");
	}
}
checkGeolocation();

socket.on("returnCityData", downloadCityData);

function downloadCityData(cityMapping) {
	cityUserList = cityMapping;
	renderCitySizes(cityMapping);
}

socket.on("returnTopCities", downloadTopCities);

function downloadTopCities(cityData) {
	var clusterId = cityData[0];
	var topCityMapping = cityData[1];
	cityRanking = cityData[2];
	var pointCount = cityData[3];

	// Populate the city list with a list of the top K cities w/ the most active users
	var topCityNames = Object.keys(topCityMapping);
	$("#city-list").empty();

	if (topCityMapping) { // See if there are any users in the city
		var addButton = false; // Only add the plus button if there are users in the cluster

		for (var i = 0; i < topCityNames.length; i++) {
			var cityName = topCityNames[i];
			var shortenedCityName = cityName.split("-")[0];
			var cityId = cityName.split("-")[1];

			if (topCityMapping[cityName] >= 1) { // If there are active users in that city
				addButton = true;
				$("#city-list").append("<div onclick=visitCity(" + cityId + ",'" + cityName + "') class='city-panel' id=" + cityId + "><b>" + shortenedCityName + "</b>: " + topCityMapping[cityName] + " active users. </div>");
				$("#" + cityId).click(function() {
					visitCity(cityId, cityName);
				});
			}
		}
		
		// clusterId, cityList, cityRanking
		if (addButton) {
			clusterSource.getClusterLeaves(clusterId, pointCount, 0, function (err, features) {
				var cityList = []; // List of the city names contained within the cluster

				for (var i = 0; i < features.length; i++) { // Iterate through every single city
					var feature = features[i];
					var cityName = feature.properties.city // Get the city's name
					cityList.push(cityName); // Adding the city's name to the city list
				}

				// Send a request to the server to get the list of users within that city
				//retrieveTopKCities(clusterId, cityList, cityRanking);
				$("#city-list").append("<button id=\"more-cities\" onclick='retrieveTopKCities('" + clusterId + "', " + cityList + ", " + cityRanking + ")'>+</button>");
			});
			//
		}
	}
}

socket.on("totalClusterUsers", downloadClusterUsers);

function downloadClusterUsers(clusterMapping) {
	var clusterId = clusterMapping[0];
	var clusterNumUsers = clusterMapping[1];
	clusterToNumCities[clusterId] = clusterNumUsers;

	clusterPopup.setHTML("There are " + clusterNumUsers + " active user(s) here.").addTo(map);
}

function retrieveTopKCities(clusterId, cityList, cityRanking) {
	socket.emit("retrieveTopKCitySizes", [clusterId, cityList, cityRanking]);
}

// Flies to a city's location on the map given the id and renders the city's users on the left-hand side
function visitCity(id, cityName) {
	var coordinates = featureById[parseInt(id)].geometry.coordinates;
	map.flyTo({
		center: coordinates,
		zoom: 11
	});

	var cityList = cityUserList[cityName]; // Retrieve a list of USERS in the city the user is flying to

	// Populate the city tab with the list of users in that city
	$("#city-list").empty();
	if (cityList) { // If there are users in the city
		for (var i = 0; i < cityList.length; i++) {
			var user = cityList[i];
			var userId = addEscapeChars(user.id);
			var username = addEscapeChars(user.username);
			var userSex = addEscapeChars(user.sex);
			var userShortBio = addEscapeChars(user.shortBio);
			$("#city-list").append("<div class='user-panel' id='" + userId + '\' onclick="openChat(\'' + userId + '\',\'' 
			+ username + '\',\'' + userSex + '\',\'' + user.age  + '\',\'' + userShortBio + "')\"><b>" + user.username 
			+ ", " + "(" + user.sex + ", " + user.age + ")</b> <br>" + user.shortBio + "</div>");
		}
		$("#city-list").append("<div class='city-label'>" + featureById[id].properties.city.split("-")[0] + ", " + featureById[id].properties.country + "</div>");
	}
}

function cityView() {
	// Update the tab/menu displays
	$("#chat-button").removeClass("active");
	$("#chat-list").css("display", "none");
	$("#city-button").addClass("active");
	$("#city-list").css("display", "block");
}

function chatView() {
	// Update the tab/menu displays
	$("#city-button").removeClass("active");
	$("#city-list").css("display", "none");
	$("#chat-button").addClass("active");
	$("#chat-list").css("display", "block");	
}

// Switch from chat view to city view
$("#city-button").click(function () {
	cityView();
});

// Switch from city view to chat view
$("#chat-button").click(function () {
	chatView();
});

$('#login-form').submit(function (e) {
	e.preventDefault(); // Prevents page from refreshing
	var validForm = true; // Second layer of validation incase user uses inspect element to modify form content

	// Ensure that the username is between 4 and 20 characters
	if ($("#username").val().length < 4 || $("#username").val().length > 20) {
		alert("Make sure your username is between 4 and 20 characters.");
		validForm = false;
	}

	// Ensure that the age is between 16 and 75
	if ($("#age").val() < 16 || $("#age").val() > 75) {
		alert("You must be at least 16 years old to use this site... if your age is over 75, just put 75.")
		validForm = false;
	}

	// Ensure that the length of the short biography is between 20 and 100 characters
	if ($("#bio").val().length < 20 || $("#bio").val().length > 100) {
		alert("Your biography must be between 20 and 100 characters")
		validForm = false;
	}

	console.log("validForm = " + validForm);

	if (validForm) {
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
			$.getJSON('https://api.ipdata.co/?api-key=9d7fbbd2c959422769e2dbfc3293914cff99ec4b2c3e554283ba6cb6', function (data) {
				var city = data["city"];
				var cityKeyToUpdate = "";
				updateCityNames();

				// Match up the city retrieved using ipdata.co with the formatted city embedded in the map 
				Object.keys(cityNames).forEach(function (cityId) {
					if (cityId.includes(city + "-")) {
						cityKeyToUpdate = cityId;
						var cityObject = cityNames[cityId];
						cityLong = cityObject.geometry.coordinates[0];
						cityLat = cityObject.geometry.coordinates[1];
					}
				});

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

				clusterSource = map.getSource("cities");
				socket.emit("initializeUser", [username, age, bio, sex, cityKeyToUpdate]); // Send client data to server handler
				// Emit a request to the server to update the number of active users in the client's current city
				socket.emit("cityUpdate", cityKeyToUpdate);

				var cityId = parseInt(cityKeyToUpdate.split("-")[1]);

				// Create a popup, but don't add it to the map yet.
				popup = new mapboxgl.Popup({
					closeButton: false,
					closeOnClick: false
				});

				// Create a popup for the clusters, but don't add it to the map yet.
				clusterPopup = new mapboxgl.Popup({
					closeButton: false,
					closeOnClick: false
				});

				// If the user hovers over a city, pop up a list of active users in that city for the user to chat with 
				map.on("mouseenter", "cities", function (e) {
					cityRanking = 1;

					var cityName = e.features[0].properties.city;
					
					if (cityName) { // If the point is not a cluster
						var listOfUsers = cityUserList[cityName];

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
						cityView();

						// Populate the city tab with the list of users in that city
						$("#city-list").empty();

						if (listOfUsers) { // See if there are any users in the city
							for (var i = 0; i < listOfUsers.length; i++) {
								var user = listOfUsers[i];
								var userId = addEscapeChars(user.id);
								var username = addEscapeChars(user.username);
								var userSex = addEscapeChars(user.sex);
								var userShortBio = addEscapeChars(user.shortBio);
								$("#city-list").append("<div class='user-panel' id='" + userId + '\' onclick="openChat(\'' + userId + '\',\'' 
								+ username + '\',\'' + userSex + '\',\'' + user.age  + '\',\'' + userShortBio + "')\"><b>" + user.username 
								+ ", " + "(" + user.sex + ", " + user.age + ")</b><br>" + user.shortBio + "</div>");
							}
							var cityId = cityName.split("-")[1];
							$("#city-list").append("<div class='city-label'>" + featureById[cityId].properties.city.split("-")[0] + ", " + featureById[cityId].properties.country + "</div>");
						}
					}
				});

				// If the user hovers over a cluster, pop up a list of active users in that cluster for the user to chat with
				map.on("mouseenter", "clusters", function (e) {
					// Get the cluster's id
					var features = map.queryRenderedFeatures(e.point, {
						layers: ["clusters"]
					});
					var clusterId = features[0].properties.cluster_id;
					var pointCount = features[0].properties.point_count;

					// Get a list of all the cities in the cluster
					clusterSource.getClusterLeaves(clusterId, pointCount, 0, function (err, features) {
						var cityList = []; // List of the city names contained within the cluster

						for (var i = 0; i < features.length; i++) { // Iterate through every single city
							var feature = features[i];
							var cityName = feature.properties.city // Get the city's name
							cityList.push(cityName); // Adding the city's name to the city list
						}

						// Send a request to the server to get the list of users within that city
						retrieveTopKCities(clusterId, cityList, cityRanking, pointCount);

						// Retrieve the number of user in the cluster
						var clusterUserCount = clusterToNumCities[clusterId];
						console.log("clusterUserCount = " + clusterUserCount);
						// Display popup onto map
						var clusterCoordinates = [e.lngLat.lng, e.lngLat.lat];
						clusterPopup.setLngLat(clusterCoordinates);
							
					});

					cityView();
				});

				map.on('mouseleave', 'clusters', function () {
					clusterPopup.remove();
				});

				map.on('mouseleave', 'cities', function () {
					popup.remove();
				});

				// Enable map interactivity after everything has been loaded
				$("#map").css("pointer-events", "auto");

				// Get the cities in the user's current view, and send a request to the server, asking how many users are in each city
				updateCityNames();

				socket.emit("getCitySizes", Object.keys(cityNames));
			});
		}
	}
});
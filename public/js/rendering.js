/*
	2 API Testing Keys:
	If one of them doesn't work, switch to the other. If both don't work, wait 5 minutes
	for the API keys to recharge, and plug in the one that works (you can test out if an API key
	works by going to your browser and entering the API links below):

	1. https://api.ipdata.co/?api-key=982a1375474d4f171923e408626833ab269d418e63036d66243c8059
	2. https://api.ipdata.co/?api-key=9d7fbbd2c959422769e2dbfc3293914cff99ec4b2c3e554283ba6cb6
*/

// Mapping of city names (e.x. Bellevue-125456 : 3) to the number of active users in that city
var cityMap = {};
// Maps a city name (e.x. Bellevue-125456) to a list of the active users in that city
var cityUserList = {};
// A mapping of all of the city ids in the user's current view (e.x. 125)
var cityNames = {};

// User coordinates
var userLong = 0;
var userLat = 0;

// The coordinates of the user's city
var cityLong = 0;
var cityLat = 0;

// Has flyTo been completed?
var flying = true;

map.on('style.load', function (e) {
	//graphicsController.add(citiesJSON);

	// Parse in the cities GeoJSON dataset
	map.addSource('cities', {
		"type": "geojson",
		"data": citiesJSON,
		"cluster": true,
		"clusterMaxZoom": 14,
		"clusterRadius": 80,
		"clusterProperties": {
		    /*
		      get the property numUser, then cast it to number or 0,
		      then sum it, then store the sum as cluster's numUser property
		    */
		    numUsers: ["+", ["number", ["get", "numUsers"], 0]] 
		},
	});

	// Add the cities into a layer
	map.addLayer({
		"id": "cities",
		"type": "circle",
		"source": "cities",
		"paint": {
			// Circle is red if there's no users, circle is green if there are active users
			"circle-color": [
				"case", ["==", ["get", "numUsers"], null], "#ff4d4d", [">=", ["get", "numUsers"], 1], "#ff751a", [">=", ["get", "numUsers"], 5], "#ffff4d",
				[">=", ["get", "numUsers"], 10], "#66ff33",
				"#ff4d4d"
			],
			// Circle radius is 9 if there's no users, circle is 12 if there are active users
			"circle-radius": [
				"case", ["==", ["get", "numUsers"], null], 9, [">=", ["get", "numUsers"], 1], 12, [">=", ["get", "numUsers"], 5], 14,
				[">=", ["get", "numUsers"], 10], 16,
				9
			],
			// Circle opacity is 0.7 if there's no users, circle opacity if there are users
			"circle-opacity": [
				"case", ["==", ["get", "numUsers"], null], 0.7, [">=", ["get", "numUsers"], 1], 1,
				0.7
			]
		},
	});

	// Add the city clusters into another layer for FAST access
	map.addLayer({
		"id": "clusters",
		"type": "circle",
		"source": "cities",
		"filter": [">=", "point_count", 2],
		"paint": {
			// Circle is red if there's no users, circle is green if there are active users
			"circle-color": "#000000",
			"circle-radius": 12,
			"circle-opacity": 0
		},
	});

	$.getJSON('https://api.ipdata.co/?api-key=9d7fbbd2c959422769e2dbfc3293914cff99ec4b2c3e554283ba6cb6', function (data) {
		// Use ipdata.co's API to retrieve the user's latitude and longitude
		userLong = data["longitude"];
		userLat = data["latitude"];

		// Fly to the user's location (the flying variable prevents the user from submitting form data if flyTo is still executing)
		flying = true;
		map.flyTo({
			center: [userLong, userLat]
		});

		map.on('moveend', function (e) {
			flying = false;
		});
	});
});

function updateCityNames() {
	// Get the list of cities rendered in the map's current view
	var cityList = map.queryRenderedFeatures({
		layers: ["cities"]
	});

	cityNames = {}; 

	for (var i = 0; i < cityList.length; i++) { // Iterate through every city Feature
		var cityName = cityList[i]; 
		if (cityName.properties.city) { // Only push in defined cities to the cityNames mapping
			cityNames[cityName.properties.city] = cityName;
		}
	}
}

// Attach a listener to get the number of users within each of the cities in the user's current area
map.on("moveend", onMoveEnd);

function onMoveEnd(event) {
	updateCityNames(); 
}

// Listen for when the server returns the updated list of cities w/ updated user counts
socket.on("returnCityData", updateCityData);

function updateCityData(updatedCityMap) {
	cityMap = updatedCityMap; // Download the updated mapping ([city id] > [number of users in that city])
}

function renderCitySizes(cityMap) {
	// Updates the color and sizes of the city circles based upon a mapping of city ids to the number of users in that city
	var cityNameList = Object.keys(cityMap); // Get the list of names of the cities we want to update.

	for (var i = 0; i < cityNameList.length; i++) {
		// Get the id from the city name [format of city name: [city's name]-[city id] / e.x.: Bellevue-125456 (125456 is the id)]
		var cityName = cityNameList[i];
		var id = cityName.split("-")[1]; 
		featureById[id].properties.numUsers = cityMap[cityName].length; // Test value of 3, change later
	}

	map.getSource("cities").setData(citiesJSON); // Set the updated GeoJSON
}
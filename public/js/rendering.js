/*
2 API Testing Keys:
If one of them doesn't work, switch to the other. If both don't work, wait 5 minutes
for the API keys to recharge, and plug in the one that works (you can test out if an API key
works by going to your browser and entering the API links below):

1. https://api.ipdata.co/?api-key=982a1375474d4f171923e408626833ab269d418e63036d66243c8059
2. https://api.ipdata.co/?api-key=9d7fbbd2c959422769e2dbfc3293914cff99ec4b2c3e554283ba6cb6
*/

// Mapping of cities to the number of active users in that city
var cityMap = {};

// Maps a city id to a list of the active users in that city
var cityUserList = {};

// A mapping of all of the cities/city clusters in the user's current view {city id : Feature Object}
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
	// Parse in the cities GeoJSON dataset
	map.addSource('cities', {
		"type": "geojson",
		"data": "/data-source/cities.geojson",
		"cluster": true,
		"clusterMaxZoom": 14,
		"clusterRadius": 80
	});

	// 
	map.addLayer({
		"id": "cities",
		"type": "circle",
		"source": "cities",
		"paint": {
			"circle-color": [ 
		    "case",
		    	["==", ["feature-state", "numUsers"], null], "#ff4d4d",
				[">=", ["feature-state", "numUsers"], 1], "#33cc33",
				"#ff4d4d"
		    ],
			"circle-radius": [ 
			    "case",
			    	["==", ["feature-state", "numUsers"], null], 9,
					[">=", ["feature-state", "numUsers"], 1], 12,
					6
			    ],
			"circle-opacity" : [
				"case",
					["==", ["feature-state", "numUsers"], null], 0.7,
					[">=", ["feature-state", "numUsers"], 1], 1,
					0.7
			]
		},
	});

	// Get the user's latitude and longitude
	// Retrieve the user's city
	$.getJSON('https://api.ipdata.co/?api-key=982a1375474d4f171923e408626833ab269d418e63036d66243c8059', function (data) {
		userLong = data["longitude"];
		userLat = data["latitude"];

		// Fly to the user's location
		flying = true;
		map.flyTo({
			center: [userLong, userLat]
		});

		map.on('moveend', function(e){
			flying = false;
		});
	});
	//console.log("Done flying to location");
});

function updateCityNames() {
	var cityList = map.queryRenderedFeatures({
		layers: ["cities"]
	});
	cityNames = {};

	for (var i = 0; i < cityList.length; i++) {
		// Format of cityName : city/long/lat (TODO: check if long and lat are in the right order)
		var cityName = cityList[i];

		if (cityName.properties.city) { // Only push in defined cities to the cityNames
			cityNames[cityName.properties.city] = cityName;
		}
	}
}

// Attach a listener to get the number of users within each of the cities in the user's current area
map.on("moveend", onMoveEnd);

function onMoveEnd(event) {
	updateCityNames();
	// Send request to server to retrieve number of active users for each city
	//socket.emit("cityRetrieval", cityNames);
}

// Retrieve the cities within the user's current area;


// Listen for when the server returns the updated list of cities w/ updated user counts
socket.on("returnCityData", updateCityData);

// Update the city mapping
function updateCityData(updatedCityMap) {
	alert("Received returnCityData");
	cityMap = updatedCityMap;
	console.log("updated city map = " + cityMap);
}
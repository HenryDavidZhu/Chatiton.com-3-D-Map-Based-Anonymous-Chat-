// Mapping of cities to the number of active users in that city
var cityMap = {};

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

	// This renders the ghost layer: contains every city in the world
	// Marks all cities (both cities with no users and cities with active users)
	map.addLayer({
		"id": "cities",
		"type": "circle",
		"source": "cities",
		"paint": {
			"circle-color": { 
				property: 'numUsers',
				stops: [
					[0, '#ff6666'],
					[1, '#33ff33']
				]
			}
		}
	}, 'settlement-label');

	// Get the user's latitude and longitude
	// Retrieve the user's city
	$.getJSON('https://api.ipdata.co/?api-key=9d7fbbd2c959422769e2dbfc3293914cff99ec4b2c3e554283ba6cb6', function (data) {
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
// Mapping of cities to the number of active users in that city
var cityMap = {};

// Retrieve the bounding coordinates of the user's current area
var canvas = map.getCanvasContainer();
var bbox = canvas.getBoundingClientRect();
var transformedBBox = [
	[bbox.left, bbox.top],
	[bbox.right, bbox.bottom]
];

// A list of all of the cities/city clusters in the user's current view
var cityNames = [];

// User coordinates
var userLong = 0;
var userLat = 0;

// Get the user's latitude and longitude
// Retrieve the user's city
$.getJSON('https://api.ipdata.co/?api-key=9d7fbbd2c959422769e2dbfc3293914cff99ec4b2c3e554283ba6cb6', function (data) {
	userLong = data["longitude"];
	userLat = data["latitude"];
});

map.on('style.load', function (e) {
	// Fly to the user's location
	map.flyTo({
		center: [userLong, userLat]
	});
	
	// Parse in the cities GeoJSON dataset
	map.addSource('cities', {
		"type": "geojson",
		"data": "/data-source/cities.geojson",
		"cluster": true,
		"clusterMaxZoom": 14,
		"clusterRadius": 80
	});

	// Draw a marker to indicate the user's current location
	map.addSource('markers', {
		"type": "geojson",
		"data": {
			"type": "FeatureCollection",
			"features": [{
				"type": "Feature",
				"geometry": {
					"type": "Point",
					"coordinates": [userLong, userLat]
				},
				"properties": {
					"modelId": 1,
				},
			}]
		}
	});
	map.addLayer({
		"id": "circles1",
		"source": "markers",
		"type": "circle",
		"paint": {
			"circle-radius": 15,
			"circle-color": "#33adff",
			"circle-opacity": 0.5,
			"circle-stroke-width": 0,
		},
		"filter": ["==", "modelId", 1],
	});

	// This renders the ghost layer: contains every city in the world
	// Marks all cities (both cities with no users and cities with active users)
	map.addLayer({
		"id": "cities",
		"type": "circle",
		"source": "cities",
		"paint": {
			"circle-radius": 6,
			"circle-color": "#ff6666",
			"circle-opacity": 0.3
		}
	}, 'settlement-label');
});

function updateCityNames() {
	var cityList = map.queryRenderedFeatures({
		layers: ["cities"]
	});
	cityNames = [];

	for (var i = 0; i < cityList.length; i++) {
		// Format of cityName : city/long/lat (TODO: check if long and lat are in the right order)
		var cityName = cityList[i];

		if (cityName.properties.city) { // Only push in defined cities to the cityNames
			cityNames.push(cityName.properties.city);
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
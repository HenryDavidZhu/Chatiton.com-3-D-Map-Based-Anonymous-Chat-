// Mapping of cities to the number of active users in that city
var cityMap = {}; 

// Retrieve the bounding coordinates of the user's current area
var canvas = map.getCanvasContainer();
var bbox = canvas.getBoundingClientRect();
var transformedBBox = [[bbox.left, bbox.top], [bbox.right, bbox.bottom]];

map.on('style.load', function (e) {
	// Parse in the cities GeoJSON dataset
	map.addSource('cities', {
		"type": "geojson",
		"data": "/data-source/cities.geojson",
    	"cluster":  true,
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
                    "coordinates": [long, lat]
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
            "circle-color": "#33cc33",
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
            "circle-opacity": 0
		}
	}, 'settlement-label');
});

// Attach a listener to get the number of users within each of the cities in the user's current area
map.on("moveend", onMoveEnd);
function onMoveEnd(event) {
	var cityList = map.queryRenderedFeatures({layers: ["cities"]});
	var cityNames = [];

	for (var i = 0; i < cityList.length; i++) {
		// Format of cityName : city/long/lat (TODO: check if long and lat are in the right order)
		var cityName = cityList[i];
		cityNames.push(cityName.properties.city + "/" + cityName.geometry.coordinates[0].toFixed(2) + "/" + cityName.geometry.coordinates[1].toFixed(2));
	}

	console.log("cityNames = " + cityNames);
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
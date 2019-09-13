var socket = io.connect();

mapboxgl.accessToken = 'pk.eyJ1IjoiaGVucnlkYXZpZHpodSIsImEiOiJjam9jazY5dDAyZWZlM2tzMWcyeWg3aHl3In0.vWVkmwbs8r60t2FXCfeQ3g';
var map = new mapboxgl.Map({
	container: 'map',
	style: 'mapbox://styles/mapbox/dark-v10',
	zoom: 11
});

// JSON object, containing all information about cities (name, id, latitude, longitude, number of active users, etc.)
var citiesJSON = "";

// Parses the /data-source/cities.geojson dataset into a JSON object
// Need to utilize a callback function to set variable because onreadystatechange is asyncronous
function readCitiesGeojson(callback) 
{
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", "/data-source/cities.geojson", false);

    rawFile.onreadystatechange = function () {
        if (rawFile.readyState === 4) {
            if (rawFile.status === 200 || rawFile.status == 0) {
            	callback(rawFile.responseText);
            }
        }
    }
    rawFile.send(null);
    return "";
}

// Parse the /data-source/cities.geojson dataset into a JSON object
readCitiesGeojson(function(result) {
	citiesJSON = JSON.parse(result);
});

var featureById = {}; // Maps ids of cities to pointers to the Feature Object in citiesJSON (used for FAST access to citiesJSON data)
citiesJSON.features.forEach(f => featureById[f.id] = f) 
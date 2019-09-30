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

var clusterToNumCities = {}; // Maps cluster ids to the number of active users in that custer's area

/*
	The ranking of the city in which we are searching the cluster's most active cities from.
	For example, if cityRanking = 1, we will search the top 10 cities in the cluster.
	For example, if cityRanking = 2, we will search the 11th through 20th cities in the cluster with the most users.
*/
var cityRanking = 1; 

var clusterPopup; // Popup for clusters
var popup; // Popup for cities
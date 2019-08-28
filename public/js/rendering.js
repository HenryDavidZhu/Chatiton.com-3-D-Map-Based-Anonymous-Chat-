// Retrieve the bounding coordinates of the user's current area
var canvas = map.getCanvasContainer();
var bbox = canvas.getBoundingClientRect();
var transformedBBox = [[bbox.left, bbox.top], [bbox.right, bbox.bottom]];
console.log("bbox = " + transformedBBox);
console.log("map = " + map);

map.on('style.load', function (e) {
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
});

// Retrieve the cities within the user's current area;
var features = map.queryRenderedFeatures(bbox, {layers: ['cities']});
console.log("features = " + features);


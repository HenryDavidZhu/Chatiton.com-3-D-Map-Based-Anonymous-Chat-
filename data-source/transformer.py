import json

with open("cities.json", encoding="utf-8") as jsonFile:
    data = json.load(jsonFile)
    geojson = {
        "type": "FeatureCollection",
        "features": [
        {
            "type": "Feature",
            "geometry" : {
                "type": "Point",
                "coordinates": [d["lng"], d["lat"]],
                },
            "properties" : d,
         } for d in data]
    }
    output = open("cities.geojson", "w")
    json.dump(geojson, output)

"""from sys import argv
from os.path import exists
import simplejson as json 

data = json.load(open("cities.json"), errors="ignore")

geojson = {
    "type": "FeatureCollection",
    "features": [
    {
        "type": "Feature",
        "geometry" : {
            "type": "Point",
            "coordinates": [d["lng"], d["lat"]],
            },
        "properties" : d,
     } for d in data]
}

output = open("cities.geojson", 'w')
json.dump(geojson, output)
print(geojson)"""

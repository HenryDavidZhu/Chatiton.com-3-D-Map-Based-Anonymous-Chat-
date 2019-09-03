import json
import re

with open("cities.json", encoding="utf-8") as jsonFile:
    data = json.load(jsonFile)
    print(len(data))

    features = []

    for i in range(0, len(data)):
        inputSet = data[i]

        feature = {
            'type': 'Feature',
            'geometry' : {
                'type' : 'Point',
                'coordinates' : [float(inputSet['lng']), float(inputSet['lat'])]
            },
            'properties' : {
                'country' : inputSet['country'].replace('"','\\"'),
                'city' : inputSet['name'].replace("'", "%")
            }
        }

        features.append(feature)
        
    geojson = {
        'type': 'FeatureCollection',
        'features': features
    }

    outputString = str(geojson)
    outputString = outputString.replace("'","\"")
    outputString = outputString.replace("%", "'")
    
    with open("cities.geojson", mode="w", encoding="utf-8") as output:
        output.write(outputString)

print("Done")

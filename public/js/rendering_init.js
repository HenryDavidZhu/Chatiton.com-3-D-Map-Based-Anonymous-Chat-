var _0xf78a=['map','mapbox://styles/mapbox/light-v10','open','GET','/data-source/cities.geojson','onreadystatechange','readyState','status','send','parse','features','forEach','connect','accessToken'];(function(_0x593394,_0x5e9b63){var _0x5bb647=function(_0x4602bd){while(--_0x4602bd){_0x593394['push'](_0x593394['shift']());}};_0x5bb647(++_0x5e9b63);}(_0xf78a,0x1b0));var _0x29f8=function(_0x344f48,_0x31a60c){_0x344f48=_0x344f48-0x0;var _0x15bca7=_0xf78a[_0x344f48];return _0x15bca7;};var socket=io[_0x29f8('0x0')]();mapboxgl[_0x29f8('0x1')]='pk.eyJ1IjoiaGVucnlkYXZpZHpodSIsImEiOiJjam9jazY5dDAyZWZlM2tzMWcyeWg3aHl3In0.vWVkmwbs8r60t2FXCfeQ3g';var map=new mapboxgl['Map']({'container':_0x29f8('0x2'),'style':_0x29f8('0x3'),'zoom':0xb});var citiesJSON='';function readCitiesGeojson(_0x2b4613){var _0x2688ac=new XMLHttpRequest();_0x2688ac[_0x29f8('0x4')](_0x29f8('0x5'),_0x29f8('0x6'),![]);_0x2688ac[_0x29f8('0x7')]=function(){if(_0x2688ac[_0x29f8('0x8')]===0x4){if(_0x2688ac[_0x29f8('0x9')]===0xc8||_0x2688ac[_0x29f8('0x9')]==0x0){_0x2b4613(_0x2688ac['responseText']);}}};_0x2688ac[_0x29f8('0xa')](null);return'';}readCitiesGeojson(function(_0x21b87a){citiesJSON=JSON[_0x29f8('0xb')](_0x21b87a);});var featureById={};citiesJSON[_0x29f8('0xc')][_0x29f8('0xd')](_0x5d9da8=>featureById[_0x5d9da8['id']]=_0x5d9da8);var clusterToNumCities={};var cityRanking=0x1;var clusterPopup;var popup;

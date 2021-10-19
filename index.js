(function (root) {
	var map = null;
	var tileServer = "https://www.torontomls.net/";
	var mapArtLayers = [
		{ name: "art", label: "MapArt", index: 0, tileURL: tileServer + "Maps/MapArt/Layer_MapArt/{quadkey}.png" },
		{ name: "grid", label: "Grid", index: 1, tileURL: tileServer + "Maps/MapArt/Layer_GridLayer/{quadkey}.png" },
		{ name: "area", label: "Areas", index: 4, tileURL: tileServer + "BingCommunitiesMap/BingMapData/Layer_Areas/{quadkey}.png" },
		{ name: "muni", label: "Municipalities", index: 3, tileURL: tileServer + "BingCommunitiesMap/BingMapData/Layer_Municipalities/{quadkey}.png" },
		{ name: "comm", label: "Communities", index: 2, tileURL: tileServer + "BingCommunitiesMap/BingMapData/Layer_Communities/{quadkey}.png" }
	];

	function init() {
		var defaultCenter = new google.maps.LatLng(43.892761339801176, -79.41482019726558);
		map = new google.maps.Map(
			document.getElementById('mapcontainer'),
			{
				center: defaultCenter,
				zoom: 10,
				scaleControl: true
			});

		google.maps.event.addListener(map, 'zoom_changed', function() {
			var new_zoom = map.getZoom();
			console.log("New Zoom: ", new_zoom);
		});

		google.maps.event.addListener(map, 'center_changed', function() {
			var new_lat = map.getCenter().lat();
			var new_lng = map.getCenter().lng();
			console.log("Lat: ", new_lat, "; Lng: ", new_lng);
		});
		
		map.controls[google.maps.ControlPosition.TOP_RIGHT].push(document.getElementById('layercontainer'));

		toggleLayer('muni');
	}

	function tileToQuadKey(x, y, zoom) {
		var quad = "";
		for (var i = zoom; i > 0; i--) {
			var mask = 1 << (i - 1);
			var cell = 0;
			if ((x & mask) != 0) cell++;
			if ((y & mask) != 0) cell += 2;
			quad += cell;
		}
		return quad;
	}

	function insertMapOverlay(config) {
		var self = this;
		var tileArtLayer = new google.maps.ImageMapType({
			getTileUrl: function (coord, zoom) {
				return config.tileURL.replace("{quadkey}", tileToQuadKey(coord.x, coord.y, zoom));
			},
			tileSize: new google.maps.Size(256, 256),
			name: config.name
		});
		map.overlayMapTypes.insertAt(config.index, tileArtLayer);
	}

	function enableMapArt(name) {
		for (var i = 0; i < map.overlayMapTypes.length; i++) {
			map.overlayMapTypes.setAt(i, null);
		}

		//enable / disable
		for (var i = 0; i < mapArtLayers.length; i++) {
			if (mapArtLayers[i].name == name) {
				mapArtLayers[i].enabled = !mapArtLayers[i].enabled;
			}

			if (mapArtLayers[i].enabled) {
				insertMapOverlay(mapArtLayers[i]);
			}
			if (map.overlayMapTypes.length < mapArtLayers[i].index) {
				map.overlayMapTypes.insertAt(mapArtLayers[i].index, null);
			}
		}
	}

	function collapse() {
		var menu = document.getElementById('layermenu');
		if (menu.className.indexOf('hidden') != -1) {
			menu.className = menu.className.substr(0, menu.className.indexOf(' hidden'));
		}
		else {
			menu.className += ' hidden';
		}
	}

	function toggleLayer(el) {
		if (typeof el == 'string') {
			el = document.getElementById(el + 'layer');
			el.checked = true;
			el.onchange();
		}
		else {
			var type = el.name;
			var checked = el.checked;
			var config = null;
			for (var i = 0; i < mapArtLayers.length; i++) {
				if (type == mapArtLayers[i].name) {
					config = mapArtLayers[i];
				}
			}

			if (checked != config.enabled) {
				enableMapArt(config.name);
			}
		}
	}

	var geocoder = null;
	var infowindow = null;
	var marker = null;
	function search() {
		var query = document.getElementById('geosearch').value;
		if (!query) {
			return;
		}

		if (!geocoder) {
			geocoder = new google.maps.Geocoder;
		}

		geocoder.geocode({ 'address': query, 'region': 'CA' }, function (results, status) {
			if (status != 'OK' || !results || results.length == 0) {
				return alert('Unable to locate address');
			}

			if (results && results.length > 0) {
				var location = results[0].geometry.location;
				map.setCenter(location);
				addMarker(location, results[0].formatted_address);
			}
		});
	}

	function addMarker(location, title) {
		if (!marker) {
			marker = new google.maps.Marker({
				location: location,
				map: map,
				title: title
			});

			marker.addListener('mouseover', function () {
				displayInfowindow(marker);
			});
			marker.addListener('mouseout', function () {
				hideInfowindow(marker);
			});
		}

		marker.setPosition(location);
		marker.setTitle(title);

		var bounds = new google.maps.LatLngBounds();
		bounds.extend(location);
		map.fitBounds(bounds);
	}

	function displayInfowindow(marker) {
		if (!infowindow) {
			infowindow = new google.maps.InfoWindow({
				content: marker.title
			});
		}
		infowindow.open(map, marker);
	}
	function hideInfowindow(marker) {
		infowindow.close();
	}

	window.LayerControl = {
		collapse: collapse,
		toggleLayer: toggleLayer,
		search: search,
		init: init
	};
})(window);
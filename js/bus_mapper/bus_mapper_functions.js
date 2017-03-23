// Nick Dragunow, ndragunow.nz, all rights reserved. 

// Contains all of the helper functions used by the BusMapper map window. Most
// production code should be stored here in order to keep the index.html file clean. Try to
// declare functions in the order in which they are called (for visual clarity).

// Currently referenced by:
//		index.html (local)


////////////////////////////////////// GENERIC FUNCTIONS ////////////////////////////////////


// Implements a C#/python style String.Format() function.
// Author(s): Fabrício Matté, boxmein.
// Source: http://stackoverflow.com/questions/20729823/jquery-string-format-issue-with-0

String.prototype.format = function() {

  var str = this;

  for (var i = 0; i < arguments.length; i++) {     

    var reg = new RegExp("\\{" + i + "\\}", "gm");             
    str = str.replace(reg, arguments[i]);
  }

  return str;
}


///////////////////////////////// PROJECT SPECIFIC FUNCTIONS ////////////////////////////////


function createBusStopLayer() {
// Creates a layer from a JavaScript geoJSON formatted string of bus stops. Returns that layer.
	
	// Note that busStopLocations is defined in './data/bus_stops/outer_link_clockwise_stops.js'
	// and is imported on the index.html page, which also imports this .js file. 
	var busStopLayer = L.geoJson(busStopLocations, {style: busStopStyle});

	return busStopLayer;
}


/////////////////////////////////////////////////////////////////////////////////////////////


function requestUpdatedBusInformation() {
// Requests the location of all busses through an AJAX call. Returns GTFS formatted data.

	console.log("Updating bus location data.");

	// Create a GET request for bus locations.
	// String is as specified at https://api.at.govt.nz/docs/v1#Realtime-GET-GTFS-real-time
	aucklandTransportMessenger.open('GET', "https://api.at.govt.nz/v1/public/realtime/vehiclelocations?api_key=f45d5126-e3ce-4ea7-bcd8-99ff0655948c", true);

	// Send the AJAX request.
	aucklandTransportMessenger.send();
}


/////////////////////////////////////////////////////////////////////////////////////////////


function updateBusLocationsOnMap() {
// Updates bus locations on the map. Essentially a 'parent' function which calls all of the 
// helper functions below. Takes no input, returns nothing, but does update the following
// variables defined in index.html:

//			listOfBusLayerGroups
//			linesBetweenBusses
//			map

	// Define the list of route IDs which service the clockwise outer link. Note: in future
	// this (and other route definitions) will be built on page load.
	var routesServicingClockwiseOuterLink = [
		"73102",
		"73104",
		"73106",
		"73108",
		"73110"]
	
	// Anti-clockwise route. Currently unused.
	var routesServicingAnticlockwiseOuterLink = [
		"72101",
		"72103",
		"72105",
		"72107",
		"72111"]

	// Log the return of data - #TODO: expand this by returning the status code.
	console.log("Data received.");

	// Save the data to a local variable.
	var returnedData = aucklandTransportMessenger.responseText;

	// Remove the header and split the input into a list of data for individual busses. 
	var splitBusList = splitInputIntoListOfBusData(returnedData);

	// Loop through the data for each bus, saving those servicing the clockwise outer link route. 
	for (index = 0; index < splitBusList.length; index++) {

		// Grab the GTFS data for the current bus.
		var currentBus = splitBusList[index]

		// Extract the bus's route ID.
		var routeId = getRouteId(currentBus);

		// Split the unique route ID number away from the variable trailing data information.
		var routeIdWithoutVersionNumber = routeId.substring(0, 5);

		// If the route ID is in the clockwise Outer Link list, push its coordinates to the map.
		if (routesServicingClockwiseOuterLink.indexOf(routeIdWithoutVersionNumber) >= 0) {
			
			// Extract the bus's id number.
			var busNumber = getBusNumber(currentBus);

			// Extract the bus's lat and long (returned as an array - essentially a tuple).
			var busCoordinatesInArray = getLatitudeAndLongitude(currentBus);

			// Extract the bus's bearing (if it's available - returns null if it's not moving).
			var busBearing = getBearing(currentBus);

			// We've got a bus that's servicing the right route, and we've got all its relevant 
			// data. Now we determine if a layerGroup for that bus ID number exists, and if not, we
			// create one.

			var loopIterator = 0;

			// Determine if there is a layerGroup associated with the given bus number (these
			// are created at runtime because bus numbers change so frequently).
			for (i in listOfBusLayerGroups) {

				// Actual test of equality (does this container's name match that of the new bus?)
				if (busNumber == listOfBusLayerGroups[i].name) {

					loopIterator = 1;

					// Add the new coordinates to the layer of coordinates for this bus.
					addBusMarkerToLayerGroup(listOfBusLayerGroups[i].layerGroup, busCoordinatesInArray, busBearing, busNumber);
				}
			}

			// If there is no associated layer for this bus, we create one (it's nested within a 
			// layerContainer object, allowing us to associate a bus name with each layer).
			if (loopIterator == 0) {

				var layerContainer = {
					name: busNumber,
					layerGroup: L.layerGroup().addTo(map)
				};

				// Add the new coordinates to the layer of coordinates for this bus.
				addBusMarkerToLayerGroup(layerContainer.layerGroup, busCoordinatesInArray, busBearing, busNumber);
				
				// Add our new layerContainer object to the list of such objects (defined in index) -
				// even though globals are poor form.
				listOfBusLayerGroups.push(layerContainer);
			}
		}
	}

	// Note - this function must be called here (rather than in index.html) because the 
	// updateBusLocationsOnMap function runs asynchronously due to being called by an event
	// listener - if drawLinesBetweenBusses were called in index.html, it could run before the 
	// update function, which would be highly undesirable. 

	// Draw routing lines between every coordinate pair for each bus (deleting the oldest if
	// the length of the list of markers is > 12).
	updateLinesBetweenBusMarkers();
}


/////////////////////////////////////////////////////////////////////////////////////////////


function splitInputIntoListOfBusData(inputGtfsData) {
// Takes a GTFS formatted string of all busses in Auckland, and splits them into a list of strings
// where each string contains information for an individual bus.

	// Find the index at which the header ends, create a sublist with no header.
	var indexWhereHeaderEnds = inputGtfsData.indexOf("[");
	var stringOfBusses = inputGtfsData.slice(indexWhereHeaderEnds + 1);

	// Split that string of busses into a list of strings (each ends with "}},").
	var splitBusList = stringOfBusses.split("}},");

	return splitBusList;
}


/////////////////////////////////////////////////////////////////////////////////////////////


function getRouteId(thisBusGtfsData) {
// Takes a GTFS formatted string for a given bus and returns its route id (var).

	// Add 11 to the index to skip ahead of the 'route_id:' string to the actual value.
	var indexOfRouteId = thisBusGtfsData.indexOf("route_id\":") + 11;
	var routeId = thisBusGtfsData.substring(indexOfRouteId, indexOfRouteId + 26);

	return routeId;
}


/////////////////////////////////////////////////////////////////////////////////////////////


function getBusNumber(thisBusGtfsData) {
// Takes a GTFS formatted string for a given bus and returns its identification number (a 4 char string).

	// Find the location of the ID property in the input text.
	var indexOfBusId = thisBusGtfsData.indexOf("\"vehicle\":{\"id\":\"") + 17;

	// Return the 4 char string ID.
	return(thisBusGtfsData.substring(indexOfBusId, indexOfBusId + 4));
}


/////////////////////////////////////////////////////////////////////////////////////////////


function getLatitudeAndLongitude(thisBusGtfsData) {
// Takes a GTFS formatted string for a given bus and returns its lat and long (tuple of digit vars).

	// Grab the indicies of the lat and long coords in the GTFS data.
	var indexOfLatitude = thisBusGtfsData.indexOf("latitude\":") + 10;
	var indexOfLongitude = thisBusGtfsData.indexOf("longitude\":") + 11;

	// Extract the 10 characters following the start of the lat and long coords.
	var currentLatitude = thisBusGtfsData.substring(indexOfLatitude, indexOfLatitude + 10);
	var currentLongitude = thisBusGtfsData.substring(indexOfLongitude, indexOfLongitude + 10);

	// Use regex to strip everything that isn't in "0-9", "-", or ".".
	currentLatitude = currentLatitude.replace(/[^0-9-\.]/g, "");
	currentLongitude = currentLongitude.replace(/[^0-9-\.]/g, "");

	return ([currentLatitude, currentLongitude]);
}


/////////////////////////////////////////////////////////////////////////////////////////////


function getBearing(thisBusGtfsData) {
// Takes a GTFS formatted string for a given bus and returns its bearing (string) if available.
// Returns null if the data has no bearing attribute (it's not moving). 

	// Grab the index of the bearing data in the overall bus data string.
	var indexOfBearing = thisBusGtfsData.indexOf("\"bearing\":") + 11;

	// Continue processing if the bearing property was found (some bus records don't have it).
	if (indexOfBearing != 10) {

		// Grab the bearing from the string.
		var currentBearing = thisBusGtfsData.substring(indexOfBearing, indexOfBearing + 3);

		// Strip excess characters (anything that isn't in [0-9], "-", or ".").
		currentBearing = currentBearing.replace(/[^0-9-\.]/g, "");

		return currentBearing;

	// Return null if the record for this bus doesn't the bearing property. 
	} else {

		return null;
	}
}


/////////////////////////////////////////////////////////////////////////////////////////////


function addBusMarkerToLayerGroup(layerGroup, busCoordinates, busBearing, busNumber) {
// Takes a leaflet layerGroup object and a number of bus-specific variables (like coordinates),
// defines a new marker based off those variables, and then adds it to the specified layerGroup.

	// Create a Date object.
	currentTime = new Date();

	// If the bus has a bearing (is moving):
	if (busBearing != null) {

		// Add a 'moving' marker to the map with its ID number, lat, long, bearing, and the current time.
		layerGroup.addLayer(L.marker([busCoordinates[0], busCoordinates[1]], {rotationAngle: busBearing, icon: outerLinkMoving}).addTo(map).bindPopup("<strong>Bus {0}</strong><br>Moving as of {1}.".format(busNumber, currentTime.toLocaleTimeString())));

	// If the bus has no bearing (isn't moving):
	} else {

		// Add a 'stopped' marker to the map with its ID number, lat, long, and the current time.
		layerGroup.addLayer(L.marker([busCoordinates[0], busCoordinates[1]], {icon: outerLinkStopped}).addTo(map).bindPopup("<strong>Bus {0}</strong><br>Stopped as of {1}.".format(busNumber, currentTime.toLocaleTimeString())));
	}
}


/////////////////////////////////////////////////////////////////////////////////////////////


function updateLinesBetweenBusMarkers() {
// We have 'listOfBusLayerGroups' defined in index.html, a list of lists which contains the map 
// markers for each bus. This function iterates through that list, building up a polyline between
// every point in each bus's marker list (different busses are not connected).

// This function also deletes the least recent marker if the list > 12 (to maintain performance).

	var sizeOfLayerGroup;
	var listOfCoordinatesForThisBus;

	// Tracks our movement through the list of markers in order to identify the most recent one.
	var indexCounter = 0;

	// Set to false after the function is run on the first (oldest) marker in the list. 
	var thisIsTheOldestMarker = true;

	// Delete old lines.
	linesBetweenBusses.clearLayers();

	// For each bus's layerGroup:
	for (i in listOfBusLayerGroups) {

		// Reset temporary variables.
		listOfCoordinatesForThisBus = [];
		indexCounter = 1;
		thisIsTheOldestMarker = true;

		// Get the number of markers in the layerGroup.
		sizeOfLayerGroup = listOfBusLayerGroups[i].layerGroup.getLayers().length;

		// For each marker within the current layerGroup:
		listOfBusLayerGroups[i].layerGroup.eachLayer(function (thisLayer) {

			// If this is the oldest marker and there are more than 15 total, remove it.
			if (sizeOfLayerGroup > 12 && thisIsTheOldestMarker) {								
				listOfBusLayerGroups[i].layerGroup.removeLayer(thisLayer);

			} else {
				
				// If the marker is not the most recent one, change its icon to reflect that.
				if (indexCounter < sizeOfLayerGroup) {
					thisLayer.setIcon(outerLinkNoLongerHere);

				// If it is the most recent marker, bring it to the front. 
				}

				// Grab that marker's coordinates, push them to the temporary list.
				listOfCoordinatesForThisBus.push(thisLayer.getLatLng());
			}

			// End of run - mark that future markers are not the oldest one in the list.
			thisIsTheOldestMarker = false;
			indexCounter += 1;
		});

		// Draw a line between every marker for the current bus.
		linesBetweenBusses.addLayer(L.polyline(listOfCoordinatesForThisBus, {color: '#f67e27'}));
	}
}


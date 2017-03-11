// Nick Dragunow, ndragunow.nz, all rights reserved. 

// Contains functions called by busMapper toolbar buttons. 

// Currently referenced by:

//		index.html (local)


////////////////////////////////////// TOOLBAR FUNCTIONS ////////////////////////////////////


function resetView() {
// Resets the map's zoom and view.
	map.setView([-36.859696, 174.749179], 13);
}


/////////////////////////////////////////////////////////////////////////////////////////////


function resetZoom() {
// Resets the map's zoom.
	map.setZoom(13);
}


/////////////////////////////////////////////////////////////////////////////////////////////


function clearPoints() {
// Clears all lines and every marker except the most recent set. 

	// Iterate through every bus layer group (containing markers for that bus).
	for (i in listOfBusLayerGroups) {

		// Get the number of markers in the layerGroup.
		sizeOfLayerGroup = listOfBusLayerGroups[i].layerGroup.getLayers().length;

		var busMarkerIndex = 1;

		// If this isn't the most recent marker, remove it. 
		listOfBusLayerGroups[i].layerGroup.eachLayer(function (thisLayer) {

			if (busMarkerIndex < sizeOfLayerGroup && sizeOfLayerGroup > 1) {

				listOfBusLayerGroups[i].layerGroup.removeLayer(thisLayer);
			}

			busMarkerIndex += 1;	
		});
	}

	// Remove every line on the map.
	linesBetweenBusses.clearLayers();
}


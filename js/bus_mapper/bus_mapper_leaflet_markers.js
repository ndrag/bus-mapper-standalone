// Nick Dragunow, ndragunow.nz, all rights reserved. 

// Contains variables declaring the behaviour of custom leaflet icons and markers. 

// Currently referenced by:

//		index.html (local)

//////////////////////////////////// CUSTOM LEAFLET ICONS ////////////////////////////////////


var outerLinkMoving = L.icon({
    iconUrl: "./data/images/outer_link_moving.png",
    iconSize:     [22, 22], // the size of the icon.
    popupAnchor:  [0, -15] // point at which the popup opens relative to the anchor.
	});

var outerLinkStopped = L.icon({
    iconUrl: "./data/images/outer_link_stopped.png",
    iconSize:     [19, 19], // the size of the icon.
    popupAnchor:  [0, -15] // point at which the popup opens relative to the anchor.
	});

var outerLinkNoLongerHere = L.icon({
    iconUrl: "./data/images/outer_link_no_longer_here.png",
    iconSize:     [6, 6], // the size of the icon.
    popupAnchor:  [0, -15] // point at which the popup opens relative to the anchor.
    });

var busStop = new L.icon({
    iconUrl: "./data/images/bus_stop.png",
    iconSize:     [17, 17], // the size of the icon.
    popupAnchor:  [0, -15] // point at which the popup opens relative to the anchor.
	});


//////////////////////////////////// CUSTOM GEOJSON STYLES ///////////////////////////////////


var busStopStyle = {
    "icon": "busStop"
};
# BusMapper
A leaflet-based web-app utilizing Auckland Transport data to live-track the locations of buses in Auckland.


BusMapper reflects the power of public sector involvement in the open data movement. Through their developer API, Auckland Transport (an Auckland Council CCO) offer access to a repository of rich spatial public transport data (in [GTFS format]("https://developers.google.com/transit/gtfs/") with entries for every vehicle currently serving a route.

Using JavaScript and Leaflet, BusMapper accesses that information, filters it, and publishes 30 second updates on the location of each bus servicing a given route (drawing a trail across the previous 11 points). Every marker is clickable, revealing the ID number of the bus and the time at which that marker was placed.

For now it only supports the Outer Link (clockwise) - the bus I catch into town - but it's designed to be easily extensible. My mid-term goal is to digitize every route and provide users with a drop-down selector, and then eventually publish it as a mobile application (more for the experience than anything else - it's surely been done before).

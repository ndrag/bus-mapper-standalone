# BusMapper
A leaflet-based web-app utilizing Auckland Transport data to live-track the locations of buses in Auckland.

12/03/17 - "route_id" identifiers have changed as of this date. Currently, the route number of a given bus is compared with a static list of Outer Link (clockwise) route numbers - this will clearly no longer be sufficient. A function must be added to retrieve "routes.txt" through the Auckland Transport API and scrub it for updated route numbers, in order to avoid alterations to that file breaking the program.

	mapboxgl.accessToken = 'pk.eyJ1IjoiY21kdXJhbiIsImEiOiJjbHgxM2l1YTEwMjYxMmxwcnFoM2pkYnp0In0.HTQaiKsTNpDofxvQJwjvXg';
    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v9',
        projection: 'globe', // Display the map as a globe, since satellite-v9 defaults to Mercator
        zoom: 11,
        center: [-73.96, 40.78] // starting position [lng, lat]
    });

    map.addControl(new mapboxgl.NavigationControl());
    map.scrollZoom.disable();

    map.on('style.load', () => {
        map.setFog({}); // Set the default atmosphere style
    

    // Load GeoJSON data and add it to the map
        map.addSource('neighborhoods', {
            type: 'geojson',
            data: 'static/data/neighborhoods.geojson' // Path to your GeoJSON file
        });

    // Add a layer to display the neighborhoods
        map.addLayer({
            'id': 'neighborhoods-layer',
            'type': 'fill',
            'source': 'neighborhoods',
            'layout': {},
            'paint': {
            'fill-color': '#888888',
            'fill-opacity': 0.4
         }
        });

    // Border around the polygons
        map.addLayer({
            'id': 'neighborhoods-outline',
            'type': 'line',
            'source': 'neighborhoods',
            'layout': {},
            'paint': {
            'line-color': '#000000',
            'line-width': 2
            }
        });

    });
        
    const boroughs = {   // Boxes for each borough
            'Manhattan': [[-74.0479, 40.6829], [-73.9067, 40.8820]],
            'Brooklyn': [[-74.0419, 40.5707], [-73.8567, 40.7394]],
            'Queens': [[-73.9626, 40.5422], [-73.7004, 40.8007]],
            'Bronx': [[-73.9339, 40.7855], [-73.7654, 40.9153]],
            'Staten Island': [[-74.2558, 40.4960], [-74.0522, 40.6490]]};
        
      
    function zoomToBorough(borough) {   // Function to zoom to a specific borough
        if (boroughs[borough]) {
                map.fitBounds(boroughs[borough], {
                    padding: {top: 10, bottom: 25, left: 15, right: 5}
                });
            }
        }
        
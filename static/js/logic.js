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
    

    //Load GeoJSON data and add it to the map
       map.addSource('neighborhoods', {
            type: 'geojson',
<<<<<<< HEAD
           data: neighborhoods // Path to your GeoJSON file
       });
=======
            data: "https://data.insideairbnb.com/united-states/ny/new-york-city/2023-12-04/visualisations/neighbourhoods.geojson" 
        });
>>>>>>> 96103cbab2e7a1ee427350695df228e20109e34e

      
    // Add a layer to display the neighborhoods
        map.addLayer({
            'id': 'neighborhoods-layer',
            'type': 'fill',
            'source': 'neighborhoods',
            'layout': {},
            'paint': {
                'fill-color': [
                    'match', ['get', 'neighbourhood_group'], 
                    'Bronx', colors['Bronx'],       // Color for Bronx
                    'Brooklyn', colors['Brooklyn'], // Color for Brooklyn
                    'Manhattan', colors['Manhattan'], // Color for Manhattan
                    'Queens', colors['Queens'],     // Color for Queens
                    'Staten Island', colors['Staten Island'], // Color for Staten Island
                    '#808080'  // Default color if no match (gray)
                ],
                'fill-opacity': 0.25
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
            'line-width': 1
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
// Connect to Flask endpoint
function buildCharts(borough) {
    d3.json("http://127.0.0.1:5000/aggregates").then((data) => {

        let parsedData = JSON.parse(data);

        // Filter the data for the desired borough
        let filteredData = parsedData.filter(results => results.Borough == borough);


        // Create the pie chart

        // Calculate the total number of rooms per room type
        function calculateRoomTypeCounts(data) {
            const counts = {};
        
            data.forEach(document => {
                const roomType = document["Room Type"];
                const count = document["Room Count"];
            
                if (counts[roomType]) {
                    counts[roomType] += count;
                }
                else {
                    counts[roomType] = count;
                }
            });
          
            return counts;
        };
          
        const roomTypeCounts = calculateRoomTypeCounts(filteredData);

        // Initialize the data for the chart
        let labels = Object.keys(roomTypeCounts);
        let values = Object.values(roomTypeCounts);

        let trace1 = [{
            values: values,
            labels: labels,
            type: 'pie'
        }];

        var layout = {
            title: "% of rooms per Room Type",
            margin: {"t": 50, "b": 0, "l": 0, "r": 0}
          };
        
        var config = {responsive: true};

        Plotly.newPlot('pie', trace1, layout, config);

    });
};

// Create bar graph
function buildBar(borough){ 
    d3.json("http://127.0.0.1:5000/amenities").then((data) => {
    
        let parsedAmData = JSON.parse(data);

        //Filter data for chosen borough:
        let filteredAmData = parsedAmData.filter(results => results.Borough == borough); 
        
        const neighbourhoodCounts = {};
        
        filteredAmData.forEach(document => {
                const neighbourhood = document["Neighbourhood"];
                const amenity = document["amenities"];
                const count = document["count"];
                //
                if (!neighbourhoodCounts[neighbourhood]) {
                    neighbourhoodCounts[neighbourhood] = {};
                }
                if (neighbourhoodCounts[neighbourhood][amenity]){
                    neighbourhoodCounts[neighbourhood][amenity] += count;
                } else {
                    neighbourhoodCounts[neighbourhood][amenity] = count;
                }
                }
             );
          
            
        const neighbourhoods = Object.keys(neighbourhoodCounts)

        //setting up an array to iterate and create traces for each amenity
        // ...new Set removes duplicates from the array (Set does not contain duplicates) and consolidate amenity numbers
        const amenities = [...new Set(filteredAmData.map(item => item.amenities))];

        const traces = amenities.map(amenity => {
            return {
                x: neighbourhoods,
                //incase of 0 values for amenity counts
                y: neighbourhoods.map(neighbourhood => neighbourhoodCounts[neighbourhood][amenity] || 0),
                name: amenity,
                type: 'bar'
            };  
        });

        const layout = { 
            title: "Popular Neighbourhood Amenities", 
            barmode: 'stack',
            yaxis: {title: 'Count'}
        };

        const barConfig = {responsive: true};


        Plotly.newPlot('bar', traces, layout, barConfig);

})};

// Initialize the map
mapboxgl.accessToken = 'pk.eyJ1IjoiY21kdXJhbiIsImEiOiJjbHgxM2l1YTEwMjYxMmxwcnFoM2pkYnp0In0.HTQaiKsTNpDofxvQJwjvXg';
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v9',
    projection: 'globe', // Display the map as a globe, since satellite-v9 defaults to Mercator
    zoom: 11,
    center: [-73.96, 40.78] // starting position [lng, lat]
});

// Add map controls
map.addControl(new mapboxgl.NavigationControl());
map.scrollZoom.disable();


map.on('style.load', () => {
    map.setFog({}); // Set the default atmosphere style

    map.addSource('neighborhoods', {
        type: 'geojson',
        data: "https://data.insideairbnb.com/united-states/ny/new-york-city/2023-12-04/visualisations/neighbourhoods.geojson" 
    });

    //colors for each neighbourhood_group
    const colors = {
        'Bronx': '#ff0000',        // Red for Bronx
        'Brooklyn': '#00ff00',     // Green for Brooklyn
        'Manhattan': '#0000ff',    // Blue for Manhattan
        'Queens': '#ffff00',       // Yellow for Queens
        'Staten Island': '#ff00ff' // Purple for Staten Island
    };     

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

// Add markers for each borough
function buildLayer (data, borough, map){
    let filteredData = data.filter(results => results.neighbourhood_group_cleansed == borough);
    let dataArr = []

    // Create Feature data for geoJSON object
    filteredData.forEach(document => {
        var data =  {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [document.longitude, document.latitude]
            },
            "properties": {
                "title": document.name,
                "room_type": document.room_type,
                "price": document.price
            }
        };
        dataArr.push(data);
    });

    // Add layer to the map
    if (!map.getLayer(borough+"-layer")) {

        const sourceName = borough + "Source"
        map.addSource(sourceName, {
        "type": "geojson",
        "data": {
            "type": "FeatureCollection",
            "features": dataArr
        }
        });
        map.addLayer({
        "id": borough+"-layer",
        "type": "symbol",
        "source": sourceName,
        "layout": {
            "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
            "text-offset": [0, 0.6],
            "text-anchor": "top",
            "icon-image": "star-15",
            "icon-allow-overlap": true,
            "visibility": "visible"
        },
        "paint":{
            "icon-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 0.5, 1.0]
        }
        });
    }
    else {
        map.setLayoutProperty(borough+"-layer", "visibility", "visible");
    }

    // Add popups to each marker
    map.on('click', borough + '-layer', function (e) {
        var coordinates = e.features[0].geometry.coordinates.slice();
        var title = e.features[0].properties.title;
        var roomType = e.features[0].properties.room_type;
        var price = e.features[0].properties.price;
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }
        new mapboxgl.Popup().on('open', function (pop) {
        }).setLngLat(coordinates).setMaxWidth(500).setHTML(`<h4>${roomType}</h4> <hr> <h4>Price: $${price}</h4>`)
        .addTo(map);
  });
};


// Fetch data from your API endpoint
function changeLayer(borough) {
    fetch('http://127.0.0.1:5000/main')
        .then(response => response.json())
        .then(data => {
            let parsedData = JSON.parse(data);

            // Create layer for borough
            buildLayer(parsedData, borough, map);
        
        });
    };


    
const boroughBoxes = {   // Boxes for each borough
    'Manhattan': [[-74.0479, 40.6829], [-73.9067, 40.8820]],
    'Brooklyn': [[-74.0419, 40.5707], [-73.8567, 40.7394]],
    'Queens': [[-73.9626, 40.5422], [-73.7004, 40.8007]],
    'Bronx': [[-73.9339, 40.7855], [-73.7654, 40.9153]],
    'Staten Island': [[-74.2558, 40.4960], [-74.0522, 40.6490]]
};
    

// Function to change view to a different borough
function changeBorough(borough, first) {

    // Select previous borough
    let previousBorough = d3.select(".prev_value");
    
    // Zoom to specified borough
    map.fitBounds(boroughBoxes[borough], {
        padding: {top: 10, bottom: 25, left: 15, right: 5}
    });

    // Create plots
    buildCharts(borough);
    buildBar(borough);

    // Render the correct layer
    if (first != "First") {
    map.setLayoutProperty(previousBorough.attr("value") + "-layer", "visibility", "none");
    }
    changeLayer(borough);

    // Set current borough as previous borough
    previousBorough.attr("value", borough);
};

// Run on page load
function init() {
    changeBorough("Manhattan", "First");
};

init();
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

        Plotly.newPlot('pie', trace1, layout);

    });
};

function buildBar(borough){ 
    d3.json("http://127.0.0.1:5000/amenities").then((data) => {
    
        let parsedAmData = JSON.parse(data);

        //Filter data for chosen borough:
        let filteredAmData = parsedAmData.filter(results => results.Borough == borough); 

        function calculateRoomTypeCounts(data) {
            const neighbourhoodCounts = {};
        
            data.forEach(document => {
                const neighbourhood = document["Neighbourhood"];
            
                if (neighbourhoodCounts[neighbourhood]) {
                    neighbourhoodCounts[neighbourhood] += document.count;
                }
                else {
                    neighbourhoodCounts[neighbourhood] = document.count;
                }
            });
          
            return neighbourhoodCounts;
        };
          
        const roomTypeCounts = calculateRoomTypeCounts(filteredAmData);

        let labels = Object.keys(roomTypeCounts);
        let values = Object.values(roomTypeCounts);

        const barTrace = { 
                type: "bar", 
                x: labels,
                y: values,
                marker:{ 
                    color: 'blue' 
                }

        }

        const bar_data = [barTrace];

        const barLayout = { 
            title : "Popular Amenities per Nbhd", 
            barcornerradius: 15

        };

        Plotly.newPlot('bar', bar_data, barLayout)

})};


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


    
const boroughBoxes = {   // Boxes for each borough
    'Manhattan': [[-74.0479, 40.6829], [-73.9067, 40.8820]],
    'Brooklyn': [[-74.0419, 40.5707], [-73.8567, 40.7394]],
    'Queens': [[-73.9626, 40.5422], [-73.7004, 40.8007]],
    'Bronx': [[-73.9339, 40.7855], [-73.7654, 40.9153]],
    'Staten Island': [[-74.2558, 40.4960], [-74.0522, 40.6490]]
};
    

// Function to change view to a different borough
function changeBorough(borough) {
    
    map.fitBounds(boroughBoxes[borough], {
        padding: {top: 10, bottom: 25, left: 15, right: 5}
    });

    buildCharts(borough);
    buildBar(borough);
};

// Run on page load
function init() {
    changeBorough("Manhattan");
};

init();
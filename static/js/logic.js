// Connect to Flask endpoint
function buildCharts(borough) {
    d3.json("http://127.0.0.1:5000/aggregates").then((data) => {

        let parsedData = JSON.parse(data);

        // Filter the data for the desired borough
        let filteredData = parsedData.filter(results => results.Borough == borough);
        console.log(filteredData)

        //Create the pie chart

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
            margin: { "t": 50, "b": 0, "l": 0, "r": 0 }
        };

        var config = { responsive: true };

        Plotly.newPlot('pie', trace1, layout, config);

        // Retrieve chart data
        let boxPlotData = filteredData.reduce((name, item) => {
            if (!name[item["Room Type"]]) {
                name[item["Room Type"]] = [];
            }
            name[item["Room Type"]].push(item["Average Price"]);
            return name
        }, {})

        console.log(boxPlotData)

        // Initiate chart data

        let entireHomeTrace = {
            y: boxPlotData["Entire home/apt"],
            type: "box",
            name: "Entire Home"

        }
        let hotelRoomTrace = {
            y: boxPlotData["Hotel room"],
            type: "box",
            name: "Hotel Room"
        }
        let privateRoomTrace = {
            y: boxPlotData["Private room"],
            type: "box",
            name: "Private Room"
        }
        let sharedRoomTrace = {
            y: boxPlotData["Shared room"],
            type: "box",
            name: "Shared Room"
        }
        let all_data = [entireHomeTrace, hotelRoomTrace, privateRoomTrace, sharedRoomTrace]

        const priceLayout = {
            title: "Average Prices by Borough"
        };

        Plotly.newPlot('box', all_data, priceLayout);

    
    });
}

function buildBar(borough) {
    d3.json("http://127.0.0.1:5000/amenities").then((data) => {
        let parsedAmData = JSON.parse(data);
        let filteredAmData = parsedAmData.filter(results => results.Borough == borough);
        const neighbourhoodCounts = {};
        filteredAmData.forEach(document => {
            const neighbourhood = document["Neighbourhood"];
            const amenity = document["amenities"];
            const count = document["count"];
            if (!neighbourhoodCounts[neighbourhood]) {
                neighbourhoodCounts[neighbourhood] = {};
            }
            if (neighbourhoodCounts[neighbourhood][amenity]) {
                neighbourhoodCounts[neighbourhood][amenity] += count;
            } else {
                neighbourhoodCounts[neighbourhood][amenity] = count;
            }
        });

        const neighbourhoods = Object.keys(neighbourhoodCounts);
        const amenities = [...new Set(filteredAmData.map(item => item.amenities))];

        const traces = amenities.map(amenity => {
            return {
                x: neighbourhoods,
                y: neighbourhoods.map(neighbourhood => neighbourhoodCounts[neighbourhood][amenity] || 0),
                name: amenity,
                type: 'bar'
            };
        });

        const layout = {
            title: "Popular Neighbourhood Amenities",
            barmode: 'stack',
            yaxis: { title: 'Count' }
        };

        const barConfig = { responsive: true };

        Plotly.newPlot('bar', traces, layout, barConfig);
    });
}

// Functions to display summary statistics for the selected neighborhood

//Declare a global variable to initialize neighbourhood names: 

let globalNbhds = []; 

//Create function to initialize neighbourhoods: 
function initializeNeighborhoods(borough) {
    d3.json("http://127.0.0.1:5000/aggregates").then((data) => {
        let parsedData = JSON.parse(data);
        let filteredData = parsedData.filter(results => results.Borough == borough);
        console.log("borough here")
        console.log(filteredData)
        globalNbhds = [...new Set(filteredData.map(d => d.Neighbourhood))];
        populateNeighborhoods(globalNbhds);
        
//By default display summary statistics of first neighborhood      
        if (globalNbhds.length > 0) {
            displaySummaryStats(globalNbhds[0]);
        ;
}})}

//Create function to append dropdown with neighbourhoods: 
function populateNeighborhoods(neighborhoods) { 
    let dropdown = d3.select("#selNeighborhood");
    dropdown.html("");
    neighborhoods.forEach(nbhd => {
        dropdown.append("option").text(nbhd).property("value", nbhd);
    });
    dropdown.on("change", function() {
        const newNeighbourhood = d3.select(this).property("value");
        displaySummaryStats(newNeighbourhood);
    });
}
//create function to append and display summary stats 
function displaySummaryStats(nbhd) {
    d3.json("http://127.0.0.1:5000/aggregates").then((data) => {
        let parsedData = JSON.parse(data);
        let filteredData = parsedData.filter(results => results.Neighbourhood === nbhd);

        const avgPrices = {
            "Entire home/apt": 0,
            "Hotel room": 0,
            "Private room": 0,
            "Shared room": 0
        };

        const roomTypeCounts = {
            "Entire home/apt": 0,
            "Hotel room": 0,
            "Private room": 0,
            "Shared room": 0
        };

        filteredData.forEach(result => {
            const roomType = result["Room Type"];
            const avgPrice = result["Average Price"];
            avgPrices[roomType] += avgPrice;

            if (!isNaN(avgPrice)){ 
                avgPrices[roomType] += avgPrice;
                roomTypeCounts[roomType] += 1;
            }
            roomTypeCounts[roomType] += 1;
        });

        const panel = d3.select("#summary-stats");
        panel.html("");

        Object.entries(avgPrices).forEach(([roomType, totalAvgPrice]) => {
            const count = roomTypeCounts[roomType];
            const avgPrice = totalAvgPrice / count;
            panel.append("p").text(`${roomType.toUpperCase()}: $${avgPrice.toFixed(2)}`);
        });
    });
}


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

    //Setting up appending and borough cycling for Avg price drop down:
    // let defaultBorough = 'Manhattan';
    
    //initializeNeighborhoods(defaultBorough);
   
    d3.select("#selBorough").property("value", "Manhattan");

    d3.select("#selBorough").on("change", function() {
        const selectedBorough = d3.select(this).property("value");
        initializeNeighborhoods(selectedBorough);
    });
});


// Declare global variables
let activePopup = null;

// Function to close the active popup
function closePopup() {
    if (activePopup) {
        activePopup.remove();
        activePopup = null;
    }
}

// Add markers for each borough
function buildLayer(data, borough, map) {
    let filteredData = data.filter(results => results.neighbourhood_group_cleansed == borough);
    let dataArr = []

    // Create Feature data for geoJSON object
    filteredData.forEach(document => {
        var data = {
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
    if (!map.getLayer(borough + "-layer")) {

        const sourceName = borough + "Source"
        map.addSource(sourceName, {
            "type": "geojson",
            "data": {
                "type": "FeatureCollection",
                "features": dataArr
            }
        });
        map.addLayer({
            "id": borough + "-layer",
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
            "paint": {
                "icon-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 0.5, 1.0]
            }
        });
    }
    else {
        map.setLayoutProperty(borough + "-layer", "visibility", "visible");
    }

    // Add popups to each marker
    map.on('mouseenter', borough + '-layer', function (e) {
        closePopup();

        var coordinates = e.features[0].geometry.coordinates.slice();
        var title = e.features[0].properties.title;
        var roomType = e.features[0].properties.room_type;
        var price = e.features[0].properties.price;
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }
        activePopup = new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setMaxWidth(500)
            .setHTML(`<h4>${roomType}</h4> <hr> <h4>Price: $${price}</h4>`)
            .addTo(map);
        });
    };

// Fetch data from your API endpoint
function changeLayer(borough) {
    closePopup();
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
        padding: { top: 10, bottom: 25, left: 15, right: 5 }
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
    initializeNeighborhoods(borough)
};

// Run on page load
function init() {
    //let selector = d3.select

    let defaultBorough = "Manhattan"
    changeBorough(defaultBorough, "First")
    //initializeNeighborhoods(defaultBorough)
    displaySummaryStats("Battery Park City")
}

map.addControl(
    new MapboxDirections({
        accessToken: mapboxgl.accessToken
    }),
    'top-left'
);

// function optionChanged(newBorough){
//     initializeNeighborhoods(newBorough)
// }

init();


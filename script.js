// Adding modal functionality for the "About" button
const linkAbout = document.getElementById("linkAbout");
const modalAbout = document.getElementById("modalAbout");
const closeBtn = document.getElementById("closeBtn");

linkAbout.addEventListener("click", function(event){
    event.preventDefault();
    modalAbout.style.display = "block";
    console.log("Show About section");

});

closeBtn.addEventListener("click", function(){
    modalAbout.style.display = "none";
    console.log("close About section");
});

// Close the about section - click outside modal window
window.addEventListener("click", function(event){
    if(event.target == modalAbout){
        modalAbout.style.display = "none";

    }
})

// Global Variables
let map;
let birdData = [];
// let markers = [];
let speciesList = [];
let colorScale;
let lineChart;
let barChart;
let birdMarker;

// Delaying the visualization on load 
const refresh = (fn, delay = 300) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
    };
}

const refreshedUpdate = refresh(updateVisualizations, 300);

// Wait for DOM to load before fetching the bird observation data
document.addEventListener('DOMContentLoaded', function () {
    console.log('Loading DOM and fetching the data')
    fetch('Cleaned_BirdData_15June.json')
        .then(response => response.json()) 
        .then(data => {
            birdData = data;
            birdData.forEach(obs => {
                obs.parsedDate = new Date(obs.date); //convert Date strings --> objects

            });
            console.log(`load ${birdData.length} for obeserving Bird data`)
            //initializeApp();
            processData();
            mapSetup();
            chartSetup();
            filterSetup();
            updateVisualizations();
        })
        .catch(error => console.error('Error loading bird data:', error));
});

//Calling the functions
// const initializeApp = () => {
//     processData();
//     mapSetup();
//     chartSetup();
//     filterSetup();
//     updateVisualizations();
// }

// initializing the Map (Leaflet) focusing on N. America 
const mapSetup = () => {
    map = L.map('map').setView([45, -95], 4);  //N. America co ordinates and zoom level
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    //layering of the bird observation data marker on the map
    birdMarker = L.layerGroup().addTo(map);

    console.log("Initialization of Map completed and Bird Markers kept ready!")
}

// Initializing the charts (line and bar charts)
const  chartSetup = () => {
    lineChart = echarts.init(document.getElementById('line-chart'));
    barChart = echarts.init(document.getElementById('bar-chart'));

    const baseChartOption = {
        tooltip: { trigger: 'item' },  //tooltip visibility on hover over data point
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true }
    };

    lineChart.setOption(baseChartOption);
    barChart.setOption(baseChartOption);

    //charts responsive on window resizing..
    window.addEventListener('resize', () => {
        lineChart.resize();
        barChart.resize();
    });
}

// Initializing the filters - Bird Species, Date Range, Seasons and Snow depth
const filterSetup = () =>{
    const speciesDropdown = document.getElementById('species-select');

    //Reading each bird species data into the dropdown options
    speciesList.forEach(species => {
        const option = document.createElement('option');
        option.value = species;
        option.textContent = species;
        speciesDropdown.appendChild(option);
    });

    console.log(`Populating the bird species dropdown`);

    // On selection of bird species, season, snow depth refresh the visualization
    speciesDropdown.addEventListener('change', refreshedUpdate);
    document.getElementById('season-select').addEventListener('change', refreshedUpdate);
    document.getElementById('snow-select').addEventListener('change', refreshedUpdate);

    //Setting the Date Range filter
    flatpickr("#calendar-select", {
        mode: "range",
        dateFormat: "Y-m-d",
        defaultDate: [
            new Date(Math.min(...birdData.map(d => d.parsedDate))),
            new Date(Math.max(...birdData.map(d => d.parsedDate)))
        ],
        onChange: refreshedUpdate  //Refresh the visualization on change of the Date Range
    });

    console.log(`Calendar filter intialized to pick the date`);
    console.log(`Hiding the Bird Species details`)
}

// Unique Bird Species list and color code for each of them

const processData = () => {

    // Set to hold the unique bird species names
    const uniqueSpecies = new Set();

    birdData.forEach(obs => uniqueSpecies.add(obs.primary_com_name));

    //Converting Set to sorted Array - Used in dropdowns
    speciesList = Array.from(uniqueSpecies).sort();

    console.log(`Unique Bird speices list ${speciesList.length}`)

    // Color codes generated for unique bird species
    colorScale = chroma.scale(['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
        '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'])
        .mode('lch').colors(speciesList.length);

    console.log(`different scale of colors for each species of Bird`)
}

// Apply filters data and update the map and charts

function updateVisualizations() {

    //Reading the values from the filters in UI
    const selectedSpecies = document.getElementById('species-select').value;
    const dateRange = document.getElementById('calendar-select')._flatpickr.selectedDates;
    const selectedSeason = document.getElementById('season-select').value;
    const selectedSnow = document.getElementById('snow-select').value;

    console.log(`Applying the filters and updating the visualization!`);

    let filteredData = birdData.filter(observation => {

        //Filter by Bird Species values
        if (selectedSpecies !== 'all' && observation.primary_com_name !== selectedSpecies) return false;

        //Filter by Date Range
        if (dateRange && dateRange.length === 2) {
            if (observation.parsedDate < dateRange[0] || observation.parsedDate > dateRange[1]) return false;
        }

        //Filter by Season
        if (selectedSeason !== 'all') {
            const seasonMap = {
                'winter': ['Winter'], 'spring': ['Spring'], 'summer': ['Summer'], 'fall': ['Autumn']
            };
            if (!seasonMap[selectedSeason].includes(observation.season)) return false;
        }

        //Filter by snow depth
        if (selectedSnow !== 'all') {
            const depth = observation.snow_dep_atleast;
            if ((selectedSnow === 'none' && depth > 0) ||
                (selectedSnow === 'light' && (depth <= 0 || depth > 5)) ||
                (selectedSnow === 'moderate' && (depth <= 5 || depth > 15)) ||
                (selectedSnow === 'heavy' && depth <= 15)) return false;
        }
        return true;
    });

    console.log(`Filtered Bird Data - ${filteredData.length} observations`);

    //Calling function to Update the charts and map based on the filtered values
    updateMap(filteredData);
    updateCharts(filteredData);
}

// Map markers updating using the filtered data
const updateMap = (filteredData) => {
    birdMarker.clearLayers(); 

    console.log(`Clear the existing markers from the Map`);

    //Adding new marker for each bird sighting observations
    filteredData.forEach(obs => {
        const idx = speciesList.indexOf(obs.primary_com_name);

        //unique colored circle marker for each bird species
        const marker = L.circleMarker([obs.latitude, obs.longitude], {
            radius: 6,
            fillColor: colorScale[idx], 
            color: '#000',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        });

        //pop-up with bird info
        marker.bindPopup(`<b>${obs.primary_com_name}</b><br>Scientific: ${obs.sci_name}<br>Date: ${obs.parsedDate.toLocaleDateString()}<br>Count: ${obs.how_many}<br>Season: ${obs.season}<br>Snow Depth: ${obs.snow_dep_atleast} cm`);
        marker.on('click', () => showObservationDetails(obs));
        birdMarker.addLayer(marker);
    });

    //zoom up to fit the screen for the markers
    if (filteredData.length > 0) {
        const bounds = L.latLngBounds(filteredData.map(d => [d.latitude, d.longitude]));
        map.flyToBounds(bounds, { padding: [30, 30], maxZoom: 10 });
    }
}

//Updating charts using filtered data
const updateCharts = (filteredData) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthCounts = Array(12).fill(0); //initialize the bird count to zero for each month

    //Bird count per month
    filteredData.forEach(obs => {
        monthCounts[obs.parsedDate.getMonth()] += obs.how_many;
    });

    //per species total count
    let speciesCounts = {};
    filteredData.forEach(obs => {
        let species = obs.primary_com_name;
        let count = obs.how_many;
        if (!speciesCounts[species]) speciesCounts[species] = 0;
        speciesCounts[species] += count;
    });

    //Sort the bird species count in descending order to get the top 10 species.
    const sortedSpecies = Object.entries(speciesCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    let barCategories = [];
    let barValues = [];
    sortedSpecies.forEach(item => {
        barCategories.push(item[0]);
        barValues.push(item[1]);
    });
    

    // Monthly bird count on the Line chart
    lineChart.setOption({

        xAxis: { 
            type: 'category', 
            data: months, axisLabel: { rotate: 45 } //tilted labelling
        }, 

        yAxis: { 
            type: 'value', 
            name: 'Count' 
        },

        series: [{
            data: monthCounts,
            type: 'line', smooth: true,
            lineStyle: { width: 3, color: '#3498db' },
            itemStyle: { color: '#3498db' },
            areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: 'rgba(52, 152, 219, 0.5)' },
                    { offset: 1, color: 'rgba(52, 152, 219, 0.1)' }
                ])
            }
        }],

        //Tooltip on the line chart showing the month and bird count on hovering the line
        tooltip: { 
            trigger: 'axis', 
            formatter: '{b}<br/>Count: {c}' 
        }
    });

    // Top 10 bird species by count
    barChart.setOption({
        xAxis: { 
            type: 'category', 
            data: barCategories, 
            axisLabel: { interval: 0, rotate: 30 } 
        },

        yAxis: { 
            type: 'value', 
            name: 'Count' 
        },

        series: [{
            data: barValues,
            type: 'bar',
            itemStyle: {
                color: function (params) {
                    const index = speciesList.indexOf(barCategories[params.dataIndex]);
                    return index >= 0 ? colorScale[index] : '#999';
                }
            }
        }],

        //Tooltip to show the Bird Species name and its count on hovering bar chart 
        tooltip: { 
            trigger: 'axis', 
            axisPointer: { type: 'shadow' }, 
            formatter: '{b}<br/>Count: {c}' 
        }
    });
}

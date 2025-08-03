let sampleData = [];

fetch('http://localhost:3000/data')
    .then(response => response.json()) // parse JSON response
    .then(responseJson => {
        const data = responseJson.data;
        //filter source
        let sources = data.map(s => s.source);
        sources = sources.filter(function (item, pos) {
            return sources.indexOf(item) == pos;
        })

        sources = sources.slice(0, 15)
        sources.forEach(s => {
            var fragment = create(`<option value="${s}">${s}</option>`);
            document.getElementById('source-filter').appendChild(fragment)
        })

        //filter topics
        let topics = data.map(d => d.topic);
        console.log('sources = ', sources)

        topics = topics.filter(function (item, pos) {
            return topics.indexOf(item) == pos;
        })

        topics = topics.slice(0, 15)
        sampleData.push(...data);

        function create(htmlStr) {
            var frag = document.createDocumentFragment(),
                temp = document.createElement('div');
            temp.innerHTML = htmlStr;
            while (temp.firstChild) {
                frag.appendChild(temp.firstChild);
            }
            return frag;
        }

        topics.forEach(t => {
            var fragment = create(`<option value="${t}">${t}</option>`);
            document.getElementById('topic-filter').appendChild(fragment)
        })
        onTopicUpdate("oil");
    })
    .catch(error => console.log('Error:', error));


function onTopicUpdate(topic) {
    const filteredData = sampleData
        .filter(d => d.topic === topic)
        .sort((a, b) => b.intensity - a.intensity); // Sort by intensity (highest first)
    renderDashboard(filteredData)
}

function onSourceUpdate(source) {
    const filteredData = sampleData
        .filter(d => d.source === source)
        .sort((a, b) => b.intensity - a.intensity); // Sort by intensity (highest first)

    renderDashboard(filteredData)
}

function renderDashboard(data) {
    //Set up SVG
    var width = 800;
    var height = 500;
    var margin = { top: 20, right: 30, bottom: 50, left: 100 }; // Increased left margin for country names
    document.getElementById('chart').innerHTML = ""
    var svg = d3.select("#chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    //Scales (Y = country names, X = intensity)
    const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.intensity)])
        .range([margin.left, width - margin.right]);

    const y = d3.scaleBand()
        .domain(data.map(d => d.country))
        .range([margin.top, height - margin.bottom])
        .padding(0.2);

    // Draw bars
    svg.selectAll("rect")
        .data(data)
        .join("rect")
        .attr("class", "bar")
        .attr("x", margin.left) // Start bars from left margin
        .attr("y", d => y(d.country))
        .attr("width", d => x(d.intensity) - margin.left) // Width = intensity value
        .attr("height", y.bandwidth())
        .attr("fill", "steelblue")
        .on("mouseover", function () {
            d3.select(this).attr("fill", "orange");
        })
        .on("mouseout", function () {
            d3.select(this).attr("fill", "steelblue");
        });

    // Add X-axis (intensity values)
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x))
        .append("text")
        .attr("x", width / 2)
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .attr("fill", "black")
        .text("Intensity Score");

    // Add Y-axis (country names)
    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -60)
        .attr("x", -height / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "black")
        .text("Country");

    // Add chart title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .attr("font-weight", "bold")
        .text("Oil Market Intensity by Country");


    //Start pie chart 

    // Process the data to count regions
    const regionCounts = {};
    data.forEach(item => {
        const region = item.region || "Unspecified";
        regionCounts[region] = (regionCounts[region] || 0) + 1;
    });

    // Convert to array format for D3
    const regionData = Object.keys(regionCounts).map(region => ({
        region,
        count: regionCounts[region]
    }));

    // Sort by count (descending)
    regionData.sort((a, b) => b.count - a.count);

    // Set up the chart dimensions
    var width = 550;
    var height = 600;
    const radius = Math.min(width, height) / 2;

    // Create SVG element
    document.getElementById('regionPieChart').innerHTML = ""
    var svg = d3.select("#regionPieChart")
        .append("svg")
        .style("height", "750px")
        .style("width", "550px")
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

    // Create color scale
    const color = d3.scaleOrdinal()
        .domain(regionData.map(d => d.region))
        .range(d3.schemeCategory10);

    // Create pie layout
    const pie = d3.pie()
        .value(d => d.count)
        .sort(null);

    // Create arc generator
    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius - 20);

    // Create arcs
    const arcs = svg.selectAll(".arc")
        .data(pie(regionData))
        .enter()
        .append("g")
        .attr("class", "arc");

    // Draw arc paths
    arcs.append("path")
        .attr("d", arc)
        .attr("fill", d => color(d.data.region))
        .attr("stroke", "white")
        .attr("stroke-width", 1);

    // Add labels
    arcs.append("text")
        .attr("transform", d => `translate(${arc.centroid(d)})`)
        .attr("text-anchor", "middle")
        .text(d => d.data.count > 5 ? d.data.count : "")
        .style("fill", "white")
        .style("font-size", "12px");

    // Add legend
    const legend = svg.selectAll(".legend")
        .data(regionData)
        .enter()
        .append("g")
        .attr("class", "legend")
        .style("width", "600px")
        .attr("transform", (d, i) => `translate(120,${i * 20 - (-5)})`);

    legend.append("rect")
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", d => color(d.region));

    legend.append("text")
        .attr("x", 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .text(d => `${d.region} (${d.count})`)
        .style("font-size", "12px");

}



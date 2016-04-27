//USDA project - Alex Higuera 2016

'use strict';
  
// ### Create Chart Objects
// Create chart objects assocated with the container elements identified by the css selector.
// Note: It is often a good idea to have these objects accessible at the global scope so that they can be modified or
// filtered by other page controls.

var yearRingChart = dc.pieChart("#chart-ring-year");
var spendHistChart = dc.barChart("#chart-hist-spend");
var spenderRowChart = dc.rowChart("#chart-row-spenders");
var continentMap = d3.geo.mercator("#map-continents").scale(100);

d3.csv('/usda/data/data.csv', function (error, data) {
    
    var spendData = data;

    // normalize/parse data
    spendData.forEach(function(d) {
        d.amount = d.amount.match(/\d+/);
    });
    
    function remove_empty_bins(source_group) {
        return {
            all: function () {
                return source_group.top(5);
            }
        };
    }

    // set crossfilters
    var ndx = crossfilter(spendData),
        yearDim  = ndx.dimension(function(d) {return +d.year}),
        spendDim = ndx.dimension(function(d) {return Math.floor(d.amount/1);}),
        nameDim  = ndx.dimension(function(d) {return d.import}),
        countryDim  = ndx.dimension(function(d) {return d.country;}),

	nameGroup = nameDim.group().reduceSum(function(d) {return +d.import;}),	
        spendPerYear = yearDim.group().reduceSum(function(d) {return +d.amount;}),
        spendPerImport= nameDim.group().reduceSum(function(d) {return +d.amount;}),
	
	// top 5 countries, histo chart
	spendPerCountry = countryDim.group().reduceSum(function(d) {return +d.amount;}),
	countryGroup = remove_empty_bins(spendPerCountry);
	
    // define colors for pie chart
    var colorScale = d3.scale.ordinal().domain(["meats", "vegetables", "dairy", "fruit", "fish", "grains"])		
                            .range(["#ad494a", "#a4a517", "#b8ced6", "#E3E935", "#9e9ac8", "#c96715"]);		

    var breakpoint = 400;

    yearRingChart
        .width(200).height(200)
        .dimension(nameDim)
        .group(spendPerImport)
        .colors(colorScale)
	.innerRadius(30);
    
    
    spendHistChart
        .width(450)
        //from Plunker tutorial for responsive svg with iframe:
        //.width(histoWidth)
        .height(200)
        .margins({top: 10, right: 50, bottom: 35, left: 80})
        .on("renderlet.<renderletKey>", function (chart) {
                    chart.selectAll("g.x text")
                      .attr('dx', '-20')
                      .attr('transform', "rotate(-45)");
                })
        .dimension(yearDim)
        .group(spendPerYear)
        .legend(dc.legend().x(800).y(10).itemHeight(13).gap(5))
        .x(d3.scale.ordinal())
        //.stack(countryDim)
        .xUnits(dc.units.ordinal)
        .elasticX(true)
        .elasticY(true);
    
    spendHistChart.xAxis().tickFormat(function(d) {return d});
    
    //data is imported as millions - divide by 1000 to make it billions on chart 
    spendHistChart.yAxis().tickFormat(function(d) {return d/1000}).ticks(4);
 
    //responsive svg attempt from plunker:
    window.onresize = function(event) {
        var newWidth = document.getElementById('chart-hist-spend').offsetWidth;
        spendHistChart.width(newWidth)
	    .transitionDuration(0);
        dc.renderAll();
        spendHistChart.transitionDuration(750);
    };
    
    
    spenderRowChart
        .width(300).height(210)
        .margins({top: 30, right: 0, bottom: 30, left: 10})
        .dimension(countryDim)
        .group(countryGroup)
	.transitionDuration(300)
        .elasticX(true);
	
    //data is imported as millions - divide by 1000 to make it billions on chart 
    spenderRowChart.xAxis().tickFormat(function(d) {return d/1000}).ticks(4); 
    dc.renderAll();

});
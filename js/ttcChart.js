var TtcChart = (function(DataService) {
	"use strict";

	var svg,
		scaleMap= d3.scaleLinear().range([5, 60]),
		hourChartHeight = 100,
		hourChartWidth = 400,
		dayChartHeight = 100,
		dayChartWidth = 200,
		animationDuration = 500,
		lineKeys = ["YU", "BD", "SRT", "SHP"],
		hourChartScaleX = d3.scaleLinear()
			.domain([0, 25])
			.range([0, hourChartWidth]),
		hourChartScaleY = d3.scaleLinear()
			.range([hourChartHeight, 0]),
		dayChartScaleX = d3.scaleBand()
			.domain(d3.range(7))
			.rangeRound([0, dayChartWidth])
			.padding(0.25),
		dayChartScaleY = d3.scaleLinear()
			.range([dayChartHeight, 0]),
		dayChartScaleColor = d3.scaleOrdinal()
			.domain(lineKeys)
			.range(["#FFCC29", "#00A859", "#00AFEF", "#A8518A"]),
		hourChartLine = d3.line()
			.x(function(d) { return hourChartScaleX(d.key); })
			.y(function(d) { return hourChartScaleY(d.value); }),
		boundToDegree = {
			"N" : 45,
			"E" : 135,
			"S" : 225,
			"W" : 315
		},
		boundToColor = {
			"N" : "#984ea3",
			"E" : "#377eb8",
			"S" : "#4daf4a",
			"W" : "#e41a1c"
		},
		lineCodeToNumber = {
			"YU": 1,
			"BD": 2,
			"SRT": 3,
			"SHP": 4
		};
    	

	var formatHours = function(d) { 
		if (d < 10) {
			return "0" + d;
		} else {
			return d;	
		}
	};

	var formatDays = function(d) { 
		return ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"][d];
	};

	function createMap() {
		var stations = d3.nest()
	  		.key(function(d){
			    return d.station;
			})
			.sortKeys(function(a, b) {
				return d3.ascending(+a, +b);
			})
			.key(function(d){
			    return d.bound;
			})
			.entries(DataService.getData());

		svg.select("g.legend .scale")
			.append("g")
				.classed("x-axis", true)
				.attr("transform", "translate(0," + 0 + ")")
		    	.call(d3.axisBottom(scaleMap))
		    		.select(".domain")
		    		.remove();

		svg.select("g.stations")
			.selectAll("g")
			.data(stations);

		svg.select("g.stations")
			.selectAll("g")
			.each(function(d, i) {
				var g = this;
				d.values.forEach(function(t) {
					d3.select(g)
						.append("clipPath")
						.attr("id", "mask-" + i + "-" + t.key)
						.attr("transform", "rotate(" +  boundToDegree[t.key] + ")")
						.append("rect")
						.attr("width", 100)
						.attr("height", 100);

					d3.select(g)
						.append("circle")
						.classed(t.key, true)
						.attr("clip-path", "url(#mask-" + i + "-" + t.key + ")")
						.style("fill", boundToColor[t.key])
						.attr("r", 0);
				});
			});
	}

	function createHourChart() {
		var g = svg.select("g#hourChart");

		g.append("g")
			.classed("x-axis", true)
			.attr("transform", "translate(0," + hourChartHeight + ")")
		    .call(d3.axisBottom(hourChartScaleX).tickFormat(formatHours))
		    .select(".domain")
		    	.remove();

		g.select(".x-axis")
			.append("text")
				.classed("label", true)
				.attr("x", hourChartWidth - 10)
				.attr("y", 35)
				.text("Time of day (hour)");

		g.append("g")
			.classed("y-axis", true)
			.append("text")
				.classed("label", true)
				.attr("x", 5)
				.attr("y", 10);

		g.append("path")
			.classed("line", true)
			.classed("line1", true);

		g.append("path")
			.classed("line", true)
			.classed("line2", true);

		g.append("path")
			.classed("line", true)
			.classed("line3", true);

		g.append("path")
			.classed("line", true)
			.classed("line4", true);
	}


	function createDayChartOld() {
		var g = svg.select("g#dayChart");

		g.append("g")
			.classed("x-axis", true)
			.attr("transform", "translate(0," + dayChartHeight + ")")
		    .call(d3.axisBottom(dayChartScaleX).tickFormat(formatDays))
		    .select(".domain")
		    	.remove();

		g.select(".x-axis")
			.append("text")
				.classed("label", true)
				.attr("x", dayChartWidth - 10)
				.attr("y", 35)
				.text("Day of week");

		g.append("g")
			.classed("y-axis", true)
			.append("text")
				.classed("label", true)
				.attr("x", 5)
				.attr("y", 10);

		d3.range(7).forEach(function(d) {
			g.append("rect")
				.classed("bar", true)
      			.attr("x", function() { 
      				return dayChartScaleX(d); 
      			})
      			.attr("width", dayChartScaleX.bandwidth());
		});
	}

	function createDayChart(data) {
		var g = svg.select("g#dayChart");

		g.append("g")
			.classed("x-axis", true)
			.attr("transform", "translate(0," + dayChartHeight + ")")
		    .call(d3.axisBottom(dayChartScaleX).tickFormat(formatDays))
		    .select(".domain")
		    	.remove();

		g.select(".x-axis")
			.append("text")
				.classed("label", true)
				.attr("x", dayChartWidth - 10)
				.attr("y", 35)
				.text("Day of week");

		g.append("g")
			.classed("y-axis", true)
			.append("text")
				.classed("label", true)
				.attr("x", 5)
				.attr("y", 10);

    	dayChartScaleY.domain([0, d3.max(data, function(d) { return d.total; })]).nice();
    	
    	g.append("g")
    		.classed("bars", true)
        	.selectAll("g")
        	.data(d3.stack().keys(lineKeys)(data))
        	.enter().append("g")
            	.attr("fill", function(d) { return dayChartScaleColor(d.key); })
            	.selectAll("rect")
                	.data(function(d) { return d; })
                	.enter().append("rect")
                    	.attr("x", function(d) { 
                        	return dayChartScaleX(d.data.key); 
                    	})
                    	.attr("y", function(d) { return dayChartScaleY(d[1]); })
                    	.attr("height", function(d) { return dayChartScaleY(d[0]) - dayChartScaleY(d[1]); })
                    	.attr("width", dayChartScaleX.bandwidth());
	}

	function updateMap(data) {

		scaleMap.domain([0, d3.max(data, function(d) { return d3.max(d.values, function(t) { return t.value; }); })]);

		svg.select("g.legend .scale .x-axis")
			.transition()
			.duration(animationDuration)
				.attr("transform", "translate(0,-100)")
				.call(d3.axisBottom(scaleMap).ticks(2, "s"))
				.attr("transform", "translate(0,0)");

		svg.select("g.legend .scale circle.big")
			.transition()
			.duration(animationDuration)
			.attr("r", scaleMap(scaleMap.domain()[1]));

		svg.select("g.stations")
			.selectAll("g")
			.data(data);

		svg.select("g.stations")
			.selectAll("g")
			.each(function(d, i) {
				var g = this;
				d.values.forEach(function(t) {
					d3.select(g)
						.select("circle." + t.key)
						.transition()
						.duration(1000)
						.attr("r", scaleMap(t.value));
				});
			});
	}

	function updateHourChart(data, delayOrGap) {
		var g = svg.select("g#hourChart");
			
		hourChartScaleY
			.domain([0, 1.3 * d3.max(data, function(d) { return d3.max(d.values, function(t) { return t.value; }); })])
			.nice();
		
		d3.max(data, function(d) { 
			return d3.max(d.values, function(t) {
				return t.value;
			});
		});

		g.select("g.y-axis")
			.transition()
			.duration(animationDuration)
				.attr("transform", "translate(0,-100)")
				.call(d3.axisLeft(hourChartScaleY).ticks(5))
				.attr("transform", "translate(0,0)");

		g.select("g.y-axis")
			.select("text")
			.attr("transform", "translate(-100,0)")
			.transition()
			.duration(animationDuration)
				.text(DataService.getFilterGapOrDelay() === "delay" ? "Delay (min)" : "Gap (min)")
				.attr("transform", "translate(0,0)");
		
		g.select("path.line1")
			.datum(data[3].values)
			.transition()
			.duration(animationDuration)
				.attr("d", hourChartLine);

		g.select("path.line2")
			.datum(data[0].values)
			.transition()
			.duration(animationDuration)
				.attr("d", hourChartLine);

		g.select("path.line3")
			.datum(data[2].values)
			.transition()
			.duration(animationDuration)
				.attr("d", hourChartLine);

		g.select("path.line4")
			.datum(data[1].values)
			.transition()
			.duration(animationDuration)
				.attr("d", hourChartLine);
	}

	function updateDayChart(data) {
		var g = svg.select("g#dayChart");
		
    	dayChartScaleY.domain([0, 1.3 * d3.max(data, function(d) { return d.total; })]).nice();
    	
    	g.select("g.y-axis")
			.transition()
			.duration(animationDuration)
				.attr("transform", "translate(0,-100)")
				.call(d3.axisLeft(dayChartScaleY).ticks(5))
				.attr("transform", "translate(0,0)");

		g.select("g.y-axis")
			.select("text")
			.attr("transform", "translate(-100,0)")
			.transition()
			.duration(animationDuration)
				.text(DataService.getFilterGapOrDelay() === "delay" ? "Delay (min)" : "Gap (min)")
				.attr("transform", "translate(0,0)");

    	g.select("g.bars").selectAll("g")
        	.data(d3.stack().keys(lineKeys)(data))
        	.selectAll("rect")
                .data(function(d) { return d; })
                .transition()
				.duration(animationDuration)
                	.attr("x", function(d) { 
                    	return dayChartScaleX(d.data.key); 
                	})
                	.attr("y", function(d) { 
                		return dayChartScaleY(d[1]); 
                	})
                	.attr("height", function(d) { 
                		return dayChartScaleY(d[0]) - dayChartScaleY(d[1]); 
                	})
                	.attr("width", dayChartScaleX.bandwidth());
	}

	function updateCodeChart(data) {
		svg.select("g.codes text.label")
			.attr("x", 600)
			.text(DataService.getFilterGapOrDelay() === "delay" ? "Delay (min)" : "Gap (min)")
			.transition()
			.duration(animationDuration)
			.attr("x", 400);
			
		svg.select("g.codes")
			.selectAll("g.row")
			.data(data);

		svg.select("g.codes")
			.selectAll("g.row")
			.each(function(d, i) {
				var g = d3.select(this);

				g.select("text.description")
					.style("opacity", 0)
					.attr("y", -400)
					.text(d.key)
					.transition()
					.duration(animationDuration)
					.style("opacity", 1)
					.attr("y", 0);

				if (d.values.length < 4) {
					var keys = ["YU", "BD", "SRT", "SHP"];
					d.values.forEach(function(t) {
						if (keys.indexOf(t.key) >= 0) {
							keys.splice(keys.indexOf(t.key), 1);
						}
					});
					keys.forEach(function(t) {
						d.values.push({
							key: t,
							value: 0
						});
					});
				}
				d.values.forEach(function(t) {
					g.select("text.line" + lineCodeToNumber[t.key])
						.style("opacity", 0)
						.attr("y", -400)
						.text(t.value)
						.transition()
						.duration(animationDuration)
						.style("opacity", 1)
						.attr("y", 0);	
				});

				g.select("text.total")
					.style("opacity", 0)
					.attr("y", -400)
					.text(d.total)
					.transition()
					.duration(animationDuration)
					.style("opacity", 1)
					.attr("y", 0);
			});
	}

	function update() {
		updateMap(DataService.getStationData());
		updateHourChart(DataService.getHourData());
		updateDayChart(DataService.getDayData());
		updateCodeChart(DataService.getCodeData());
	}

	function create(selector) {
		svg = d3.select(selector);
		createMap();
		createHourChart();
		createDayChart(d3.range(7).map(function(d) { return { key: d, BD: 0, SHP: 0, SRT: 0, YU: 0, total: 0 }; }), "delay");
		update();

		d3.select("#gapButton")
			.on("click", function() {
				DataService.setFilterGapOrDelay("gap");
				update();
				d3.select("#gapButton").classed("selected", true);
				d3.select("#delayButton").classed("selected", false);
			});

		d3.select("#delayButton")
			.on("click", function() {
				DataService.setFilterGapOrDelay("delay");
				update();
				d3.select("#gapButton").classed("selected", false);
				d3.select("#delayButton").classed("selected", true);
			});

		d3.selectAll(".monthIcon rect")
			.each(function() {
				d3.select(this).on("click", function() {
					var selected = !d3.select(this).classed("selected");
					if (selected || d3.selectAll(".monthIcon rect.selected").size() > 1) {
						DataService.setFilterMonth(+d3.select(this).attr("data-month"), selected);
						update();
						d3.select(this).classed("selected", selected);
					}
				});
			});

		d3.selectAll(".yearIcon rect")
			.each(function() {
				d3.select(this).on("click", function(d) {
					var selected = !d3.select(this).classed("selected");
					if (selected || d3.selectAll(".yearIcon rect.selected").size() > 1) {
						DataService.setFilterYear(+d3.select(this).attr("data-year"), selected);
						update();
						d3.select(this).classed("selected", selected);
					}
				});
			});
			
		DataService.getCodeData();
	}

	return {
		create: create
	};

})(DataService);

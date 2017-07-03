var DataService = (function() {
	"use strict";
	var rawData,
		delayData,
		codeData = {},
		gapOrDelay = "delay",
		months = {
			0: true,
			1: true,
			2: true,
			3: true,
			4: true,
			5: true,
			6: true,
			7: true,
			8: true,
			9: true,
			10: true,
			11: true,
			12: true
		},
		years = {
			2014: true,
			2015: true,
			2016: true
		};

	function loadData(callback) {
		d3.csv("data/delays.csv", function(d) {
			return {
				date : new Date(d.Date),
				year : (new Date(d.Date)).getFullYear(),
				month: (new Date(d.Date)).getMonth(),
				time : d.Time,
				station : +d.Station,
				code : d.Code,
				delay : +d["Min Delay"],
				gap : +d["Min Gap"],
				line: d.Line,
				bound: d.Bound
			};
		}, function(data) {
			rawData = data;
			delayData = data;
			d3.csv("data/codes.csv", function(data) {
				data.forEach(function(d) {
					codeData[d.code] = d.description;
				});
				
				callback();	
			});
		});
	}

	function getData() {
		return delayData;
	}

	function filterData() {
		delayData = rawData.filter(function(d) { 
			return years[d.year] && months[d.month];
		});
	}

	function getFilterGapOrDelay() {
		return gapOrDelay;
	}

	function setFilterGapOrDelay(d) {
		gapOrDelay = d;
		filterData();
	}

	function setFilterYear(year, set) {
		years[year] = set;
		filterData();
	}

	function setFilterMonth(month, set) {
		months[month] = set;
		filterData();
	}

	function getStationData() {
		var keys = d3.range(69),
			keyIndex,	
			oldLength,
			i;

		var data = d3.nest()
	  		.key(function(d){
			    return d.station;
			})
			.sortKeys(function(a, b) {
				return d3.ascending(+a, +b);
			})
			.key(function(d){
			    return d.bound;
			})
			.rollup(function(leaves){
			    return d3.sum(leaves, function(d){
			        return d[gapOrDelay];
			    });
			})
			.entries(delayData);

		if(data.length < 69) {
			keyIndex = 0;
			oldLength = data.length;
			for (i = 0; i < oldLength; ++i) {
				if (+data[i].key !== keys[keyIndex]) {
					data.push({
						key: keys[keyIndex],
						values: [{key: "N", value: 0}, {key: "W", value: 0}, {key: "S", value: 0}, {key: "E", value: 0}]
					});
					--i;
				}
				++keyIndex;
			}
			data.sort(function(a, b) {
				return d3.ascending(a.key, b.key);
			});
		}
		return data;
	}

	function getHourData() {
		var keys = ["00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23"],
			keyIndex,	
			oldLength,
			i;

		var data = d3.nest()
			.key(function(d){
			    return d.line;
			})
			.key(function(d){
			    return d.time.split(":")[0];
			})
			.sortKeys(function(a, b) {
				return d3.ascending(+a, +b);
			})
			.rollup(function(leaves){
			    return d3.sum(leaves, function(d){
			        return d[gapOrDelay];
			    });
			})
			.entries(delayData);

		data.forEach(function(d) {
			if (d.values.length < 24) {
				keyIndex = 0;
				oldLength = d.values.length;
				for (i = 0; i < oldLength; ++i) {
					if (d.values[i].key !== keys[keyIndex]) {
						d.values.push({
							key: keys[keyIndex],
							value: 0
						});
						--i;
					}
					++keyIndex;
				}
				d.values.sort(function(a, b) {
					return d3.ascending(+a.key, +b.key);
				});
			}
			// add hour zero to end as hour 24
			d.values.push({
				key: "24",
				value: d.values[0].value
			});
		});


		data.sort(function(a, b) {
			return d3.ascending(a.key, b.key);
		});

		return data;
	}

	function getDayData() {
		var data = d3.nest()
	  		.key(function(d){
			    return d.date.getDay();
			})
			.key(function(d){
			    return d.line;
			})
			.rollup(function(leaves){
			    return d3.sum(leaves, function(d){
			        return d[gapOrDelay];
			    });
			})
			.entries(delayData)
			.map(function(d) {
				var total = 0,
					item = {
						key: +d.key
					};
				d.values.forEach(function(t) {
					item[t.key] = t.value;
					total += t.value;
				});
				item.total = total;
    			return item;
  			}).sort(function(a, b) {
				return d3.ascending(+a.key, +b.key);
			});

  			data = data.map(function(d) {
  				return {
  					"BD" : d.BD || 0,
  					"SHP" : d.SHP || 0,
  					"SRT" : d.SRT || 0,
  					"YU" : d.YU || 0,
  					"key" : d.key,
  					"total" : d.total
  				};
  			});

		return data;
	}

	function getCodeData() {
		var data = d3.nest()
	  		.key(function(d){
			    return d.code;
			})
			.key(function(d){
			    return d.line;
			})
			.rollup(function(leaves){
			    return d3.sum(leaves, function(d){
			        return d[gapOrDelay];
			    });
			})
			.entries(delayData)
			.map(function(d) {
				var total = 0,
					item = {
						key: codeData[d.key],
						values: d.values,
						total: d3.sum(d.values, function (t) {
							return t.value;
						})
					};
    			return item;
  			}).sort(function(a, b) {
				return d3.descending(a.total, b.total);
			}).splice(0, 10);
		return data;
	}

	return {
		loadData: loadData,
		getData: getData,
		filterData: filterData,
		getFilterGapOrDelay: getFilterGapOrDelay,
		setFilterGapOrDelay: setFilterGapOrDelay,
		setFilterYear: setFilterYear,
		setFilterMonth: setFilterMonth,
		getStationData: getStationData,
		getHourData: getHourData,
		getDayData: getDayData,
		getCodeData: getCodeData
	};
})();

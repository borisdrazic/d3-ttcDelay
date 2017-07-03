var Main = (function(DataService, TtcChart) {
	"use strict";
	
	function createCharts() {
		TtcChart.create("#ttcChart");	
	}

	DataService.loadData(createCharts);
	
})(DataService, TtcChart);

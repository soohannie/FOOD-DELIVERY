// set global variables
const limit = 200; // How many points can be on the graph before sliding occurs
const refreshInterval = 2000; // Time between refresh intervals

// set functions to retrieve
function getData1() {
	return timeobject[0].average;
	}
function getData2() {
	return timeobject[1].average;
	}

function getData3() {
	return timeobject[2].average;
	}

function getData4() {
	return analyticsdataobject[4].value;
	}

function getData5() {
	return analyticsdataobject[3].value;
	}

function getData6() {
	return analyticsdataobject[5].value;
	}


	// set chart layout
const layout1 = {
	paper_bgcolor: 'rgba(0,0,0,0)',
	plot_bgcolor: 'rgba(0,0,0,0)',
	xaxis: {title: 'Time'},
	yaxis: {title: 'Average Delivery Time of Vehicles'}
	};

const layout2 = {
	paper_bgcolor: 'rgba(0,0,0,0)',
	plot_bgcolor: 'rgba(0,0,0,0)',
	xaxis: {title: 'Time'},
	yaxis: {title: 'Average Revenue Generated per Time Period'}
};

const layout3 = {
	paper_bgcolor: 'rgba(0,0,0,0)',
	plot_bgcolor: 'rgba(0,0,0,0)',
	xaxis: {title: 'Time'},
	yaxis: {title: 'Number of Idle Drivers and Orders being served'}
};

function plot() {

	// plot all charts
	Plotly.plot('chart1',[
		{
			y:[getData1()],
			mode:'lines',
			name: 'Bicycle',
			line: {
				color: 'rgb(0,102,255)',
				width: 3 }
		},
		{
			y:[getData2()],
			mode:'lines',
			name: 'Motorcycle',
			line: {
				color: 'rgb(197, 66, 245)',
				width: 3 }
		},
		{
			y:[getData3()],
			mode:'lines',
			name: 'Car',
			line: {
				color: 'rgb(242, 147, 39)',
				width: 3 }
		}
		], layout1);

	Plotly.plot('chart2',[{
		y:[getData4()],
		mode:'lines',
		line: {
			color: 'rgb(255,0,0)',
			width: 3 }
	}], layout2);

	Plotly.plot('chart3',[
		{
			y:[getData5()],
			mode:'lines',
			name: 'Idle Drivers',
			line: {
				color: 'rgb(212, 219, 66)',
				width: 3 }
		},
		{
			y:[getData6()],
			mode:'lines',
			name: 'Ordering being Processed',
			line: {
				color: 'rgb(166, 66, 173)',
				width: 3 }
		}], layout3);


	// set refresh interval and graph limit
	var cnt = 0;
	setInterval(function(){
		if (isRunning == true) {
			Plotly.extendTraces('chart1',{ y:[[getData1()],[getData2()],[getData3()]]}, [0,1,2]);
			cnt++;
			if(cnt > limit) {
				Plotly.relayout("chart1", {
					xaxis: {
						range: [cnt-limit,cnt]
						}
					});
				}
			Plotly.extendTraces('chart2',{ y:[[getData4()]]}, [0]);
			if(cnt > limit) {
				Plotly.relayout("chart2", {
					xaxis: {
						range: [cnt-limit,cnt]
						}
					});
				}

			Plotly.extendTraces('chart3',{ y:[[getData5()],[getData6()]]}, [0,1]);
			if(cnt > limit) {
				Plotly.relayout("chart3", {
					xaxis: {
						range: [cnt-limit,cnt]
						}
					});
				}
		}},refreshInterval);
}

(function() {
	plot();
})();

function reloadGraph(){
	Plotly.deleteTraces('chart1', [0,1,2]);
	Plotly.deleteTraces('chart2', [0]);
	Plotly.deleteTraces("chart3", [0,1]);
	plot();
}
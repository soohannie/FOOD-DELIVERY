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
// set chart layout
const layout1 = {
	paper_bgcolor: 'rgba(0,0,0,0)',
	plot_bgcolor: 'rgba(0,0,0,0)',
	xaxis: {title: 'Time'},
	yaxis: {title: 'Average Bicycle Delivery Time'}
	};

const layout2 = {
	paper_bgcolor: 'rgba(0,0,0,0)',
	plot_bgcolor: 'rgba(0,0,0,0)',
	xaxis: {title: 'Time'},
	yaxis: {title: 'Average Motorcycle Delivery Time'}
};

const layout3 = {
	paper_bgcolor: 'rgba(0,0,0,0)',
	plot_bgcolor: 'rgba(0,0,0,0)',
	xaxis: {title: 'Time'},
	yaxis: {title: 'Average Car Delivery Time'}
};

const layout4 = {
	paper_bgcolor: 'rgba(0,0,0,0)',
	plot_bgcolor: 'rgba(0,0,0,0)',
	xaxis: {title: 'Time'},
	yaxis: {title: 'Total Revenue Per Timeperiod'}
};

// plot all charts
Plotly.plot('chart1',[{
	y:[getData1()],
	mode:'lines',
	line: {
		color: 'rgb(0,102,255)',
		width: 3 }
	}], layout1);

Plotly.plot('chart2',[{
	y:[getData2()],
	mode:'lines',
	line: {
		color: 'rgb(255,102,255)',
		width: 3 }
}], layout2);

Plotly.plot('chart3',[{
	y:[getData3()],
	mode:'lines',
	line: {
		color: 'rgb(255,153,51)',
		width: 3 }
}], layout3);

Plotly.plot('chart4',[{
	y:[getData4()],
	mode:'lines',
	line: {
		color: 'rgb(255,0,0)',
		width: 3 }
}], layout4);

// set refresh interval and graph limit
var cnt = 0;
setInterval(function(){
	if (isRunning == true) {
		Plotly.extendTraces('chart1',{ y:[[getData1()]]}, [0]);
		cnt++;
		if(cnt > limit) {
			Plotly.relayout("chart1", {
				xaxis: {
					range: [cnt-limit,cnt]
					}
				});
			}
		Plotly.extendTraces('chart2',{ y:[[getData2()]]}, [0]);
		if(cnt > limit) {
			Plotly.relayout("chart2", {
				xaxis: {
					range: [cnt-limit,cnt]
					}
				});
			}

		Plotly.extendTraces('chart3',{ y:[[getData3()]]}, [0]);
		if(cnt > limit) {
			Plotly.relayout("chart3", {
				xaxis: {
					range: [cnt-limit,cnt]
					}
				});
			}

		Plotly.extendTraces('chart4',{ y:[[getData4()]]}, [0]);
		if(cnt > limit) {
			Plotly.relayout("chart4", {
				xaxis: {
					range: [cnt-limit,cnt]
					}
				});
			}
	}},refreshInterval);


var WINDOWBORDERSIZE = 10;
var HUGE = 999999; //Sometimes useful when testing for big or small numbers
var animationDelay = 200; //controls simulation and transition speed
var isRunning = false; // used in simStep and toggleSimStep
var surface; // Set in the redrawWindow function. It is the D3 selection of the svg drawing surface
var surface2;
var simTimer; // Set in the initialization function

//The drawing surface will be divided into logical cells
var maxCols = 60;
var maxRows = 60;
var cellWidth; //cellWidth is calculated in the redrawWindow function
var cellHeight; //cellHeight is calculated in the redrawWindow function

//Variables for Driver States
const IDLE=0;
const DRIVINGTORESTAURANT=1;
const COLLECTINGFOOD=2;
const DRIVINGTOHOUSE =3;
const DELIVERINGONFOOT=4;
const FINISHEDDELIVERY=5;
const FINISHEDWORK=6;

//Variables used to dynamically contain simulation states
var shopareas = []
var ranShopList = []
var houseareas = []
var drivers = []
var ordersQueue = []

//Variables for user to experiment with the simulation model
var probOrderArrival = document.getElementById("slider2").value;
var probDriverArrival = document.getElementById("slider3").value;
var maxOrderPerDriver = document.getElementById("slider4").value;
var numShops = document.getElementById("slider5").value;
var pricingtrigger = document.getElementById("pricingtrigger1").value;

//Static variables needed for simulation
var probBicycle = 1;
var probMotorcycle = 0.5;
var probCar = 0.15;
var probCar = 0.15;
var probPublicplace = 0.1
var probPrivatehousing = 0.3
var probPrivateestate = 0.5
var probPublichousing = 0.99
var rowHDB = 29
var colHDB = 29
var driverCount = 0
var orderCounter = 0

//Variables for Analytics
var currentTime = 0
var deliverytimetaken =0
var timeobject = [
	{
		type: "bicycle",
		cumulative: 0,
		average:0,
		counter:0,
		simdata:0,
		x:100,
		y:100,
	},
	{
		type: "motorcycle",
		cumulative: 0,
		average:0,
		counter:0,
		simdata:0,
		x:100,
		y:150,
	},
	{
		type: "car",
		cumulative: 0,
		average:0,
		counter:0,
		simdata:0,
		x:100,
		y:200,
	}
]


//Global Variables needed for Dynamic Pricing Analysis
var minPrice = 2.5  //static
var maxPrice = 6  //static
var bicycleWeightage = 0.25 //static
var motorcycleWeightage = 0.1 //static
var carWeightage = 0.15 //static
var idleWeightage = 0.5 //static
var bicycleOptimalServiceTime = 115 //static
var motorcycleOptimalServiceTime = 70 //static
var carOptimalServiceTime = 85 //static
var prevailingPrice = 3.5  //dynamic
var analyticsdataobject = [
	{
		type: "Probability of Driver Arrival",
		value: probDriverArrival,
		x:100,
		y:300,
	},
	{
		type: "Probability of Order Arrival",
		value: probOrderArrival,
		x:100,
		y:350,
	},
	{
		type: "Current Pricing Used",
		value: prevailingPrice,
		x:100,
		y:400,
	},
	{
		type: "Number of idle Drivers",
		value: 0.00,
		x:100,
		y:450,
	},
	{
		type: "Revenue generated per timeperiod",
		value: 0.00,
		x:100,
		y:500,
		counter:0,
		cumulativeperiodsum:0
	},
	{
		type: "Total Number of Orders Being Served",
		value: 0.00,
		x:100,
		y:550,
	}
]

//Variables for Image Files
const bicyclePic = "images/rider-images/deliverybicycle.svg";
const motorcyclePic = "images/rider-images/deliverymotorcycle.svg";
const carPic = "images/rider-images/deliverycar.svg";
const bicyclePicLeft = "images/rider-images/deliverybicycle-left.svg";
const motorcyclePicLeft = "images/rider-images/deliverymotorcycle-left.svg";
const carPicLeft = "images/rider-images/deliverycar-left.svg";
const shopPic = "images/building-images/004-shop.svg";

//Variables for Output Analysis Data Collection
var dataCollectionTrigger = false
var dataCollectionSwitch = true
var dpTrigger = false
var outputAnalysisDataObject = [] // for data without dynamic pricing
var outputAnalysisDataObject2 = [] // for data with dynamic pricing
var numRuns = 60000
var repetitionCounter = 1
var numReps = 10;

// This next function is executed when the script is loaded. It contains the page initialization code.
(function() {
	// Your page initialization code goes here
	// All elements of the DOM will be available here
	window.addEventListener("resize", redrawWindow); //Redraw whenever the window is resized
	simTimer = window.setInterval(simStep, animationDelay); // call the function simStep every animationDelay milliseconds
	generateBuildings()
	redrawWindow();
})();

// We need a function to start and pause the the simulation.
function toggleSimStep(){
	//this function is called by a click event on the html page.
	// Search BasicAgentModel.html to find where it is called.
	isRunning = !isRunning;
	console.log("isRunning: "+isRunning);
}

function generateBuildings(){

	var counter = 0
	for (var a=0; a<numShops; a++){
		var ranNum =  Math.floor(Math.random() * Math.floor(rowHDB*colHDB))
		ranShopList.push(ranNum)
	}

	//generate the housing / hdb blocks
	for(var i=0; i<rowHDB*2; i++){
		for(var j=0; j<colHDB*2; j++){
			//Buildings have all been build in the EVEN NUMBERS of the GRID
			//Hence, all roads will be the ODD NUMBERS of the GRID - if any i||j in (i,j) is odd, it is a road
			if(i%2!=0){
				if(j%2!=0){
					if(ranShopList.includes(counter)){
						shopareas.push({
							"label":"SHOP",
							"startRow":i+1,
							"numRows":1,
							"startCol":j+1,
							"numCols":1,
							"color":"yellow"
						})
					} else {

						var randomHouseGen = Math.random();
						if (randomHouseGen< probPublicplace){
							var housingtype="public"
						} else if (randomHouseGen< probPrivatehousing){
							var housingtype="privateproperty"
						} else if (randomHouseGen< probPrivateestate){
							var housingtype="estates"
						} else { var housingtype="apartments" };

						houseareas.push(
							{
								"label": housingtype,
								"startRow":i+1,
								"numRows":1,
								"startCol":j+1,
								"numCols":1,
								"color":"pink",
								"placeOrder":false
							}
						)}
					counter++
				}
			}

		}
	}
}

function redrawWindow(){
	isRunning = false; // used by simStep
	window.clearInterval(simTimer); // clear the Timer

	if(dataCollectionTrigger==true){
		animationDelay=0
	} else {
	animationDelay = 1000 - document.getElementById("slider1").value;
	}

	simTimer = window.setInterval(simStep, animationDelay); // call the function simStep every animationDelay milliseconds

	if(dataCollectionTrigger==true){
		if(dpTrigger == true){
			pricingtrigger = true
		} else {
			pricingtrigger = false
		}
	} else {
		pricingtrigger = document.getElementById("pricingtrigger1")
		if(pricingtrigger.checked == true){
			pricingtrigger = true
		} else {
			pricingtrigger = false
		}
	}


	//This is for Simulation Game Space
	//resize the drawing surface; remove all its contents;
	var drawsurface = document.getElementById("surface");
	var w = window.innerWidth*(3/5);
	var h = window.innerHeight;
	var surfaceWidth =(w - 3*WINDOWBORDERSIZE);
	var surfaceHeight= (h - 3*WINDOWBORDERSIZE);

	drawsurface.style.width = surfaceWidth+"px";
	drawsurface.style.height = surfaceHeight+"px";
	drawsurface.style.left = WINDOWBORDERSIZE/2+'px';
	drawsurface.style.top = WINDOWBORDERSIZE/2+'px';
	drawsurface.style.border = "thick solid #006400"; //The border is mainly for debugging; okay to remove it
	drawsurface.innerHTML = ''; //This empties the contents of the drawing surface, like jQuery erase().

	// Compute the cellWidth and cellHeight, given the size of the drawing surface
	numCols = maxCols;
	cellWidth = surfaceWidth/numCols;
	numRows = maxRows //Math.ceil(surfaceHeight/cellWidth);
	cellHeight = surfaceHeight/numRows;

	// In other functions we will access the drawing surface using the d3 library.
	//Here we set the global variable, surface, equal to the d3 selection of the drawing surface
	surface = d3.select('#surface');
	surface.selectAll('*').remove(); // we added this because setting the inner html to blank may not remove all svg elements
	surface.style("font-size","100%");

	//BUILD SHOP IMAGES
	var shopsgrid= surface.selectAll(".shopareas").data(shopareas)
	shopsgrid.exit().remove()
	var newshopareas = shopsgrid.enter().append("g").attr("class","shops");
	//For each new area, append a rectangle to the group to highlight the location of the shops
	newshopareas.append("rect")
		.attr("x", function(d){return (d.startCol-1)*cellWidth;})
		.attr("y",  function(d){return (d.startRow-1)*cellHeight;})
		.attr("width",  function(d){return d.numCols*cellWidth;})
		.attr("height",  function(d){return d.numRows*cellWidth;})
		.style("fill", function(d) { return d.color; })
		// .style("stroke","black")
		// .style("stroke-width",1);

	newshopareas.append("svg:image")
		.attr("x", function(d){return (d.startCol-1)*cellWidth;})
		.attr("y",  function(d){return (d.startRow-1)*cellHeight;})
		.attr("width",  function(d){return d.numCols*cellWidth;})
		.attr("height",  function(d){return d.numRows*cellWidth;})
		.attr("xlink:href", function(d){return shopPic;});

	var housesgrid= surface.selectAll(".houseareas").data(houseareas)
	var newhouseareas = housesgrid.enter().append("g").attr("class","houses");
	// For each new area, append a rectangle to the group
	newhouseareas.append("rect")
		.attr("x", function(d){return (d.startCol-1)*cellWidth;})
		.attr("y",  function(d){return (d.startRow-1)*cellHeight;})
		.attr("width",  function(d){return d.numCols*cellWidth;})
		.attr("height",  function(d){return d.numRows*cellWidth;})
		.style("fill", function(d) {return "pink" })


	//This is for Simulation Data Displays
	//resize the drawing surface; remove all its contents;
	var drawsurface2 = document.getElementById("surface2");
	var w2 = window.innerWidth*(2/5);
	var h2 = window.innerHeight;
	var surfaceWidth2 =(w2 - 3*WINDOWBORDERSIZE);
	var surfaceHeight2= (h2 - 3*WINDOWBORDERSIZE);

	drawsurface2.style.width = surfaceWidth2+"px";
	drawsurface2.style.height = surfaceHeight2+"px";
	drawsurface2.style.left = WINDOWBORDERSIZE/2+'px';
	drawsurface2.style.top = WINDOWBORDERSIZE/2+'px';
	drawsurface2.style.border = "thick solid #006400"; //The border is mainly for debugging; okay to remove it
	drawsurface2.innerHTML = ''; //This empties the contents of the drawing surface, like jQuery erase().
	//d3.min.js of this build seems to be 3.4.5 - note to self

	surface2 = d3.select('#surface2');
	surface2.selectAll('*').remove(); // we added this because setting the inner html to blank may not remove all svg elements
	surface2.style("font-size","100%");

	// rebuild contents of the drawing surface
	updateSurface();

	if(dataCollectionTrigger==true){
		isRunning = true;
	}
};

// The window is resizable, so we need to translate row and column coordinates into screen coordinates x and y
function getLocationCell(location){
	var row = location.row;
	var col = location.col;
	var x = (col-1)*cellWidth; //cellWidth is set in the redrawWindow function
	var y = (row-1)*cellHeight; //cellHeight is set in the redrawWindow function
	return {"x":x,"y":y};
}

function updateSurface(){

	var housesgrid= surface.selectAll(".houses").data(houseareas);
	var houserects = housesgrid.selectAll("rect");
	houserects
		.style("fill", function(d) {if(d.placeOrder==true) {return "red"} else if (d.placeOrder==false) return "pink" })

	var alldrivers = surface.selectAll(".driver").data(drivers);
	alldrivers.exit().remove()

	var newdrivers = alldrivers.enter().append("g").attr("class","driver");
	newdrivers.append("svg:image")
		.attr("x",function(d){var cell= getLocationCell(d.location); return cell.x+"px";})
		.attr("y",function(d){var cell= getLocationCell(d.location); return cell.y+"px";})
		.attr("width", Math.min(cellWidth,cellHeight)+"px")
		.attr("height", Math.min(cellWidth,cellHeight)+"px")
		.attr("xlink:href",function(d){
			if (d.type=="bicycle" && d.faceRight==true) {
				return bicyclePic;}
			else if (d.type=="bicycle" && d.faceRight==false) {
				return bicyclePicLeft;}
			else if (d.type=="motorcycle" && d.faceRight==true){
				return motorcyclePic;}
			else if (d.type=="motorcycle" && d.faceRight==false){
				return motorcyclePicLeft;}
			else if (d.type=="car" && d.faceRight==true){
				return carPic;}
			else if (d.type=="car" && d.faceRight==false){
				return carPicLeft;}
		})

	var images = alldrivers.selectAll("image");
	images.transition()
	 .attr("x",function(d){var cell= getLocationCell(d.location); return cell.x+"px";})
	 .attr("y",function(d){var cell= getLocationCell(d.location); return cell.y+"px";})
	 .attr("xlink:href",function(d){
		if (d.type=="bicycle" && d.faceRight==true) {
			return bicyclePic;}
		else if (d.type=="bicycle" && d.faceRight==false) {
			return bicyclePicLeft;}
		else if (d.type=="motorcycle" && d.faceRight==true){
			return motorcyclePic;}
		else if (d.type=="motorcycle" && d.faceRight==false){
			return motorcyclePicLeft;}
		else if (d.type=="car" && d.faceRight==true){
			return carPic;}
		else if (d.type=="car" && d.faceRight==false){
			return carPicLeft;}
	})
	 .duration(animationDelay).ease('linear'); // This specifies the speed and type of transition we want.

	var allstatistics = surface2.selectAll(".statistics").data(timeobject);
	allstatistics.exit().remove()
	var newstatistics = allstatistics.enter().append("g").attr("class","statistics");
	// For each new statistic group created we append a text label
	newstatistics.append("text")
	.attr("x", function(d) { return d.x+"px"; })
	.attr("y", function(d) { return d.y+"px"; })
	.attr("dy", ".35em")
	.text("");

	// The data in the statistics array are always being updated.
	// So, here we update the text in the labels with the updated information.
	allstatistics.selectAll("text").text(function(d) {
		return d.type+" drivers' average delivery time: "+ d.average.toFixed(2); }); //The toFixed() function sets the number of decimal places to display

	var allpricestatistics = surface2.selectAll(".pricestatistics").data(analyticsdataobject);
	allpricestatistics.exit().remove()
	var newpricestatistics = allpricestatistics.enter().append("g").attr("class","pricestatistics");
	// For each new statistic group created we append a text label
	newpricestatistics.append("text")
	.attr("x", function(d) { return d.x+"px"; })
	.attr("y", function(d) { return d.y+"px"; })
	.attr("dy", ".35em")
	.text("");

	// The data in the statistics array are always being updated.
	// So, here we update the text in the labels with the updated information.
	allpricestatistics.selectAll("text").text(function(d) {
		return d.type+" : "+parseFloat(d.value).toFixed(2); }); //The toFixed() function sets the number of decimal places to display

}

function reload(){
	isRunning = false
	numShops = document.getElementById("slider5").value;
	maxOrderPerDriver = document.getElementById("slider4").value;
	//reset all the dynamic variables
	shopareas = []
	ranShopList = []
	houseareas = []
	drivers = []
	ordersQueue = []
	currentTime = 0
	deliverytimetaken =0
	timeobject = [
		{
			type: "bicycle",
			cumulative: 0,
			average:0,
			counter:0,
			x:100,
			y:105,
		},
		{
			type: "motorcycle",
			cumulative: 0,
			average:0,
			counter:0,
			x:100,
			y:166,
		},
		{
			type: "car",
			cumulative: 0,
			average:0,
			counter:0,
			x:100,
			y:227,
		}
	]
	analyticsdataobject = [
		{
			type: "Probability of Driver Arrival",
			value: probDriverArrival,
			x:100,
			y:300,
		},
		{
			type: "Probability of Order Arrival",
			value: probOrderArrival,
			x:100,
			y:350,
		},
		{
			type: "Current Pricing Used",
			value: prevailingPrice,
			x:100,
			y:400,
		},
		{
			type: "Number of idle Drivers",
			value: 0.00,
			x:100,
			y:450,
		},
		{
			type: "Revenue generated per timeperiod",
			value: 0.00,
			x:100,
			y:500,
			counter:0,
			cumulativeperiodsum:0
		},
		{
			type: "Total Number of Orders Being Served",
			value: 0.00,
			x:100,
			y:550,
		}
	]

	generateBuildings()
	redrawWindow();
}

function addDynamicAgents(){

	var randStartRow =  Math.floor(Math.random() * Math.floor(30)) * 2 + 1 // generates odd number to ensure riders spawn on the road
	var randStartCol =  Math.floor(Math.random() * Math.floor(30)) * 2 + 1 // generates odd number to ensure riders spawn on the road

	var randEndRow =  Math.floor(Math.random() * Math.floor(30)) * 2 + 1 // generates odd number to ensure riders stop on the road
	var randEndCol =  Math.floor(Math.random() * Math.floor(30)) * 2 + 1 // generates odd number to ensure riders stop on the road

	if (Math.random()< probDriverArrival){
		var newDriver = {
			"id":driverCount,
			"type":null,
			"location":{"row":randStartRow,"col":randStartCol},
			"target":{"row":randEndRow,"col":randEndCol},
			"state":IDLE,
			"deliveryCount":0,
			"pickUpOrDropOff":true, //True when driver is picking up order, and False when driver is dropping off the order
			"order":null,
			"faceRight":true,
			"currentHouseNum":null,
			"prevailingPrice":null
		};
		if (Math.random()<probCar){
			newDriver.type = "car";
		} else if (Math.random()<probMotorcycle){
			newDriver.type = "motorcycle";
		}
		else {
			newDriver.type = "bicycle";
		}
		drivers.push(newDriver);
		driverCount++;
	}
}

function addDynamicOrders(){

	//randomly picks a house and a shop coordinates for order matching
	var randomNumHouse = Math.floor(Math.random() * houseareas.length)
	var randomHouse = houseareas[randomNumHouse];
	var randomShop = shopareas[Math.floor(Math.random() * shopareas.length)];

	//uniform distribution for waiting time that comes with the shop for the driver
	var randWaitingTime1 =  Math.floor(Math.random() * Math.floor(6))

	//uniform distribution for time taken for driver to contact the person and deliver the food
	var randWaitingTime2 =  Math.floor(Math.random() * Math.floor(3))

	if (Math.random()< probOrderArrival){
		var newOrder = {
			"id":orderCounter,
			"shoplocation":{"row":randomShop.startRow,"col":randomShop.startCol},
			"homelocation":{"row":randomHouse.startRow,"col":randomHouse.startCol},
			"homeidentifier":randomNumHouse,
			"waitingtime": randWaitingTime1,
			"footdeliverytime": randWaitingTime2,
			"timecounter":0,
			"ordertime":currentTime,
		};
		ordersQueue.push(newOrder);
		orderCounter ++;
		houseareas[randomNumHouse].placeOrder = true;

		analyticsdataobject[5].value = analyticsdataobject[5].value + 1
	}
}

function updateDriver(driverIndex){

	driverIndex = Number(driverIndex); //it seems driverIndex was coming in as a string
	var driver = drivers[driverIndex];
	// get the current location of the driver
	var row = driver.location.row;
	var col = driver.location.col;
	var type = driver.type;
	var state = driver.state;

	// determine if driver has arrived at whichever destination (to collect and deliver food)
	var hasArrived = (Math.abs(driver.target.row-row)+Math.abs(driver.target.col-col))==0;

	// Behavior of patient depends on his or her state
	switch(state){
		case IDLE:
			if (ordersQueue.length != 0){
				driver.order = ordersQueue.shift()

				if(driver.pickUpOrDropOff==true){
					driver.target.row = driver.order.shoplocation.row + 1
					driver.target.col = driver.order.shoplocation.col + 1
					driver.prevailingPrice = analyticsdataobject[2].value
				} else {}
				driver.state = DRIVINGTORESTAURANT;
			} else {}
		break;
		case DRIVINGTORESTAURANT:
			if(hasArrived){
				driver.state=COLLECTINGFOOD
			}
		break;
		case COLLECTINGFOOD:
			//Logic for waiting time in food collection - delay turns by a unif dist.
			if(driver.order.timecounter == driver.order.waitingtime)
				{
					driver.pickUpOrDropOff = false
					driver.target.row = driver.order.homelocation.row + 1
					driver.target.col = driver.order.homelocation.col + 1
					driver.state = DRIVINGTOHOUSE
					driver.order.timecounter = 0
				}
			else {
				driver.order.timecounter ++
			}
		break;
		case DRIVINGTOHOUSE:
			if(hasArrived){
				driver.state=DELIVERINGONFOOT
			}
		break;
		case DELIVERINGONFOOT:
			//Logic for last-mile delivery time. Time taken for finding the person who has ordered, time in lift, etc
			//Uniform distribution again for simplicity
			if(driver.order.timecounter == driver.order.footdeliverytime)
				{
					driver.state=FINISHEDDELIVERY
					driver.order.timecounter=0
				}
			else{
				driver.order.timecounter ++
			}
		break;
		case FINISHEDDELIVERY:
			driver.deliveryCount = driver.deliveryCount+1;
			houseareas[driver.order.homeidentifier].placeOrder = false;

			//Update money generated
			analyticsdataobject[4].cumulativeperiodsum = analyticsdataobject[4].cumulativeperiodsum + driver.prevailingPrice
			analyticsdataobject[5].value --

			//Delivery time analytics
			deliverytimetaken = currentTime - driver.order.ordertime
			if(driver.type=="bicycle"){
				timeobject[0].counter ++
				timeobject[0].cumulative = timeobject[0].cumulative + deliverytimetaken
				timeobject[0].average = timeobject[0].cumulative/timeobject[0].counter
				timeobject[0].simdata = deliverytimetaken
				if(dataCollectionTrigger == true){
					simDataCollector()
				}
			} else if(driver.type=="motorcycle"){
				timeobject[1].counter ++
				timeobject[1].cumulative = timeobject[1].cumulative + deliverytimetaken
				timeobject[1].average = timeobject[1].cumulative/timeobject[1].counter
				timeobject[1].simdata = deliverytimetaken
			} else {
				timeobject[2].counter ++
				timeobject[2].cumulative = timeobject[2].cumulative + deliverytimetaken
				timeobject[2].average = timeobject[2].cumulative/timeobject[2].counter
				timeobject[2].simdata = deliverytimetaken
			}

			if(driver.deliveryCount == maxOrderPerDriver){
				driver.state=FINISHEDWORK
				driver.order=null
			} else {
				driver.pickUpOrDropOff=true
				driver.state=IDLE
				driver.order=null
			}
		break;
		case FINISHEDWORK:
			//pass
		break;
		default:
		break;
	}
	// set the destination row and column
	var targetRow = driver.target.row; //such that the driver will always stop INFRONT of the house
	var targetCol = driver.target.col;
	// compute the distance to the target destination
	var rowsToGo = targetRow - row;
	var colsToGo = targetCol - col;

	// set the speed - DIFFERENT VEHICLES HAVE DIFFERENT SPEEDS
	if (type == "car") {
		var cellsPerStep = 3;
	} else if (type == "motorcycle") {
		var cellsPerStep =5
	} else {
		var cellsPerStep = 1
	}

	// Code logic to make the vehicles move along the roads , and to avoid the houses
	if (driver.state ==IDLE){
		newCol=col
		newRow=row
	}
	else if (rowsToGo==0 || colsToGo==0){
		if (rowsToGo==0){
			//problem of drivers crossing houses in the same row is taken away by making the road infront of the house as the target row.
			var newCol = col + Math.min(Math.abs(colsToGo),cellsPerStep)*Math.sign(colsToGo)
			var newRow = row
			if(rowsToGo==0 && colsToGo==0){
				var newCol = newCol - 1
				var newRow = newRow
			}
		} else if (colsToGo==0){
			//problem of motorcycle/car drivers crossing houses in teh same column is taken away by
			var newRow = row + Math.min(Math.abs(rowsToGo),cellsPerStep)*Math.sign(rowsToGo)
			var newCol = col
			if(rowsToGo==0 && colsToGo==0){
				var newCol = newCol - 1
				var newRow = newRow
			}
		}
	}
	else if (Math.random()<0.5){
		var newRow = row + Math.min(Math.abs(rowsToGo),cellsPerStep)*Math.sign(rowsToGo)
		var newCol = col
		if(newRow%2==0 && newCol%2==0){
			var newCol = col + Math.min(Math.abs(colsToGo),cellsPerStep)*Math.sign(colsToGo)
			var newRow = row
		}
	} else {
		var newCol = col + Math.min(Math.abs(colsToGo),cellsPerStep)*Math.sign(colsToGo)
		var newRow = row
		if(newRow%2==0 && newCol%2==0){
			var newRow = row + Math.min(Math.abs(rowsToGo),cellsPerStep)*Math.sign(rowsToGo);
			var newCol = col
		}
	}

	//direction-check
	if(Math.sign(colsToGo)==-1){
		driver.faceRight=false;
	} else if (Math.sign(colsToGo)==1){
		driver.faceRight=true;
	}

	// update the location of the driver
	driver.location.row = newRow;
	driver.location.col = newCol;
}

function updateDynamicAgents(){
	// loop over all the agents and update their states
	for (var driverIndex in drivers){
		updateDriver(driverIndex);
	}
	updateSurface();
}

function updateAnalytics(){
	var idleNum = drivers.filter(function(d){return d.state==IDLE;}).length

	//Pricing Analytics
	if(pricingtrigger==true){
		var tolerableIdleNum = drivers.length
		if(tolerableIdleNum <10){
			tolerableIdleNum = 10
		}
		var idleRatio = (idleNum- (0.1*tolerableIdleNum)) / (0.1*tolerableIdleNum)
		var coefficientRatio = bicycleWeightage*((timeobject[0].average - bicycleOptimalServiceTime)/ bicycleOptimalServiceTime) + motorcycleWeightage*((timeobject[1].average -motorcycleOptimalServiceTime) / motorcycleOptimalServiceTime) + carWeightage*((timeobject[2].average-carOptimalServiceTime) / carOptimalServiceTime) - idleWeightage*(idleRatio)
		//sigmoid function to transform the coeeficientRatio into price
		prevailingPrice =  ((1/(1+Math.exp(-coefficientRatio))) * (maxPrice-minPrice)) + minPrice
		//adjust the order arrival and driver arrival probabilities
		probOrderArrival = Math.min(Math.max( (-1.134*Math.log(prevailingPrice) + 2.0886) , 0), 1);
		probDriverArrival = Math.min(Math.max( (1.1338*Math.log(prevailingPrice) - 1.0886) , 0), 1);

		analyticsdataobject[0].value = probDriverArrival
		analyticsdataobject[1].value = probOrderArrival
		analyticsdataobject[2].value = prevailingPrice
		analyticsdataobject[3].value = idleNum
	} else {
		probOrderArrival = document.getElementById("slider2").value;
		probDriverArrival = document.getElementById("slider3").value;

		analyticsdataobject[0].value = probDriverArrival
		analyticsdataobject[1].value = probOrderArrival
		analyticsdataobject[2].value = 3.5
		analyticsdataobject[3].value = idleNum
	}

	//Revenue generation calculation
	analyticsdataobject[4].counter ++
	if(analyticsdataobject[4].counter>=50){
		analyticsdataobject[4].counter = 0
		analyticsdataobject[4].value = analyticsdataobject[4].cumulativeperiodsum
		analyticsdataobject[4].cumulativeperiodsum = 0
	} else {}
}

function removeDynamicAgents(){
		var alldrivers = surface.selectAll(".driver").data(drivers);
		var finisheddrivers = alldrivers.filter(function(d){return d.state==FINISHEDWORK;})
		finisheddrivers.remove();

		drivers = drivers.filter(function(d){return d.state!=FINISHEDWORK})
}

function simStep(){
	//This function is called by a timer; if running, it executes one simulation step
	//The timing interval is set in the page initialization function near the top of this file
	if (isRunning){ //the isRunning variable is toggled by toggleSimStep
		// Increment current time (for computing statistics)
		currentTime++;
		addDynamicOrders();

		// Sometimes new agents will be created in the following function
		addDynamicAgents();

		// In the next function we update each agent
		updateDynamicAgents();

		// Sometimes agents will be removed in the following function
		removeDynamicAgents();

		//dynamically adjust pricing to ensure maximum efficiency and order satisfaction
		updateAnalytics();

		// Collect Data for Simulation Output Analysis (only triggered when Specific Button is pressed)
		if(dataCollectionTrigger == true){
			simDataCollector()
		}

	}
}

function simDataCollector(){
	if (currentTime <= numRuns && dataCollectionSwitch == true){
		simDataObject = {
			time: currentTime,
			run:repetitionCounter,
			bicycleDelivery:timeobject[0].simdata,
			motorcycleDelivery:timeobject[1].simdata,
			carDelivery:timeobject[2].simdata,
		}
		timeobject[0].simdata = 0
		timeobject[1].simdata = 0
		timeobject[2].simdata = 0
		outputAnalysisDataObject.push(simDataObject)
		if(currentTime==numRuns){
			dataCollectionSwitch=false // alternate changing between DP runs and Non DP runs
			dpTrigger = true
			specialReload()
			reloadGraph()
		}
	} else if (currentTime <= numRuns && dataCollectionSwitch == false) {
		simDataObject = {
			time: currentTime,
			run:repetitionCounter,
			bicycleDeliveryDP:timeobject[0].simdata,
			motorcycleDeliveryDP:timeobject[1].simdata,
			carDeliveryDP:timeobject[2].simdata,
		}
		timeobject[0].simdata = 0
		timeobject[1].simdata = 0
		timeobject[2].simdata = 0
		outputAnalysisDataObject2.push(simDataObject)
		if(currentTime==numRuns){
			dataCollectionSwitch=true // alternate changing between DP runs and Non DP runs
			repetitionCounter ++ //Count how many independent runs are being done
			dpTrigger = false
			specialReload()
			reloadGraph()
			console.log("Current Rep: ",repetitionCounter)
		}
		if(repetitionCounter==numReps){
			currentTime = 9999990 //Exit Condition
		}
	}
	 else {
		toggleSimStep()
		dataCollectionTrigger = false

		var csv = arrayToCSV(outputAnalysisDataObject)
		var csv2 = arrayToCSV(outputAnalysisDataObject2)
		alert("Simulation For Data Collection has Ended. Please Download CSV from the button created at the most bottom left of this page. Please remember to refresh this page before running any simulation again.")

		a=document.createElement('a');
		a.textContent='download   ';
		a.download="simData_13Dec.csv";
		a.href='data:text/csv;charset=utf-8,'+escape(csv);
		document.body.appendChild(a);

		b=document.createElement('a');
		b.textContent='download';
		b.download="simDPData_13Dec2.csv";
		b.href='data:text/csv;charset=utf-8,'+escape(csv2);
		document.body.appendChild(b);

	}
}

function obtainSimData(){
	animationDelay = 0
	pricingtrigger = false
	simTimer = window.setInterval(simStep, animationDelay);
	dataCollectionTrigger = true
	toggleSimStep()
}

//Code Source - Stack Overflow https://stackoverflow.com/questions/11257062/converting-json-object-to-csv-format-in-javascript
function arrayToCSV(objArray) {
     const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
     let str = `${Object.keys(array[0]).map(value => `"${value}"`).join(",")}` + '\r\n';

     return array.reduce((str, next) => {
         str += `${Object.values(next).map(value => `"${value}"`).join(",")}` + '\r\n';
         return str;
        }, str);
}

function specialReload(){
	//reset all the dynamic variables
	drivers = []
	ordersQueue = []
	currentTime = 0
	deliverytimetaken = 0
	timeobject = [
		{
			type: "bicycle",
			cumulative: 0,
			average:0,
			counter:0,
			simdata:0,
			x:100,
			y:105,
		},
		{
			type: "motorcycle",
			cumulative: 0,
			average:0,
			counter:0,
			simdata:0,
			x:100,
			y:166,
		},
		{
			type: "car",
			cumulative: 0,
			average:0,
			counter:0,
			simdata:0,
			x:100,
			y:227,
		}
	]
	analyticsdataobject = [
		{
			type: "Probability of Driver Arrival",
			value: probDriverArrival,
			x:100,
			y:300,
		},
		{
			type: "Probability of Order Arrival",
			value: probOrderArrival,
			x:100,
			y:350,
		},
		{
			type: "Current Pricing Used",
			value: prevailingPrice,
			x:100,
			y:400,
		},
		{
			type: "Number of idle Drivers",
			value: 0.00,
			x:100,
			y:450,
		},
		{
			type: "Revenue generated per timeperiod",
			value: 0.00,
			x:100,
			y:500,
			counter:0,
			cumulativeperiodsum:0
		},
		{
			type: "Total Number of Orders Being Served",
			value: 0.00,
			x:100,
			y:550,
		}
	]
	redrawWindow();

}
var WINDOWBORDERSIZE = 10;
var HUGE = 999999; //Sometimes useful when testing for big or small numbers
var animationDelay = 200; //controls simulation and transition speed
var isRunning = false; // used in simStep and toggleSimStep
var surface; // Set in the redrawWindow function. It is the D3 selection of the svg drawing surface
var simTimer; // Set in the initialization function

//The drawing surface will be divided into logical cells
var maxCols = 60;
var maxRows = 60
var cellWidth; //cellWidth is calculated in the redrawWindow function
var cellHeight; //cellHeight is calculated in the redrawWindow function

const IDLE=0;
const DRIVINGTORESTAURANT=1;
const COLLECTINGFOOD=2;
const DRIVINGTOHOUSE =3;
const DELIVERINGONFOOT=4;
const FINISHEDDELIVERY=5;

var currentTime = 0;

var shopareas = []
var ranShopList = []
var houseareas = []
var drivers = []
var ordersQueue = []

var probOrderArrival = 0.1;

var probDriverArrival = 0.3;
var probDriverDeparture = 0.3;

var probBicycle = 0.3;
var probMotorcycle = 0.25;
var probCar = 0.15;

var rowHDB = 29
var colHDB = 29
var numShops = 20

const bicyclePic = "images/deliverybicycle.svg";
const motorcyclePic = "images/deliverymotorcycle.svg";
const carPic = "images/deliverycar.svg";

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

function redrawWindow(){

	isRunning = false; // used by simStep
	window.clearInterval(simTimer); // clear the Timer
	animationDelay = 550 - document.getElementById("slider1").value;
	simTimer = window.setInterval(simStep, animationDelay); // call the function simStep every animationDelay milliseconds

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
	drawsurface.style.border = "thick solid #0000FF"; //The border is mainly for debugging; okay to remove it
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

	var housesgrid= surface.selectAll(".houseareas").data(houseareas)
	var newhouseareas = housesgrid.enter().append("g").attr("class","houses");
	// For each new area, append a rectangle to the group
	newhouseareas.append("rect")
		.attr("x", function(d){return (d.startCol-1)*cellWidth;})
		.attr("y",  function(d){return (d.startRow-1)*cellHeight;})
		.attr("width",  function(d){return d.numCols*cellWidth;})
		.attr("height",  function(d){return d.numRows*cellWidth;})
		.style("fill", function(d) { return d.color; })
		.style("stroke","black")
		.style("stroke-width",1);

	var shopsgrid= surface.selectAll(".shopareas").data(shopareas)
	var newshopareas = shopsgrid.enter().append("g").attr("class","shops");
	// For each new area, append a rectangle to the group
	newshopareas.append("rect")
		.attr("x", function(d){return (d.startCol-1)*cellWidth;})
		.attr("y",  function(d){return (d.startRow-1)*cellHeight;})
		.attr("width",  function(d){return d.numCols*cellWidth;})
		.attr("height",  function(d){return d.numRows*cellWidth;})
		.style("fill", function(d) { return d.color; })
		.style("stroke","black")
		.style("stroke-width",1);

	// rebuild contents of the drawing surface
	updateSurface();
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

	var alldrivers = surface.selectAll(".driver").data(drivers);
	alldrivers.exit().remove()

	var newdrivers = alldrivers.enter().append("g").attr("class","driver");
	newdrivers.append("svg:image")
		.attr("x",function(d){var cell= getLocationCell(d.location); return cell.x+"px";})
		.attr("y",function(d){var cell= getLocationCell(d.location); return cell.y+"px";})
		.attr("width", Math.min(cellWidth,cellHeight)+"px")
		.attr("height", Math.min(cellWidth,cellHeight)+"px")
		.attr("xlink:href",function(d){if (d.type=="bicycle") return bicyclePic; else if (d.type=="motorcycle") return motorcyclePic; else return carPic; });


	var images = alldrivers.selectAll("image");
	images.transition()
	 .attr("x",function(d){var cell= getLocationCell(d.location); return cell.x+"px";})
	 .attr("y",function(d){var cell= getLocationCell(d.location); return cell.y+"px";})
	 .duration(animationDelay).ease('linear'); // This specifies the speed and type of transition we want.

}

function addDynamicAgents(){

	var randStartRow =  Math.floor(Math.random() * Math.floor(60))
	var randStartCol =  Math.floor(Math.random() * Math.floor(60))

	if (Math.random()< probDriverArrival){
		var newDriver = {
			"id":1,
			"type":"Bicycle",
			"location":{"row":randStartRow,"col":randStartCol},
			"target":{"row":60,"col":60},
			"state":"IDLE",
			"deliveryCount":0,
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
	}
}

function addDynamicOrders(){

	if (Math.random()< probOrderArrival){
		var newOrder = {
			"id":1,
			"shoplocation":{"row":0,"col":0},
			"homelocation":{"row":60,"col":60},
		};
		ordersQueue.push(newOrder);
	}
}

function updateDriver(driverIndex){

	driverIndex = Number(driverIndex); //it seems patientIndex was coming in as a string
	var driver = drivers[driverIndex];
	// get the current location of the patient
	var row = driver.location.row;
	var col = driver.location.col;
	var type = driver.type;
	var state = driver.state;

	// determine if patient has arrived at destination
	var hasArrived = (Math.abs(driver.target.row-row)+Math.abs(driver.target.col-col))==0;


	// Behavior of patient depends on his or her state
	switch(state){
		case IDLE:
		break;
		case DRIVINGTORESTAURANT:
		break;
		case COLLECTINGFOOD:
		break;
		case DRIVINGTOHOUSE:
		break;
		case DELIVERINGONFOOT:
		break;
		case FINISHEDDELIVERY:
		break;
		default:
		break;
	}
	// set the destination row and column
	var targetRow = driver.target.row;
	var targetCol = driver.target.col;
	// compute the distance to the target destination
	var rowsToGo = targetRow - row;
	var colsToGo = targetCol - col;
	// set the speed
	var cellsPerStep = 1;
	if (rowsToGo==0 || colsToGo==0){
		if (rowsToGo==0){
			var newCol = col + Math.min(Math.abs(colsToGo),cellsPerStep)*Math.sign(colsToGo)
			var newRow = row
		} else {
			var newRow = row + Math.min(Math.abs(rowsToGo),cellsPerStep)*Math.sign(rowsToGo)
			var newCol = col
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
	// update the location of the driver
	driver.location.row = newRow;
	driver.location.col = newCol;
}

function removeDynamicAgents(){
}

function updateDynamicAgents(){
	// loop over all the agents and update their states
	for (var driverIndex in drivers){
		updateDriver(driverIndex);
	}
	updateSurface();
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

		console.log(drivers)
		console.log(ordersQueue)
	}
}

function generateBuildings(){

	var counter = 0
	for (var a=0; a<numShops; a++){
		var ranNum =  Math.floor(Math.random() * Math.floor(rowHDB*colHDB))
		ranShopList.push(ranNum)
	}
	console.log(ranShopList)
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
					houseareas.push(
						{
							"label":"HDB",
							"startRow":i+1,
							"numRows":1,
							"startCol":j+1,
							"numCols":1,
							"color":"pink"
						}
					)}

					counter++
				}
			}

		}
	}
}

//#11AD22
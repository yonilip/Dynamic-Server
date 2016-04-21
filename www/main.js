/**
 * Demo single page application to test the server on
 * Written about my course partner - Maor Ivgi
 */

createLoginPage();
createProfilePage();
createCalcPage();
chooseDisplay("login");

// **************************************************************************************
// Login page

function createLoginPage() {
	var loginDiv = document.createElement("div");
	loginDiv.id =  "loginPage" ;
	
	var loginForm = document.createElement("FORM");
	loginForm.id = "loginForm";
	loginDiv.appendChild(loginForm);
	
	var loginIn = document.createElement("INPUT");
	loginIn.setAttribute("type", "text");
	loginIn.setAttribute("id", "username");
	loginIn.setAttribute("placeholder", "Username");

	var pswdIn = document.createElement("INPUT");
	pswdIn.setAttribute("type", "password");
	pswdIn.setAttribute("id", "password");
	pswdIn.setAttribute("placeholder", "Password");
	
	var submitBtn = document.createElement("INPUT");
	submitBtn.setAttribute("type", "submit");
	submitBtn.setAttribute("value", "login");
	submitBtn.id = "submitButton";
	submitBtn.addEventListener("click", function(event){ event.preventDefault() });
	submitBtn.addEventListener("click", login);
	
	loginForm.appendChild(loginIn);
	loginForm.appendChild(pswdIn);
	loginForm.appendChild(submitBtn);
	
	loginDiv.style.display = "none";
	document.body.appendChild(loginDiv);
	
}

function login() {
	var user = document.getElementById("username");
	var pswd = document.getElementById("password");
	if (username.value === "admin" && pswd.value === "admin") {
		chooseDisplay("profile");
	}
	else {
		alert("Error: you were not recognize by the system as ad admin. please try again");
		document.getElementById("password").value =  "";
		document.getElementById("password").focus();
	}
}

function resetLoginPage() {
	document.getElementById("username").value =  "";
	document.getElementById("password").value =  "";
	document.getElementById("username").focus();
}


// **************************************************************************************
// Profile page

function createProfilePage() {
	// main wrapper
	var profileDiv = document.createElement("div");
	profileDiv.id = "profilePage";

	// name div
	var textDiv = document.createElement("div");
	var headName = document.createElement("h3");
	textDiv.id = "textDiv";
	headName.textContent = "Maor Ivgi";
	textDiv.appendChild(headName);

	
	// image div
	var myImg = document.createElement("div");
	myImg.id = "myImage";
	textDiv.appendChild(myImg);
	
	var hobbyP1 = document.createElement("p");
	hobbyP1.textContent = "Since I spend most of my days just sitting in front of my computer (both at work and when I study), I really enjoy working out. Those times of physical excercise always makes me feel rejouvinated and happy. Mostly, I like jogging. When the weather is nice and I have the time, I like to put on my sneakers, put some playlst on my phone and go out for an hour or so of jogging.";
	textDiv.appendChild(hobbyP1);
	
	var hobbyP2 = document.createElement("p");
	hobbyP2.textContent = "Another thing I like doing is helping my father out in their backyard. We plant, work the grass and build all sorts of things to make it nicer for people to spend time there. We've built a fish-pool with water plants, waterfall and a fauntain. We also built a barbeque place, some pavements that go across the yard in between the plants and more. It is always nice to spend a day outside in the sun.";
	textDiv.appendChild(hobbyP2);
	
	var hobbyP3 = document.createElement("p");
	hobbyP3.textContent = "The third and my favorite hobby is traveling. It doesn't matter whether if it's a few days trek out in the nature, hitch-hiking to see go a natural pool somewhere or even just go to see a museum or a monumanet somewhere in Europe. Just being out there, expericing the world and take in what it's got to offer.";
	textDiv.appendChild(hobbyP3);
	
	// quote div
	var quote = document.createElement("blockquote");
	quote.setAttribute("cite" , "http://www.brainyquote.com/quotes/quotes/a/alberteins133991.html");
	quote.textContent = '"Insanity is doing the same thing over and over again and expecting different results"';
	textDiv.appendChild(quote);
	
	profileDiv.appendChild(textDiv);
		
	var btnsDiv = document.createElement("div");
	btnsDiv.id = "btnsDiv";
	
	// Logout button
	var logoutBtn = document.createElement("BUTTON");
	logoutBtn.id = "logoutButton";
	var logoutT = document.createTextNode("Logout");
	logoutBtn.appendChild(logoutT);
	logoutBtn.addEventListener("click" , function() { 
			alert("You were successfully logout!" );
			resetLoginPage();
			chooseDisplay("login"); 
			});
	btnsDiv.appendChild(logoutBtn);
	
	// Calculator button
	
	var calcBtn = document.createElement("BUTTON");
	calcBtn.id = "calcPButton";
	var calcT = document.createTextNode("calculator");
	calcBtn.appendChild(calcT);
	calcBtn.addEventListener("click" , function() { 
			resetCaclPage();
			chooseDisplay("calculator"); 
			});
	btnsDiv.appendChild(calcBtn);
	
	profileDiv.appendChild(btnsDiv);
		
	// Add to document
	profileDiv.style.display = "none";
	document.body.appendChild(profileDiv);
}

// **************************************************************************************
// Calc Page:
 
function Calc() {
    this.value = 0; // current value that the calculator instance is holding
	this.tempVal = ""; // the current temporary value which the user is still typing in
	this.currOp = '='; // the next operation to be performed
	this.floatingPointCount = 0; // floating point representation of the number (place after the decimal point to put the new digit)
	this.calcBody = document.createElement("div"); // calculator intance main wrapper
	this.calcBody.className = this.calcBody.className + " calculatorBody";
	this.buttons = [];
	
	// values div
	this.valuesDiv = document.createElement("div");
	this.calcBody.appendChild(this.valuesDiv);
	this.valuesDiv.className = this.valuesDiv.className + " values";
	
	// CurrentValue screen
	this.currValPar = document.createElement("p");
	this.currValPar.textContent = "0";
	this.valuesDiv.appendChild(this.currValPar);
	
	// TempVal screen
	this.tempValPar = document.createElement("p");
	this.tempValPar.textContent = "";
	this.valuesDiv.appendChild(this.tempValPar);
	
	this.closeCalcBtn = new Button("X");
	this.closeCalcBtn.btn.addEventListener("click",  closeCalc.bind(this) );
	this.calcBody.appendChild(this.closeCalcBtn.btn);
	this.closeCalcBtn.btn.className = this.closeCalcBtn.btn.className + " closeButton";
	
	// Generate buttons
	
	// upper row
	for (var i = 7; i <= 9; i++ ) {
		this.buttons[i] = new DigitButton(i, this);
		this.calcBody.appendChild(this.buttons[i].butn.btn);
	}
	
	this.buttons["+"] = new ActionButton("+", this);
	this.calcBody.appendChild(this.buttons["+"].butn.btn);
	
	// second row
	for (var i = 4; i <= 6; i++ ) {
		this.buttons[i] = new DigitButton(i, this);
		this.calcBody.appendChild(this.buttons[i].butn.btn);
	}
	
	this.buttons["-"] = new ActionButton("-", this);
	this.calcBody.appendChild(this.buttons["-"].butn.btn);
	
	// third row
	for (var i = 1; i <= 3; i++ ) {
		this.buttons[i] = new DigitButton(i, this);
		this.calcBody.appendChild(this.buttons[i].butn.btn);
	}
	
	this.buttons["*"] = new ActionButton("*", this);
	this.calcBody.appendChild(this.buttons["*"].butn.btn);
	
	// last row
	this.buttons[0] = new DigitButton(0, this);
	this.calcBody.appendChild(this.buttons[0].butn.btn);
	
	this.setToFloatingPoint = function() { if (this.floatingPointCount === 0) this.floatingPointCount = 1; } 
	this.buttons["."] = new Button('.');
	this.buttons["."].btn.addEventListener("click", this.setToFloatingPoint.bind(this));
	this.buttons["."].btn.className = this.buttons["."].btn.className + " actionButton";
	this.calcBody.appendChild(this.buttons["."].btn);
	
	this.buttons["="] = new ActionButton("=", this);
	this.calcBody.appendChild(this.buttons["="].butn.btn);
	
	this.buttons["/"] = new ActionButton("/", this);
	this.calcBody.appendChild(this.buttons["/"].butn.btn);
	
}	

Calc.prototype.renderTempVal = function () {
	this.tempValPar.textContent = this.tempVal;
}
	
Calc.prototype.render = function () {
	if (!(this.tempVal === "")) {
		switch (this.currOp) {
			case '+':
			this.value = this.value + this.tempVal;
			break;
			
			case '-':
			this.value = this.value - this.tempVal;
			break;
			
			case '*':
			this.value = this.value * this.tempVal;
			break;
			
			case '/':
			if (this.tempVal === 0) {
				alert("Cannot divide in 0!!");
				return;
			}
			this.value = this.value / this.tempVal;
			break;
			
			case '=':
			this.value = this.tempVal;
			break;	
		}
		this.floatingPointCount = 0;
		this.tempVal = "";
		this.renderTempVal();
		this.currValPar.textContent = this.value;
	}
}
	

function closeCalc() {
	var r = confirm("Are you sure you want to close the calculator?");
	if (r == true) {
		if (this.calcBody != null) {
		document.getElementById("calcDiv").removeChild(this.calcBody);
	}
	} else {
		// Do nothing
	}
	
}

function DigitButton(val, calc) {
		this.calc = calc;
		this.val = val;
		this.addToTempVal = function() {
			var currFloatCount = this.calc.floatingPointCount;
			if (currFloatCount === 0) {
				this.calc.tempVal = this.calc.tempVal * 10 + this.val;
			}
			else {
				this.calc.tempVal = this.calc.tempVal * Math.pow(10,currFloatCount) + this.val;
				this.calc.tempVal = this.calc.tempVal / Math.pow(10,currFloatCount);
				this.calc.floatingPointCount = this.calc.floatingPointCount + 1;
			}
			this.calc.renderTempVal();
		}
		this.butn = new Button(this.val);
		this.butn.btn.addEventListener("click", this.addToTempVal.bind(this));
		this.butn.btn.className = this.butn.btn.className + " digitButton";
}

function Button(val) {
		this.btn = document.createElement("BUTTON");
		var t = document.createTextNode(val);
		this.btn.appendChild(t);
}

function ActionButton(val, calc) {		
		this.calc = calc;
		this.val = val;
		
		this.changeOp = function() {
			this.calc.render();
			this.calc.currOp = this.val;
			if (!(this.calc.currOp === '=')) {
				this.calc.currValPar.textContent = this.calc.value + " " + this.calc.currOp;
			}
		}
		this.butn = new Button(this.val);
		this.butn.btn.addEventListener("click", this.changeOp.bind(this));
		this.butn.btn.className = this.butn.btn.className + " actionButton";
}

function addNewCalc() {
	var calc1 = new Calc();
	document.getElementById("calcDiv").appendChild(calc1.calcBody);
}

function createCalcPage() {	
	// main wrapper
	var calcPage = document.createElement("div");
	calcPage.id = "calculatorPage";
	
	// new calcl button
	var newCalcButton = new Button("New Calc!");
	newCalcButton.btn.id = "newCalcButton";
	newCalcButton.btn.addEventListener("click", addNewCalc);
	calcPage.appendChild(newCalcButton.btn);
	
	// back button
	var backBtn = document.createElement("BUTTON");
	backBtn.id = "backButton";

	var backT = document.createTextNode("Back to profile");
	backBtn.appendChild(backT);
	backBtn.addEventListener("click" , function() { 
			var r = confirm("Are yout sure you want to go back to the profile page?\nThis will result in closing all calculators instances you have open" );
			if (r === true)
				chooseDisplay("profile"); 
			});
	calcPage.appendChild(backBtn);
	
	// calculators div
	var calcDiv = document.createElement("div");
	calcDiv.id = "calcDiv";
	calcPage.appendChild(calcDiv);
	
	// attaching to body
	calcPage.style.display = "none";
	document.body.appendChild(calcPage);
	resetCaclPage();
}

function resetCaclPage() {
	var calcDiv = document.getElementById("calcDiv");
	if (calcDiv != null) {
		while (calcDiv.firstChild) {
			calcDiv.removeChild(calcDiv.firstChild);
		}
		addNewCalc();
	}
}


// **************************************************************************************

function chooseDisplay(page) {
	var pages = [];
	pages["login"] = document.getElementById("loginPage");
	pages["profile"] = document.getElementById("profilePage");
	pages["calculator"] = document.getElementById("calculatorPage");
	
	if (pages[page] != null) {
		for (var p in pages) {
			if (pages[p] != null) {
			pages[p].style.display = "none";
			}
		}
		pages[page].style.display = "block";
		if (page === "login") resetLoginPage();
	}
}
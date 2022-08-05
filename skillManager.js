var mousedownbegin;
var lastTouched;
var touchtimer;

function handleMousedown(event) {
	event.preventDefault();
	switch (event.which) {
		case 1: //left mouse button
			window.clearTimeout(touchtimer);
			mousedownbegin = (new Date()).getTime();
			lastTouched = $(this);
			touchtimer = window.setTimeout('checkLongTouch(true)',500);
			break;
//		case 2: //middle mouse button
//			break;
//		case 3: //right mouse button
//			break;
	}
}
function handleMouseup(event) {
	event.preventDefault();
	switch (event.which) {
		case 1: //left mouse button
			window.clearTimeout(touchtimer);
			checkLongTouch(false);
			break;
		case 3: //right mouse button
			updatePoints($(this), -1);
			break;
	}
}

function checkLongTouch(fromTimer) {
	if (lastTouched !== null) {
		if (fromTimer === true) {
			updatePoints(lastTouched, -1);
			updatePoints(lastTouched, -1);
			updatePoints(lastTouched, -1);
			updatePoints(lastTouched, -1);
			updatePoints(lastTouched, -1);
		} else {
			updatePoints(lastTouched, 1);
		}
		lastTouched = null;
	}
}

function updatePoints(skillHandle, change) {
	var tree = skillHandle.parent().parent();
	var thisLevel = parseInt(skillHandle.parent().attr("data-level"));
	var invested = parseInt(skillHandle.parent().attr("data-invested"));
	var tierTotal = parseInt(skillHandle.parent().attr("data-total"));
	var treeTotal = parseInt(tree.find("span.totalPoints").text());
	var points = parseInt(skillHandle.attr("data-points"));
	var max = parseInt(skillHandle.attr("data-max"));
	var charLevel = parseInt($("span.charLevel").text());
	if(change > 0) {
		if (points < max && treeTotal >= 2 * thisLevel && charLevel < 80) {
			++points;
		}
	} else {
		if (points > 0) {
			var ok = true;
			tree.children("div.tier").each(function(index) {
				var level = parseInt($(this).attr("data-level"));
				var total = parseInt($(this).attr("data-total")) - (level == thisLevel ? 1 : 0);
				var invested = parseInt($(this).attr("data-invested")) - (level > thisLevel ? 1 : 0);
				ok &= (
					(level == thisLevel && total == 0 && treeTotal >= invested + total) ||
					(level != thisLevel && total == 0) ||
					(total > 0 && (level * 2 <= invested))
				);
			});
			if (ok) {
				--points;
			}
		}
	}
	skillHandle.attr("data-points", points);
	updateTree(tree);
	updateStats();
}

function updateTree(treeHandle) {
	var totalPoints = 0;
	$(treeHandle).find("div.tier").each(function(index) {
		$(this).attr("data-invested", totalPoints); //the PREVIOUS tier running total
		var tierLevel = parseInt($(this).attr("data-level"));
		var tierTotal = 0;
		$(this).children("div.skill").each(function(index) {
			var p = parseInt($(this).attr("data-points"));
			var m = parseInt($(this).attr("data-max"));
			totalPoints += p;
			tierTotal += p;
			$(this).children("div.points").html(
				p + "/" + m
			);
			$(this).children("div.points").css("visibility", (totalPoints < 2 * tierLevel) ? "hidden" : "visible");
			$(this).removeClass("partial full");
			if (p != 0) {
				$(this).addClass(p < m ? "partial" : "full");
			}
			$(this).find("em").each(function(index) {
				var mod = parseFloat($(this).attr("data-mod"));
				if (isNaN(mod)) mod = 0;
				var base = parseFloat($(this).attr("data-base"));
				var sum = Math.round((Math.max(p,1) * base + mod)*100)/100; //Math.round to eliminate goofy float errors
				var plus = ($(this).attr("data-base").substring(0,1) === "+" ? "+" : "");
				$(this).html((sum > 0 ? plus : (sum == 0 ? "" : "-")) + sum);
			});		
		});
		$(this).attr("data-total", tierTotal);
	});
	$(treeHandle).find("span.totalPoints").html(totalPoints);
	
	//Begin scaling based on points spent in tree
	$(treeHandle).find("div.tier").each(function(index) {
		$(this).find("span.tpScaling").each(function(index) {
			var base = parseFloat($(this).attr("tpScaling-base"));
			var mod = parseFloat($(this).attr("tpScaling-mod"));
			var step = parseFloat($(this).attr("tpScaling-step"));	//step ceiling
			var stepFloor = parseFloat($(this).attr("tpScaling-stepFloor")); 
			if (isNaN(mod)) mod = 0;
			if (isNaN(step)) step = 1;
			if (isNaN(stepFloor)) stepFloor = 1;
			console.log("totalPoints is " + totalPoints);
			var sum = Math.floor(Math.ceil((totalPoints * base/step) + mod)/stepFloor);
			var plus = ($(this).attr("tpScaling-base").substring(0,1) === "+" ? "+" : "");
			$(this).html((sum > 0 ? plus : (sum == 0 ? "" : "-")) + sum);
		});	
	});
	//End scaling based on points spent in tree
	
	//Begin passive skill functions
	var actionSkill = $(treeHandle).parentsUntil(".treeCollection").find(".actionSkill");
	actionSkill.find(".passive").html(totalPoints);
	actionSkill.find("em").each(function(index) {
		var base = parseFloat($(this).attr("passive-base"));
		var mod = parseFloat($(this).attr("passive-mod"));
		var step = parseFloat($(this).attr("passive-step"));
		if (isNaN(mod)) mod = 0;
		if (isNaN(step)) step = 1;
		var sum = Math.ceil((Math.round((Math.max(totalPoints,1) * base + mod)*100)/100)/step);
		var plus = ($(this).attr("passive-base").substring(0,1) === "+" ? "+" : "");
		$(this).html((sum > 0 ? plus : (sum == 0 ? "" : "-")) + sum);
	});
	//End passive skill functions
	
	//Begin keyTalent skill functions
	var keyTalent = $(treeHandle).find(".keyTalent");
	if (keyTalent.length === 1) {
		let pointsInvested = parseFloat(keyTalent.first().attr("data-points"));
		if (pointsInvested > 0) {
			$(treeHandle).find("div.extra-text").each(function(index) {
				if ($(this).hasClass("hidden")) {
					$(this).removeClass("hidden");
				}
			});
		} else if (pointsInvested == 0) {
			$(treeHandle).find("div.extra-text").each(function(index) {
				if (!$(this).hasClass("hidden")) {
					$(this).addClass("hidden");
				}
			});
		}
	};
	//End keyTalent skill functions
	
	$(treeHandle).parent().children(".color").height(Math.min(80 + totalPoints * 59.0 / 2 + (totalPoints > 25 ? 21 : 0), 396));
}

function updateStats() {
	var total = 0;
	$("span.totalPoints").each(function(index) {
		total += parseInt($(this).text());
	});
	$("span.charLevel").html(20+total);
	var descriptions = "";
	
	//Begin passive skill functions
	$("div.actionSkill").each(function(index) {
		var p = parseInt($(this).find("div.passive").html());
		if (p > 0) {
			treeColor = adjust(rgb2hex($(this).find('h2').css('color')), 35);
			descriptions += "<div class='skillText'>" + $(this).children("div.description").html().replace("<h2>","<strong style='color: " + treeColor + "'>").replace("</h2>", " " + p + ":</strong><div class='descriptionText'>") + "</div></div>";
		}
	});
	
	//End passive skill functions
	$("div.skill").each(function(index) {
		var p = parseInt($(this).attr("data-points"));
		if (p > 0) {
			treeColor = adjust(rgb2hex($(this).find('h2').css('color')), 35);
			descriptions += "<div class='skillText'>" + $(this).children("div.description").html().replace("<h2>","<strong style='color: " + treeColor + "'>").replace("</h2>", " " + p + ":</strong><div class='descriptionText'>") + "</div></div>";
		}
	});
	$("div.descriptionContainer").html(descriptions);
	var url = window.location.href.split("#")[0] + "#" + getHash();
	$("a.permalink").attr("href",url);
	window.location.replace(url);
}

//Function to convert hex format to a rgb color
function rgb2hex(orig){
 var rgb = orig.replace(/\s/g,'').match(/^rgba?\((\d+),(\d+),(\d+)/i);
 return (rgb && rgb.length === 4) ? "#" +
  ("0" + parseInt(rgb[1],10).toString(16)).slice(-2) +
  ("0" + parseInt(rgb[2],10).toString(16)).slice(-2) +
  ("0" + parseInt(rgb[3],10).toString(16)).slice(-2) : orig;
}

//Lightens colors
function adjust(color, amount) {
    return '#' + color.replace(/^#/, '').replace(/../g, color => ('0'+Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
}

function loadHash(hash) {
	var h = hash.replace("#","");
	$("div.skill").each(function(index) {
		$(this).attr("data-points", Math.min(h.charAt(index),parseInt($(this).attr("data-max"))));
	});
	updateStats();
}

function getHash() {
	var hash = "";
	$("div.skill").each(function(index) {
		hash += $(this).attr("data-points");
	});
	return hash;
}

function changeBackground(backgroundIter) {
	let numBackgrounds = 14;
	
	let firstHalf = "background: #333 url('assets/background-";
	let secondHalf = ".jpg') no-repeat fixed center center; background-size: cover;";
	
	
	if (backgroundIter > numBackgrounds) {
		backgroundIter = 1;
	}
	
	var bgImage = firstHalf + backgroundIter + secondHalf;
	document.body.style = bgImage;
	
	backgroundIter++;
	return backgroundIter;
}

$(document).ready(function () {
	$('div.skill').mousedown(handleMousedown);
	$('div.skill').mouseup(handleMouseup);
	$("div.treewrapper").bind("contextmenu", function() { return false; });
	if (window.location.hash != "") {
		loadHash(window.location.hash);
	}

	$("div.tree").each(function(index) {
		updateTree($(this));
	});
	updateStats();
});


window.requestAnimFrame = (function(callback) {
	return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
	function(callback) {
	  window.setTimeout(callback, 1000 / 60);
	};
})();

Math.clamp = function(x, min, max) {
    return x < min ? min : (x > max ? max : x);
};

window.addEventListener('resize', function() { 
  editor.SetSize();
}, true);


window.addEventListener('load', function() {
  StartEditor();
}, true);

	
window.addEventListener('focus', function() {
});

window.addEventListener('blur', function() {
});

function isClockwise(x1,y1,x2,y2,x3,y3){
    return ((x2-x1)*(y3-y1) - (y2-y1)*(x3-x1)) > 0;
}
function isCounterClockwise(x1,y1,x2,y2,x3,y3){
    return ((x2-x1)*(y3-y1) - (y2-y1)*(x3-x1)) < 0;
}

function pointInTriangle(px, py, p0x, p0y, p1x, p1y, p2x, p2y){
	var area = (-p1y*p2x + p0y*(-p1x + p2x) + p0x*(p1y - p2y) + p1x*p2y);
	var s = (p0y*p2x - p0x*p2y + (p2y - p0y)*px + (p0x - p2x)*py) / area;
	var t = (p0x*p1y - p0y*p1x + (p0y - p1y)*px + (p1x - p0x)*py) / area; 
	return  (t > 0 && s > 0 && 1-s-t > 0);
}

var $ = function( id ) { return document.getElementById( id ); };
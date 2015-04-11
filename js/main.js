var editor = null; 
 
/*
window.onerror = function(msg, url, linenumber) {
	return true;
}
*/
function StartEditor(){ 
	editor = new Editor();
	editor.Draw();
	editor.LoadDefault();
		
	editor.canvas.addEventListener("mousemove", function(s) {
		editor.mouseX = Math.round(s.pageX - editor.ctx.canvas.offsetLeft + editor.div.scrollLeft);
		editor.mouseY = Math.round(s.pageY - editor.ctx.canvas.offsetTop + editor.div.scrollTop);
		if(editor.mouseLeft){  
		}
		else if(editor.mouseRight){  
		}
	}, false);

	editor.canvas.addEventListener("mousedown", function(e) { 
		switch (e.which) {
		case 1: 
			editor.mouseLeft = true;
			editor.LeftClick();
			break; 
		case 3:  
			editor.mouseRight = true;
			editor.RightClick();
			break;
		}
	}, false);
	
	window.addEventListener("mouseup", function(e) { 
		switch (e.which) {
		case 1: 
			editor.mouseLeft = false;			
			editor.LeftRelease();
			break; 
		case 3:  
			editor.mouseRight = false;		
			editor.RightRelease();
			break;
		}
	}, false);
	
	
	
	editor.canvas.addEventListener("mousewheel", function(f) {
		if(f.wheelDelta > 0){
			editor.scaling += f.wheelDelta/100;
			$("scaling").value = editor.scaling; 
		}else if(f.wheelDelta < 0){
			editor.scaling +=  f.wheelDelta/100;
				
			if(editor.scaling < 0.025){
				editor.scaling = 0.025;
			}
			
			$("scaling").value = editor.scaling; 
		}
		
		editor.Draw();
   }, false);

	
	
}

function Editor(){  
	//working area 
	
	this.canvas = $("EditorCanvas");
	
	this.SetSize = function(){
		this.areaW = ((window.innerWidth-5)/4*3 - 5);
		this.areaH = (window.innerHeight-5);
		
		this.centerX = Math.round(this.areaW / 2);
		this.centerY = Math.round(this.areaH / 2);
		
		this.div = $("EditorDiv");
		this.div.padding = "0px";
		this.div.style.width = this.areaW + "px";
		this.div.style.height = this.areaH + "px";
		 
		this.canvas.setAttribute("width", this.areaW);
		this.canvas.setAttribute("height",this.areaH-5);
		
		optWidth = (window.innerWidth-5)/4 ;
		this.divOpt = $("Options");
		this.divOpt.style.padding = "5px";
		this.divOpt.style.width = optWidth -10 + "px";
		this.divOpt.style.height = (window.innerHeight-5 - 8) + "px"; 
		this.divOpt.style.left = window.innerWidth - optWidth - 6 +"px" 
		
		$("output").style.width = (optWidth -25)  + "px";
		
		var helpW = window.innerWidth*3/4;
		var helpH = window.innerHeight*4/5;
		$("help").style.left = (window.innerWidth - helpW)/2 +"px" 
		$("help").style.top = (window.innerHeight - helpH)/2 +"px" 
		$("help").style.width = helpW + "px";
		$("help").style.height = helpH + "px";
		
		
		if(this.Draw) this.Draw();
	}
	this.SetSize();
	
	
	this.canvas.addEventListener('contextmenu', function (event) {
		event.preventDefault();
	});
	
	this.canvas.addEventListener("mousedown", function(e){
		if(e.which == 1){
			editor.mouseLeft = true; 
		}
		else if(e.which == 3){  
			editor.mouseRight = true; 
		}
		
	});
	
	this.ctx = this.canvas.getContext("2d");
	this.ctx.imageSmoothingEnabled = false;
	this.ctx.mozImageSmoothingEnabled = false;
	this.ctx.oImageSmoothingEnabled = false; 
	 
	this.scaling = 1;
	
	this.modes = ["move", "add", "select"];
	
	for(var i=0; i< this.modes.length; i++){
		$("tool_"+this.modes[i]).index = i;
		$("tool_"+this.modes[i]).onclick = function(){
			editor.SetMode(this.index); 
		}
	}
	
	this.selectionStart = undefined; 
	
	this.imageAlpha = 0.6;
	
	this.offsetX = 0;
	this.offsetY = 0;
	 
	this.shiftKey = 0;
	this.ctrlKey = 0;
	this.altKey = 0;
	 
	this.mouseX = 0;
	this.mouseY = 0;
	
	this.mouseXPrev = 0;
	this.mouseYPrev = 0;
	
	this.viewDragged = false;
	
	this.mouseLeft = false;
	this.mouseRight = false;
	
	this.meshClosed = true;
	
	this.mode = 0; 
	
	this.verts = [];
	this.vertsInfo = [];
	
	this.dragVertex = undefined;
	
	this.undoList = [[]]; 
	this.undoIndex = 0;
	
	
	this.resetTools = function(){
		for(var i=0; i< this.modes.length; i++){
			$("tool_"+this.modes[i]).className = "icon";
		}
	}
	
	$("tool_undo").onclick = function(){ 
		editor.Undo();
	}
	$("tool_redo").onclick = function(){ 
		editor.Redo();
	} 
	
	$("range_alpha").onchange = function(){ 
		editor.imageAlpha = this.value / 100;
		editor.Draw();
	}
	
	
	this.SetMode = function(mode){
		this.mode = mode;
		this.resetTools(); 
		$("tool_"+this.modes[mode]).className = "icon-selected";  
	}
	 
	$("output").onkeyup = function(){
		editor.ResetError();
	};
	
	this.ResetError = function(){
		$("output").style.backgroundColor="initial";
		$("loadError").innerHTML = "";
	}
	
	$("export").onclick = function(){
		editor.Export();
	};
	
	$("loadMesh").onclick = function(){
		editor.LoadMesh();
	};
	
	$("newMesh").onclick = function(){
		if(editor.verts.length > 0){
			editor.verts = [];
			editor.Draw(); 
		}
	};
	
	
	$("scaling").onkeyup = function(){
		editor.scaling = Math.clamp(this.value, 0.25, 1000); 
		$("scaling").value = editor.scaling;
		editor.Draw();
	};
	
	$("scaling+").onclick = function(){
		editor.scaling *= 2; 
		$("scaling").value = editor.scaling;
		editor.Draw();
	};
	
	
	$("scaling-").onclick = function(){
		if(editor.scaling > 0.01){
			editor.scaling /= 2;
			$("scaling").value = editor.scaling;
			editor.Draw();
		}
	};
	
	
	$("offsetX").onkeyup = function(){
		var val = $("offsetX").value.replace(/[^0-9.]/g, "");
		$("offsetX").value = val;
		editor.offsetX = parseInt(val);
		editor.Draw();
	};
	
	$("offsetY").onkeyup = function(){
		var val = $("offsetY").value.replace(/[^0-9.]/g, "");
		$("offsetY").value = val;
		editor.offsetY = parseInt(val);
		editor.Draw();
	};
	
	$("offsetCenter").onclick = function(){
		editor.offsetX = parseInt(editor.img.width/2);
		editor.offsetY = parseInt(editor.img.height/2);
		
		$("offsetX").value = editor.offsetX;
		$("offsetY").value = editor.offsetY;
		editor.Draw();
	};
	
	
	$("FunReverse").onclick = function(){
		editor.verts.reverse();
		editor.Draw();
	}
	
	$("MirrorHor").onclick = function(){
		for(var i=0; i<editor.verts.length; i++){
			var v = editor.verts[i];
			v.x = -v.x;
		}
		editor.Draw();
	}
	$("MirrorVer").onclick = function(){
		for(var i=0; i<editor.verts.length; i++){
			var v = editor.verts[i];
			v.y = -v.y;
		}
		editor.Draw();
	}
	
	 
	
	$("closeHelp").onclick = function(){
		$("help").style.display="none";
	}
	
		
	$("showHelp").onclick = function(){
		$("help").style.display="block";
	}
	
	this.Export = function(){
		this.ResetError(); 
		var vertices = [];
		for(var i=0; i< this.verts.length;i++){
			var v = this.verts[i];
			vertices.push([v.x, v.y]);
		}
		$("output").value = JSON.stringify(vertices); 
	}
	
	
	this.SetOffset = function(x, y){
		$("offsetX").value = x;
		$("offsetY").value = y;
		this.offsetX = x;
		this.offsetY = y;
	}
	
	this.LoadMesh = function(){
		this.ResetError();
		var error = false;
		try {
			var mesh = JSON.parse($("output").value);
			if(typeof mesh == "object"){ 
				//check mesh
				for(i=0;i<mesh.length; i++){
					var v = mesh[i];
					if(v.length > 2 || typeof v[0] != "number" || typeof v[1] != "number"){
						throw "invalid mesh" 
						break;
					}
				}
			}
			else throw "invalid mesh" 
			
		}
		catch(e) {
			error = true;
			$("loadError").innerHTML = "Error: invalid mesh";
			$("output").style.backgroundColor = "#a44";
		}
		
		if(!error){
			this.verts = [];
			for(var i=0; i<mesh.length; i++){
				this.verts.push({x: mesh[i][0], y: mesh[i][1]}); ;
			}
		}
		
		editor.Draw();
	}
	 
	this.LoadDefault = function(){
		var defaultOutput ="[[4,-20],[4,-24],[-2,-28],[-9,-28],[-17,-23],[-20,-17],[-20,-10],[-18,-9],[-20,1],[-17,6],[-13,8],[-2,9],[7,5],[13,3],[22,3],[24,5],[27,5],[29,2],[42,2],[43,-1],[29,-1],[26,-4],[23,-11],[19,-16],[11,-19]]";
		
		$("output").value = defaultOutput;
		this.LoadMesh();
		this.SetOffset(23,30); 
		$("output").value = "";
	}
	
	//Load image file
	var finput = $("loadFile");
	finput.onchange = function(){
		var file = this.files[0];
		var fr = new FileReader();
		fr.onload = function(){
			//this.i = new Image();
			editor.img.src = this.result;
			$("srcImg").src = this.result;
			editor.Draw();
		};
		fr.readAsDataURL(file);
	} 
	 
	  
	//Load Resources
	rh = new ResourcesHandler( function(){
		this.loaded = true; 
		editor.Draw();
	});
	  
	this.img = rh.LoadSprite("res/img.png", 1); 
	
	this.imgDot = rh.LoadSprite("res/dot.png", 1); 
	this.imgDotBegin = rh.LoadSprite("res/dotbegin.png", 1);
	this.imgDotSelect = rh.LoadSprite("res/dotselect.png", 1);
	 
	 
	 
	this.Draw = function(){ 
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.ctx.globalAlpha = this.imageAlpha;
		
		//center origin
		this.ctx.beginPath();
		this.ctx.moveTo(this.centerX-10000 +0.5, this.centerY +0.5)
		this.ctx.lineTo(this.centerX+10000 +0.5, this.centerY +0.5)
		
		
		this.ctx.moveTo(this.centerX +0.5, this.centerY-10000 +0.5)
		this.ctx.lineTo(this.centerX +0.5, this.centerY+10000 +0.5)
		this.ctx.stroke();
		
		this.ctx.save();
		this.ctx.translate(this.centerX, this.centerY);
		this.ctx.scale(this.scaling, this.scaling);
		this.ctx.drawImage(this.img, - this.offsetX,  - this.offsetY);
		this.ctx.restore();
		
		this.ctx.globalAlpha = 1;
		
		
		var len = this.verts.length;
		
		if(len > 0){
			this.ctx.save();
			this.ctx.translate(this.centerX, this.centerY);
			this.ctx.beginPath();
			var v = this.verts[0];
			this.ctx.moveTo(v.x * this.scaling, v.y * this.scaling);
			this.ctx.lineTo(v.x * this.scaling, v.y * this.scaling);
			this.ctx.drawImage(v.selected?this.imgDotSelect:this.imgDotBegin, v.x * this.scaling  - 4,  v.y * this.scaling - 4);
			for(var i=1; i<len; i++){
				var v = this.verts[i];
				this.ctx.lineTo(v.x * this.scaling, v.y * this.scaling);
				this.ctx.drawImage(v.selected?this.imgDotSelect:this.imgDot, v.x * this.scaling  - 4,  v.y * this.scaling - 4);					
			}
			if(this.meshClosed)this.ctx.closePath();
			this.ctx.stroke();
			this.ctx.restore();
		}
		
		
		if(this.selectionStart)
		{
			this.ctx.globalAlpha = 0.5; 
			var xmin = Math.min(this.selectionStart.x, this.mouseX),
			ymin = Math.min(this.selectionStart.y, this.mouseY),
			xmax = Math.max(this.selectionStart.x, this.mouseX),
			ymax = Math.max(this.selectionStart.y, this.mouseY);
			this.ctx.fillRect(
				xmin,
				ymin,
				xmax-xmin,
				ymax-ymin
			); 
			this.ctx.globalAlpha = 1;
			
		}
		
		if(len >3){
			var v1 = this.verts[0];
			var v2 = this.verts[1];
			var v3 = this.verts[2];
			var v4 = this.verts[3];
			 //console.log(pointInTriangle(v4.x, v4.y, v1.x, v1.y, v2.x, v2.y, v3.x, v3.y));
		}
		
	}
	 
	this.Drag = function(vIndex){
		this.dragVertex = vIndex; 
		var v = this.verts[vIndex];
		v.selected = true;
		var len = this.verts.length; 
		for(var i=0; i<len; i++){
			var vert = this.verts[i];
			if(vert.selected){
				vert.distX = vert.x - v.x;
				vert.distY = vert.y - v.y; 
				
			}
		}
		window.requestAnimFrame( function(){
			editor.Update();
		});
	}
	
	this.StartSelection = function(){ 
		window.requestAnimFrame( function(){ 
			editor.Update();
		});
	}
	
	
	this.DragView = function(v){
		this.viewDragged = true;
		this.mouseXPrev = this.mouseX;
		this.mouseYPrev = this.mouseY;
		
		window.requestAnimFrame( function(){
			editor.Update();
		});
	}
	
	this.LeftClick = function(){ 
		switch(this.mode){
			case 0: //move
				var v = this.GetNearestVert();
				if(v !== null){ 
					if(!this.verts[v].selected && !this.shiftKey )
						this.DeselectVertices();
					this.Drag(v);
				}else{
					this.DragView();
				}
				break;
			
			case 1: //add
				var v = this.GetNearestVert();
				if(v !== null){
					if(!this.shiftKey)
						this.DeselectVertices();
					this.Drag(v);
				}else{
					var index =  this.GetNearestSegment(20)
					if(index != null){
						var v = {
							x: Math.round((this.mouseX - this.centerX) / this.scaling),
							y: Math.round((this.mouseY - this.centerY )  / this.scaling),
							grabX: 0,
							grabY: 0
						};
						 
						//array insert 
						this.verts.splice(index+1, 0, v);
						if(!this.shiftKey)
							this.DeselectVertices();
						v.selected = true;
						this.Drag(index+1); 
					}else{
						var v = {
							x:Math.round((this.mouseX - this.centerX) / this.scaling),
							y:Math.round((this.mouseY - this.centerY )  / this.scaling),
							grabX: 0,
							grabY: 0
						};
						this.verts.push(v);
						this.Drag(this.verts.length-1);
						if(!this.shiftKey)
							this.DeselectVertices();
						v.selected = true;
					}
				}
				break;
				
			case 2: //select
				this.selectionStart = {x:this.mouseX, y:this.mouseY};
				this.StartSelection();
			
				break;
			 
			
			
		}
		this.Draw();
	}
	
	this.LeftRelease = function(){
		if(this.dragVertex != undefined) 
				this.AddUndo();
		this.dragVertex = undefined;
		this.viewDragged = false;
		 
		if(this.selectionStart){ 
			if(!this.shiftKey)
				this.DeselectVertices();
			
			var xmin = Math.min(this.selectionStart.x, this.mouseX),
			ymin = Math.min(this.selectionStart.y, this.mouseY),
			xmax = Math.max(this.selectionStart.x, this.mouseX),
			ymax = Math.max(this.selectionStart.y, this.mouseY);
			this.SelectVertices(xmin, ymin, xmax, ymax);
			
			this.selectionStart = undefined;
			this.SetMode(0);
			this.Draw();
		}
	}
	
	this.SelectVertices = function(x1, y1, x2, y2){
		var len = this.verts.length;
		for(var i=0; i<len; i++){
			var v = this.verts[i];
			var vx = v.x*this.scaling + this.centerX
			var vy = v.y*this.scaling + this.centerY; 
			if(vx > x1 && vy > y1 && vx < x2 && vy < y2){
				v.selected = true; 
			}
		} 
	}
	
	this.DeselectVertices = function(){
		var len = this.verts.length;
		for(var i=0; i<len; i++){
			this.verts[i].selected = false;
		}
		
	}
	
	this.RightRelease = function(){
		if(this.dragVertex != undefined) 
				this.AddUndo();
		this.dragVertex = undefined;
		this.viewDragged = false;
	}
	
	this.RightClick  = function(){
		switch(this.mode){
			case 0: 
				break;
			
			case 1: //delete 
				var v = this.GetNearestVert();
				if(v !== null){
					this.verts.splice(v, 1);
					this.AddUndo();
				}else{
					this.DragView();
				}
				break;
				 
			
		}
		this.Draw();
	}
	
	this.Update = function(){
		if(this.dragVertex != undefined)
		{
			var v = this.verts[this.dragVertex];
			v.x = Math.round((this.mouseX - this.centerX  - v.grabX) / this.scaling);
			v.y = Math.round((this.mouseY - this.centerY - v.grabY) / this.scaling);
			
			var len = this.verts.length;
			for(var i=0; i<len; i++){
				var vert = this.verts[i];
				if(vert.selected){ 
					vert.x = v.x + vert.distX;
					vert.y = v.y + vert.distY;
				}
			}
		
			this.Draw();
			window.requestAnimFrame( function(){
				editor.Update();
			});
		}
		
		if(this.viewDragged)
		{
			this.centerX += this.mouseX - this.mouseXPrev;
			this.centerY += this.mouseY - this.mouseYPrev;
			this.mouseXPrev = this.mouseX;
			this.mouseYPrev = this.mouseY;
			this.Draw(); 
			 
			window.requestAnimFrame( function(){
				editor.Update();
			});
		}
		
		if(this.selectionStart)
		{  
			this.Draw();
			window.requestAnimFrame( function(){
				editor.Update();
			}); 
		}
	}
	
	 
	
	
	this.GetNearestVert = function(){ 
		for(var i=0; i<this.verts.length; i++){
			var v = this.verts[i];
			var vx = v.x*this.scaling + this.centerX;
			var vy = v.y*this.scaling + this.centerY;
			if(distance(vx, vy, this.mouseX, this.mouseY) < 6){
				v.grabX = this.mouseX - vx;
				v.grabY = this.mouseY - vy;
				return i;
			}
		}
		return null;
	}
	
	this.GetNearestSegment = function(maxDist){
		var len = this.verts.length;
		
		if(len < 2)
			return null;
			
		var segment = null;
		var minDist = Infinity;
		for(var i=0; i<len-1; i++){
			var v0 = this.verts[i];
			var v1 = this.verts[i+1];
			var segdist = segmentDistance(
				v0.x*this.scaling+this.centerX, v0.y*this.scaling+this.centerY,
				v1.x*this.scaling+this.centerX, v1.y*this.scaling+this.centerY,
				this.mouseX,
				this.mouseY);
			if(segdist < minDist && segdist < maxDist){
				segment = i;
				minDist = segdist;
			}
		}
		return segment;
	
	}
	
	this.ResetEditor = function(){
	}

	this.Undo = function(){ 
	
		if(this.undoIndex > 0){
			this.undoIndex--;
			this.verts = this.undoList[this.undoIndex].slice();
		} 
		
		this.Draw(); 
	}
	
	this.Redo = function(){
		if(this.undoIndex < this.undoList.length-1){
			this.undoIndex++;
			this.verts = this.undoList[this.undoIndex].slice();
			this.Draw();
		}
		
	}
	
	this.AddUndo = function(){
		this.undoList.splice(this.undoIndex+1, this.undoList.length);
		this.undoList.push(this.verts.slice());
		
		this.undoIndex = this.undoList.length-1;
	}
	
	
	
}
  
window.addEventListener("keyup", function(e) {
	editor.shiftKey = e.shiftKey;
	editor.ctrlKey = e.ctrlKey;
	editor.altKey = e.altKey; 
}, false);
 
window.addEventListener("keydown", function(e) {
	
	editor.shiftKey = e.shiftKey;
	editor.ctrlKey = e.ctrlKey;
	editor.altKey = e.altKey; 
	switch(e.keyCode){
		case 49: //move
			editor.SetMode(0);
			break;
			
		case 50: //add
			editor.SetMode(1);
			break;	
			
		case 51: //select
			editor.SetMode(3);
			break;	
		
		case 90: //Z
			if(e.ctrlKey)
				if(e.shiftKey)
					editor.Redo();
				else
					editor.Undo();
			break;
			
			
		case 89: //Y
			if(e.ctrlKey)
				editor.Redo();
			break;
		 
	}
}, false);


const TO_DEG = 180 / Math.PI;
const TO_RAD = Math.PI / 180;
const PI2 = Math.PI / 2;

function distance(x1, y1, x2, y2){ 
	return Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1));
}

function directionDeg(x1, y1, x2, y2) {
   return (Math.atan2(y1 - y2, x2 - x1) * TO_DEG + 360 ) % 360;
}

function direction(x1, y1, x2, y2) {
   return Math.atan2(y1 - y2, x2 - x1);
}


function rectDistance(x1, y1, x2, y2, xp, yp){
	var dist = Math.sqrt((y2-y1)*(y2-y1) + (x1-x2)*(x1-x2));  
	return Math.abs(((y2-y1)*(x1-xp) + (x1-x2)*(y1-yp)) / dist);
}

function rectSign(x1, y1, x2, y2, xp, yp){   
	var val = (y2-y1)*(x1-xp) + (x1-x2)*(y1-yp);
	if(val > 0) return 1;
	else if(val < 0) return -1;
	return 0;
}
 
function segmentDistance(x1, y1, x2, y2, xp, yp){
	
	var dir = Math.atan2(y1 - y2, x2 - x1);
	var cos1 = Math.cos(dir + PI2);
	var sin1 = -Math.sin(dir + PI2);
	var cos2 = Math.cos(dir - PI2);
	var sin2 = -Math.sin(dir - PI2);
	
	//parallel rects
	var sign1 = rectSign(x1+cos1, y1+sin1, x1+cos2, y1+sin2, xp, yp);
	var sign2 = rectSign(x2+cos1, y2+sin1, x2+cos2, y2+sin2, xp, yp);
	
	//if point is beetween 2 rects
	if(sign1 != sign2)
		return rectDistance(x1, y1, x2, y2, xp, yp);
		
	return Infinity;
}






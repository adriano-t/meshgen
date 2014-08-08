var editor = null; 
 
/*
window.onerror = function(msg, url, linenumber) {
	return true;
}
*/
function StartEditor(){ 
	editor = new Editor();
	editor.Draw();
	
		
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
		
		this.centerX = this.areaW / 2;
		this.centerY = this.areaH / 2;
		
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
	 
	this.scaling = 1;
	
	this.imageAlpha = 0.6;
	
	this.offsetX = 0;
	this.offsetY = 0;
	 
	this.mouseX = 0;
	this.mouseY = 0;
	
	this.mouseXPrev = 0;
	this.mouseYPrev = 0;
	
	this.viewDragged = false;
	
	this.mouseLeft = false;
	this.mouseRight = false;
	
	this.meshClosed = false;
	
	this.mode = 0; 
	
	this.verts = [];
	
	this.dragVertex = undefined;
	
	this.undoList = [[]]; 
	this.undoIndex = 0;
	
	
	this.resetTools = function(){
		$("tool_move").className = "icon";
		$("tool_add").className = "icon"; 
	}
	
	$("tool_undo").onclick = function(){ 
		editor.Undo();
	}
	$("tool_redo").onclick = function(){ 
		editor.Redo();
		
	}
	$("tool_move").onclick = function(){ 
		editor.SetMode(0); 
	}
	$("tool_add").onclick = function(){ 
		editor.SetMode(1); 
	} 
	
	$("range_alpha").onchange = function(){ 
		editor.imageAlpha = this.value / 100;
		editor.Draw();
	}
	
	
	this.SetMode = function(mode){
		this.mode = mode;
		editor.resetTools();
		switch(mode){
			case 0:
				$("tool_move").className = "icon-selected";
				break;
			
			case 1:
				$("tool_add").className = "icon-selected";
				break;
			 
		}
		 
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
	
	$("closed").onchange = function(){
		editor.meshClosed = $("closed").checked;
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
		var mesh = this.verts.slice();
		if(this.meshClosed)
			mesh.push(this.verts[0]);
		$("output").value = JSON.stringify(mesh);
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

			this.verts = mesh;
		}
		
		editor.Draw();
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
	  
	this.img = rh.LoadSprite("res/img.png", 1, function(){
		editor.offsetX = parseInt(editor.img.width/2);
		editor.offsetY = parseInt(editor.img.height/2);
		
		$("offsetX").value = editor.offsetX;
		$("offsetY").value = editor.offsetY;
	}); 
	
	this.imgDot = rh.LoadSprite("res/dot.png", 1); 
	this.imgDotBegin = rh.LoadSprite("res/dotbegin.png", 1); 
	this.imgDotEnd = rh.LoadSprite("res/dotend.png", 1); 
	 
	 
	 
	 
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
			this.ctx.moveTo(v[0] * this.scaling, v[1] * this.scaling);
			this.ctx.lineTo(v[0] * this.scaling, v[1] * this.scaling);
			this.ctx.drawImage(this.imgDotBegin, v[0] * this.scaling  - 4,  v[1] * this.scaling - 4);
			for(var i=1; i<len; i++){
				var v = this.verts[i];
				this.ctx.lineTo(v[0] * this.scaling, v[1] * this.scaling);
				this.ctx.drawImage(this.imgDot, v[0] * this.scaling  - 4,  v[1] * this.scaling - 4);					
			}
			if(this.meshClosed)this.ctx.closePath();
			this.ctx.stroke();
			this.ctx.restore();
		}
		
	}
	 
	this.Drag = function(v){
		this.dragVertex = v;
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
					this.Drag(v);
				}else{
					this.DragView();
				}
				break;
			
			case 1: //add
				var v = this.GetNearestVert();
				if(v !== null){
					this.Drag(v);
				}else{
					var index =  this.GetNearestSegment(20)
					if(index != null){
						var v = [(this.mouseX - this.centerX) / this.scaling, (this.mouseY - this.centerY )  / this.scaling];
						
						console.log(this.verts);
						//array insert 
						this.verts.splice(index+1, 0, v);
						
						this.Drag(index+1); 
					}else{
						var v = [(this.mouseX - this.centerX) / this.scaling, (this.mouseY - this.centerY )  / this.scaling];
						this.Drag(this.verts.length);
						this.verts.push(v);
					}
				}
				break;
			 
			
			
		}
		this.Draw();
	}
	
	this.LeftRelease = function(){
		if(this.dragVertex != undefined) 
				this.AddUndo();
		this.dragVertex = undefined;
		this.viewDragged = false;
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
		if(this.dragVertex != undefined){
			var v = this.verts[this.dragVertex];
			v[0] = parseInt((this.mouseX - this.centerX) / this.scaling);
			v[1] = parseInt((this.mouseY - this.centerY) / this.scaling);
			this.Draw();
			window.requestAnimFrame( function(){
				editor.Update();
			});
		}
		
		if(this.viewDragged){
			this.centerX += this.mouseX - this.mouseXPrev;
			this.centerY += this.mouseY - this.mouseYPrev;
			this.mouseXPrev = this.mouseX;
			this.mouseYPrev = this.mouseY;
			this.Draw(); 
			 
			window.requestAnimFrame( function(){
				editor.Update();
			});
		}
	}
	
	 
	
	
	this.GetNearestVert = function(){
		for(var i=0; i<this.verts.length; i++){
			var v = this.verts[i];
			if(distance(v[0]*this.scaling + this.centerX, v[1]*this.scaling + this.centerY, this.mouseX, this.mouseY) < 6){
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
				v0[0]*this.scaling+this.centerX, v0[1]*this.scaling+this.centerY,
				v1[0]*this.scaling+this.centerX, v1[1]*this.scaling+this.centerY,
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
  
 
window.addEventListener("keydown", function(e) { 
	switch(e.keyCode){
		case 49: //1
			editor.SetMode(0);
			break;
			
		case 50: //2
			editor.SetMode(1);
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






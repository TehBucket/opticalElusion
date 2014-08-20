/*
game for js13k 2014 http://js13kgames.com/
by Teh_Bucket
*/

/*TODO
MAKE TRAILS DO STUFF
	--IDEAS:
		-solid colours just detriment enemies, like earth-yellow slows, water-blue slips them
		-(artao) Only colours can kill enemies, enemies are colour coded for destruction
		- Mix idea: colour coded shields on certain enemies, (akin to guacamelee)
	
graphics: player vectors (improve) (VISIBILITY - need testers)

keys: ask around, what keys are best for 4 element switching (mouse?)
graphics: particles coming out of solid element background blocks?

Colorblind players??

Difficulty: progress bar
			new enemy: doesn't move much, shoots projectiles at player
			IMPROVE new level generation system
			Boss levels
BUGS:
*/

var C = document.getElementById('game');
var G = C.getContext('2d'); //displays game itself
var hud = document.getElementById('hud');
var HUD = hud.getContext('2d'); //displays health, current level's score
var HUD2 = document.getElementById('hud2').getContext('2d'); //displays levels progression
var B = document.getElementsByTagName('body')[0];
var ran /*random int*/= function(n,x){return Math.floor(Math.random()*(x - n + 1) + n)}
var flip /*random bool*/= function(){return (ran(0,1)==0 ? true : false)}
var col /*colission, 2 objects*/= function(a,b){with(a){
	if(x + w/2 > b.x - b.w/2 && x - w/2 < b.x + b.w/2 && y + h/2 > b.y - b.h/2 && y - h/2 < b.y + b.h/2){return true}
	else{return false}
}}
var mix /*mixing colours*/= function(c,cc,n){ //adds n amount of cc to c (n is a percent, .25 or 1) (only additive or whatever its called)
	return {r:c.r + Math.floor(cc.r*n),g:c.g + Math.floor(cc.g*n),b:c.b + Math.floor(cc.b*n)};
}
var oppo /*returns colour-theory opposite*/= function(c){ //errrr i have no clue :P
	return {r:c.g,g:c.r,b:c.r+c.g/2}
}
var loopA = function(r){
		while(r>=360){r-=360} //loops the number to stay in range
		while(r<0){r+=360}
		return r;
}
var tri /*draws poly, rotated*/= function(x,y,s,a,c){
	var r = toAngle(x,y,a.x,a.y);
	// var v = (Math.abs(xv)+Math.abs(yv))/2
	// if(v<1){v=1}
	G.beginPath();
	G.moveTo(x+a.x*s,y+a.y*s);
	G.lineTo(x+a.y*s,y);
	// G.lineTo(x-a.x*s/v,y-a.y*s/v); // velocity thing, probly won't use ever
	G.lineTo(x,y+a.x*s);
	// G.lineTo(x+fromAngle(loopA(r-15)).x*s/2,y);
	// G.lineTo(x,y);
	// G.lineTo(x,y+fromAngle(loopA(r+15)).y*s/2);
	G.closePath();
	// console.log(fromAngle(loopA(r+15)).y);
	G.fillStyle=rgb(c);
	G.fill();
}

//classes and globals and stuff
var co /*colors*/= {r3:{r:188,g:73,b:58},y3:{r:188,g:135,b:58},b3:{r:44,g:84,b:122},g3:{r:43,g:141,b:69},w:{r:255,g:255,b:255},b:{r:25,g:25,b:25},en:{r:225,g:225,b:225},}
var p /*player*/= {x:300,y:250,el:co.r3,w:30,h:30,c:mix(co.r3,co.w,-.5),hp:8,st:0,r:0,s:15,sd:.1};
var en /*enemies*/= [];
var enN /*new enemy (constructor)*/= function(){ //random placement at edge of screen
	this.type = lvl.spawn[ran(0,lvl.spawn.length-1)];//chooses type from level spawn settings
	var Can = C.getBoundingClientRect();
	if(flip()){
		this.x = ran(0,Can.width)-20;
		flip() ? this.y = 0 : this.y = Can.height-20;
	}
	else{
		this.y = ran(0,Can.height)-20;
		flip() ? this.x = 0 : this.x = Can.width-20;
	}
	this.r = ran(0,359);
	this.xv =0; //velocity
	this.yv =0;
	this.w =40; //width and height for colission mainly (i should .proto this)
	this.h =40;
	this.c = {r:225,g:225,b:225};
	this.hp = 10; //health (when at 0, freezes)
	this.acc = 1; //acceleration (affected by colour)
	this.fric = 1; //friction (affected by colour)
	this.tim = 0; //timer, for blinking
};
var lvl /*current level, difficulty and theme*/= {c:{r:0,g:0,b:0},n:0/*which level, increments*/,spawn:['s']/*spawn rate of enemies, fast, slow, ranged*/,score:0,goal:30,tim:0,pause:0};
// colors: http://paletton.com/#uid=7050G0km8nBiOrDkyprnAlypujm (r1 is lightest red, r5 is darkest red. rgb is 0-255)
var bg = [/*[{r,g,b}]*/]; //blocks of background that change colour dynamically (generated)
var particles = []; //triangles that have velocitiy, and dissapate

var newP = function(x,y,xv,yv,c){ //new particle, constructor
	this.x=x+ran(-15,15);
	this.y=y+ran(-15,15);
	this.xv=xv+ran(-1,1);
	if(xv==0){xv+=.1}
	this.yv=xv+ran(-1,1);
	this.r=ran(0,359);
	this.c=c[ran(0,c.length-1)];
	this.c.a=2;
	
	this.size=ran(3,20);
	// this.spin=ran(-2,2);
}

var fromAngle /*converts degree to x/y direction*/= function(r){return {x:Math.sin((Math.PI/180)*r),y:Math.cos((Math.PI/180)*r)}}
var toAngle /*converts x/y line into degree from point*/= function(x,y,xx,yy){
if(xx < x && yy >= y){return (180/Math.PI) * (Math.atan(Math.abs(yy-y)/Math.abs(xx-x)))+270} //bottom left quadrant
if(yy < y && xx >= x){return (180/Math.PI) * (Math.atan(Math.abs(yy-y)/Math.abs(xx-x)))+90} //top right quadrant
else if(yy < y && xx < x){return (180/Math.PI) * (Math.atan(Math.abs(xx-x)/Math.abs(yy-y)))+180} //top left quadrant
else{return (180/Math.PI) * (Math.atan(Math.abs(xx-x)/Math.abs(yy-y)))} //bottom right quadrant
}
var rgb = function(c){with(c){
	if(typeof a ==='undefined'){return 'rgb('+r+','+g+','+b+')'}
	else{return 'rgba('+r+','+g+','+b+','+a+')'}
}}

// player takes n hits, st (invulnerability timer) goes up, s (size) goes tiny
var hit = function(n){
	if(!p.st){ //if not invulnerable
		p.s = .1;
		p.hp -= n;
		p.st += 200;
		if(p.hp<=0){ //resets scene upon player death, but keeps level
			en = [];
			particles = [];
			lvl.score = 0;
			p.hp = 8;
			resetBG();
		}
	}
}

//generates background to defaults
var generateBG = function(){
	for (var i = 0; i < 12; i++) {
		bg.push([]);
		for (var ii = 0; ii < 16; ii++) {
			bg[bg.length - 1].push(new function () { //constructor for background box
				this.c = {r:i + ii, g:i + ii, b:i + ii};
				this.x = ii * 50;
				this.y = i * 50;
				this.w = 50;
				this.h = 50;
			})
		}
	}
}

var resetBG = function(){
	for (var i = 0; i < 12; i++) {
		for (var ii = 0; ii < 16; ii++) {
			bg[i][ii].c = {r:i + ii, g:i + ii, b:i + ii};
		}
	}
}

//fancy boxey dynamic background
var background = function(){
	var tmp = [];
	for(var i=0;i<12;i++){//rows
		for(var ii=0;ii<16;ii++){with(bg[i][ii]){
			G.fillStyle = rgb(c);
			G.fillRect(x,y,w,h);
			if(x>p.x-w&&x<p.x+w&&y>p.y-h&&y<p.y+h){ //if player in/by square
				// p.c.r=255-c.r; //set player colour to opposite of background (old)
				// p.c.g=255-c.g;
				// p.c.b=255-c.b;
				// p.c.r=255-(c.r+c.g+c.b)/3; //set player colour to greyscale opposite background
				// p.c.g=255-(c.r+c.g+c.b)/3;
				// p.c.b=255-(c.r+c.g+c.b)/3;
				// p.c = oppo(c); //set player to visual opposite of background (broken)
				// if(c.r<=500){c.r += 5}; //testification
				if((c.r+c.b+c.g)/3<=500){c=mix(c,p.el,.05)}; //increment colour based on player
			}
			// else if((c.r+c.b+c.g)/3>=i+ii){c=mix(c,co.w,-1/255)} //slowly blackens (broken)
			// else if(c.r<=i+ii){c.r = i+ii} //r,g and b bottom out (broken)
			// else if(c.g<=i+ii){c.g = i+ii}
			// else if(c.b<=i+ii){c.b = i+ii}
			if(c.r>=255||c.b>=255||c.g>=255){//if bg-box is a full colour (has effect)
				for(var i3=0;i3<en.length;i3++){//collide with enemy
					if(col(en[i3],{x:x,y:y,w:w,h:h})){
						if(en[i3].hp>0){en[i3].c = c;} //colours enemy, needs help (blink?)
						if(c.r>=255&&c.b>=255&&c.g>=255){//if WHITE
							if(en[i3].hp > 0){
							// tmp.push(i3); //kills enemy
							en[i3].c = co.b;
							en[i3].hp = 0;
							en[i3].acc = 0;
							en[i3].fric = .98;
							console.log('hit enemy with white');
							for(var i4=0;i4<ran(16,22);i4++){particles.push(new newP(en[i3].x,en[i3].y,ran(-1,1),ran(-1,1),[{r:c.r,g:c.g,b:c.b}]))}
							en.push(new enN);
							}
						}
						else if(c.r>=255 && c.g <255 && c.b <255 && en[i3].tim==0){//if RED
							en[i3].hp -= 1; //damages enemy
							console.log('hit enemy with red');
						}
						else if(c.g>=255 && c.r <255 && c.b <255 && en[i3].tim==0){//if GREEN
							if(en[i3].fric>0){en[i3].fric -= .01;} //slows enemy (friction)
							console.log('hit enemy with green');
						}
						else if(c.b>=255 && c.g <255 && c.r <255 && en[i3].tim==0){//if BLUE
							// if(en[i3].acc>0){en[i3].acc -=.05;} //slows enemy (acceleration)
							en[i3].xv /=3 //slows enemy (current velocity)
							en[i3].yv /=3 //slows enemy (current velocity)
							console.log('hit enemy with blue');
						}
						
						// if(!ran(0,145)){particles.push(new newP(en[i3].x,en[i3].y,0,0,[{r:c.r,g:c.g,b:c.b}]))}
					}
				}

			}
			
			c.r<=i+ii ? c.r = i+ii : c.r -= 1; //r,g and b bottom out
			c.g<=i+ii ? c.g = i+ii : c.g -= 1;
			c.b<=i+ii ? c.b = i+ii : c.b -= 1;
		}}
	}
	return tmp;
}

//moves the player, and if by sides of screen, it scrolls scene
var pMove = function(x,y){
	var Can = C.getBoundingClientRect();
	p.x = x;
	p.y = y;
	//keep within bounds of screen, TODO: scrolling scene
	if(p.x > Can.width-15-2){p.x=Can.width-15-2}
	else if(p.x < 0+15+2){p.x=0+15+2}
	if(p.y > Can.height-15-2){p.y=Can.height-15-2}
	else if(p.y < 0+15+2){p.y=0+15+2}
}

//moves, renders, and removes old particles
var moveParticles = function(){
	var tmp = [];
	for(var i=particles.length-1;i>-1;i--){with(particles[i]){
		x+=xv;
		y+=yv;
		tri(x,y,size,fromAngle(r),c);
		// r += loopA(r+spin); // no spin, looks ok without
		c.a -= .01; //fade out
		if(c.a <= 0){tmp.push(i)}
	}}
	// console.log(tmp.length);
	for(var i=tmp.length-1;i>-1;i-=1){particles.splice(tmp[i],1)}//removes dead particles
}

var newLvl = function(){with(lvl){
	n++;
	score = 0;
	if(n==1){spawn=['f']}//set spawns for level 2
	else{ //generated spawn stuff, should improve to be smarter
		for(var i=0;i<ran(0,n/2);i++){spawn.push('s')}
		for(var i=0;i<ran(0,n);i++){spawn.push('f')}
		// if(n>5){for(var i=0;i<ran(0,n);i++){spawn.push('r')}} // No ranged enemies, don't exist yet
	}
	goal = 20 + n*5; //should definitely make better algorithm
	HUD2.fillStyle = 'white';
	HUD2.fillRect(0,600-n*5+1,50,3); //draws cross-level progress (how many levels completed)
	if(n==120){HUD2.fillRect(0,0,50,600);console.log('yes you just won')}//complete all levels, but keep playing
	return n;
}}

var explode = function(a){with(a){ //creates particles from given object
	for(var i=0;i<ran(6,12);i++){particles.push(new newP(x,y,yv*2,xv*2,[{r:225,g:225,b:225},{r:25,g:25,b:25},{r:172,g:60,b:45}]))}
}}

//moves, draws enemies (ai) ENEMY MOVE
var enMove = function(){
	for(var i=0;i<en.length;i++){with(en[i]){
	if(hp == 0){c = co.b} //necessary? (red)
	c == co.en || tim >= 100 ? tim = 0 : tim+=1;
	if(tim<50 && c!=co.en && hp>0){c=co.en} //flashes back to white except when dead
	var a = fromAngle(r) //x,y coords of direction enemy is facing
	//turn towards player
	var point = toAngle(x,y,p.x,p.y); //what angle would be looking directly at player
	if(type=='s'){
		if(point - 5 <= r && point + 5 >= r && hp > 0){ // is enemy pointing directly at player (give or take some)
				xv += (a.x/10)*acc; //add velocity in direction of player
				yv += (a.y/10)*acc;
			}
		else if(hp>0){//turn towards player
			r - point < 0 ? r += 1 : r -= 1;
			r = loopA(r);
			}
		//draw Slow enemy (vector)
		tri(x,y,45,fromAngle(point),{r:106,g:213,b:134,a:.2});//ghost pointer (green)
		// c={r:255,g:142,b:127}
		// tri(x,y,-40,{x:a.x/2,y:a.y/2},c);
		tri(x,y,40,a,c);
		tri(x,y,35,a,co.b);
		tri(x,y,30,a,c);
		tri(x,y,25,a,{r:172,g:60,b:45});
		tri(x,y,20,a,co.en);
	}
	else if(type=='f'){//fast ones
		if(hp>0){
			r = point;
			xv += a.x/10;
			yv += a.y/10;
		}
		//draw Fast enemy (vector)
		tri(x,y,50,a,{r:255,g:213,b:134,a:.2});//ghost pointer (green)
		tri(x,y,40,a,c);
		tri(x,y,30,a,co.b);
		tri(x,y,25,a,{r:125,g:125,b:125});
		tri(x,y,20,a,co.b);
		tri(x,y,10,a,co.en);
		tri(x,y,20,fromAngle(loopA(r-180)),{r:255,g:213,b:134,a:.2});//meh, flaggy thing, helps distinguish fast ones
	}
	x += xv; //move based on velocity
	y += yv;
	xv *= .99*fric; //friction
	yv *= .99*fric;
	// if(a.x == 0 && p.x >= x - 40 && p.x <= x + 40){ y += 1 }
	
	//draw enemies (DEBUG boxes)
		// G.fillStyle = c;
		// G.fillRect(x-20,y-20,40,40);
		// G.beginPath();
		// G.strokeStyle = 'rgb(223,49,10)';
		// G.moveTo(x,y);
		// G.lineTo(x + a.x*30, y + a.y*30);
		// G.lineWidth=3;
		// G.stroke();
		// if((Math.abs(xv)+Math.abs(yv))/2>2){particles.push(new newP(x,y,-yv,-xv,[{r:188,g:73,b:58}]))} //draws fire coming out of fast moving enemies

	}}
}
//draws and a few other things, the Player
var drawP = function(){with(p){
	r = loopA(r+1);// rotates visual elements
	s += sd; //s = size, affects elements visually, "breathes" between 10 and 20, spikes downwards when injured
	if(s<=10){s += .05;sd = .05}
	else if(s>=20){s-= .05;sd = -.05} 
	// console.log(s);
	G.fillStyle = rgb({r:c.r,g:c.g,b:c.b,a:.8}); //debug box colour (transparent)
	// G.fillRect(x-15,y-15,30,30); //debug box
	G.beginPath();
	G.arc(x, y, s, 0, s/5 * Math.PI, false); //sphere
	G.fill();
	G.fillStyle = rgb(co.w);
	G.beginPath();
	G.arc(x, y, s*11/15, 0, s/5 * Math.PI, false); //inner sphere
	G.fill();
	s-= 5;
	tri(x,y,s,fromAngle(r),p.el);
	tri(x,y,s,fromAngle(loopA(r+90)),p.el);
	// tri(x+fromAngle(r).x*15,y+fromAngle(r).y*15,10,fromAngle(loopA(r+90)),co.r3);//spray of things
	// tri(x+fromAngle(r).x*15,y+fromAngle(r).y*15,10,fromAngle(loopA(r+60)),mix(co.r3,co.w,.1));
	// tri(x+fromAngle(r).x*15,y+fromAngle(r).y*15,10,fromAngle(loopA(r+30)),mix(co.r3,co.w,.3));
	// tri(x+fromAngle(r).x*15,y+fromAngle(r).y*15,10,fromAngle(loopA(r)),mix(co.r3,co.w,.6));
	// tri(x+fromAngle(r).x*15,y+fromAngle(r).y*15,10,fromAngle(loopA(r+180)),co.g3);//spray of things
	// tri(x+fromAngle(r).x*15,y+fromAngle(r).y*15,10,fromAngle(loopA(r+160)),mix(co.g3,co.w,.1));
	// tri(x+fromAngle(r).x*15,y+fromAngle(r).y*15,10,fromAngle(loopA(r+130)),mix(co.g3,co.w,.3));
	// tri(x+fromAngle(r).x*15,y+fromAngle(r).y*15,10,fromAngle(loopA(r+100)),mix(co.g3,co.w,.6));
	
	// tri(x+fromAngle(loopA(r+330)).x*s,y+fromAngle(r).y*s,s*25/15,fromAngle(loopA(r+330)),co.r3); //vector player stuff
	// tri(x+fromAngle(loopA(r+330)).x*s,y+fromAngle(r).y*s,s,fromAngle(loopA(r+330)),mix(co.r3,co.w,s/45));
	// tri(x+fromAngle(loopA(r+240)).x*s,y+fromAngle(r).y*s,s*25/15,fromAngle(loopA(r+240)),co.b3);
	// tri(x+fromAngle(loopA(r+240)).x*s,y+fromAngle(r).y*s,s,fromAngle(loopA(r+240)),mix(co.b3,co.w,s/45));
	// tri(x+fromAngle(loopA(r+120)).x*s,y+fromAngle(r).y*s,s*25/15,fromAngle(loopA(r+120)),co.g3);
	// tri(x+fromAngle(loopA(r+120)).x*s,y+fromAngle(r).y*s,s,fromAngle(loopA(r+120)),mix(co.g3,co.w,s/45));
	// tri(x+fromAngle(loopA(r+30)).x*s,y+fromAngle(r).y*s,s*25/15,fromAngle(loopA(r+30)),co.y3);
	// tri(x+fromAngle(loopA(r+30)).x*s,y+fromAngle(r).y*s,s,fromAngle(loopA(r+30)),mix(co.y3,co.w,s/45));
	//outer triangles
	s += 5;
	if(st>0){st-=1} //counts down on invulnerability timer
}}

//Every Frame
var update = function(){
	// requestAnimationFrame(update); //nope
	C.height = C.height;
	var tmp = background(); //paints background, returns array of enemies touching bg colours
	drawP(); //draws player
	moveParticles();//manage particles
	enMove(); //moves-draw all enemies
	if(ran(0,en.length*170)==0){en.push(new enN())} //spawns new enemy
	//Collide with player, or enemy
	for(var i=0;i<en.length;i++){//col with enemies
		for(var ii=i;ii<en.length;ii++){
			if(col(en[i],en[ii])){
				if(i!=ii){
					tmp.push(i);
					tmp.push(ii);
					explode(en[i]);
					explode(en[ii]);
				}
			}
		}
	}
	for(var i=tmp.length-1;i>-1;i-=1){en.splice(tmp[i],1);lvl.score++}//removes dead enemies
	for(var i=0;i<en.length;i++){//col with player
		if(col(en[i],p)){hit(1)}
	}
	hud.width = hud.width; //clears hud
	HUD.fillStyle = rgb(mix(p.c,co.w,.5));
	for(var i=0;i<p.hp;i++){HUD.fillRect(i*100+20,(100-p.s*3)/2,60,p.s*3)} //draws HP bar
	HUD.fillStyle = rgb(mix(p.c,co.w,.6));
	for(var i=0;i<p.hp;i++){HUD.fillRect(i*100+20,(100-p.s*2)/2,60,p.s*2)} //draws HP bar 2
	HUD.fillStyle = 'white';
	for(var i=0;i<2;i++){HUD.fillRect(0,i*90,800*(lvl.score/lvl.goal),10);} //draws lvl completion bar
	lvl.tim >= 100 ? lvl.tim = 0 : lvl.tim += 1; //general global timer for countdowns or whatever
	if(lvl.score >= lvl.goal){newLvl()} //once you kill the required amount, go to next level
}



//mouse input
document.addEventListener('mousemove',function(e){
	pMove(e.clientX - C.getBoundingClientRect().left,e.clientY - C.getBoundingClientRect().top);
},false);
//key input (1,2,3,4?)
document.addEventListener('keydown', function(e){
	// console.log("key:",e.keyCode); //display key
	//keys 1-4 change which element/colour (p.el) player trails
	if(e.keyCode==49){p.el=co.r3;p.c=mix(co.r3,co.w,-.5)} //red, fire, 1
	if(e.keyCode==50){p.el=co.b3;p.c=mix(co.b3,co.w,-.5)} //blue, water 2
	if(e.keyCode==51){p.el=co.y3;p.c=mix(co.y3,co.w,-.5)} //yellow, earth 3
	if(e.keyCode==52){p.el=co.g3;p.c=mix(co.g3,co.w,-.5)} //green, air 4
	if(e.keyCode==32){lvl.pause ? frame=self.setInterval(update,1) : clearInterval(frame)} //pauses game
	
},false);

// en.push(new enN) //testification
// en.push(new enN) //testification

generateBG();

var frame=self.setInterval(update,1);
// update();
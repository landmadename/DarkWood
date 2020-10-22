!function(t,e){"undefined"!=typeof module?module.exports=e():"function"==typeof define&&"object"==typeof define.amd?define(e):this.Vector=e()}(0,function(){"use strict";var t=function(){function t(t){return Math.round(1e8*t)/1e8}function e(t,e){var n=e.x-t.x,i=e.y-t.y;return Math.sqrt(n*n+i*i)}function n(t,e,n){var i=e.y-t.y,s=e.x-t.x,u=Math.atan2(i,s);if(n)for(;u<0;)u+=r;return u}function i(t,e){this.x=void 0!==t?t:0,this.y=void 0!==e?e:0}var r=2*Math.PI,s=180/Math.PI,u=Math.PI/180;return i.fromRadians=function(t){return new i(Math.cos(t),Math.sin(t))},i.fromDegrees=function(t){var e=t*(Math.PI/180);return i.fromRadians(e)},i.fromString=function(t){var e=t.split(",");return new i(parseFloat(e[0]),parseFloat(e[1]))},i.fromArray=function(t){return new i(t[0],t[1])},i.prototype={version:"2.0.1",clone:function(){return new i(this.x,this.y)},equals:function(t){return this.prototype===t.prototype&&this.x===t.x&&this.y===t.y},copy:function(t){return this.x=t.x,this.y=t.y,this},copyX:function(t){return this.x=t.x,this},copyY:function(t){return this.y=t.y,this},toDict:function(){return{x:this.x,y:this.y}},toArray:function(){return[this.x,this.y]},set:function(t,e){return void 0!==t&&(this.x=t),void 0!==e&&(this.y=e),this},flipXY:function(){return new i(this.y,this.x)},flipXYSelf:function(){return this.y=[this.x,this.x=this.y][0],this},invert:function(){return this.mulScalar(-1)},invertSelf:function(){return this.mulScalarSelf(-1),this},distanceFrom:function(t){return e(this,t)},radiansTo:function(t){return n(this,t,!0)},degreesTo:function(t){return n(this,t,!0)*s},toRadians:function(t){return n(i.zero,this,!0)},toDegrees:function(t){return this.toRadians()*s},rotateDegreesSelf:function(t){return this.rotateRadiansSelf(t*u)},rotateDegrees:function(t){return this.clone().rotateDegreesSelf(t)},rotateRadiansSelf:function(e){var n=Math.cos(e),i=Math.sin(e),r=this.x*n-this.y*i,s=this.x*i+this.y*n;return this.x=t(r),this.y=t(s),this},rotateRadians:function(t){return this.clone().rotateRadiansSelf(t)},length:function(){return Math.sqrt(this.x*this.x+this.y*this.y)},normalizeSelf:function(){var t=Math.sqrt(this.x*this.x+this.y*this.y);return 0===t?this:(this.x/=t,this.y/=t,this)},normalize:function(){return this.clone().normalizeSelf()},addSelf:function(t){return"number"==typeof t?this.addScalarSelf(t):(this.x+=t.x,this.y+=t.y,this)},subSelf:function(t){return"number"==typeof t?this.subScalarSelf(t):(this.x-=t.x,this.y-=t.y,this)},divSelf:function(t){return"number"==typeof t?this.divScalarSelf(t):(this.x/=t.x,this.y/=t.y,this)},mulSelf:function(t){return"number"==typeof t?this.mulScalarSelf(t):(this.x*=t.x,this.y*=t.y,this)},addScalarSelf:function(t){return this.x+=t,this.y+=t,this},subScalarSelf:function(t){return this.x-=t,this.y-=t,this},divScalarSelf:function(t){return this.x/=t,this.y/=t,this},mulScalarSelf:function(t){return this.x*=t,this.y*=t,this},add:function(t){return this.clone().addSelf(t)},sub:function(t){return this.clone().subSelf(t)},mul:function(t){return this.clone().mulSelf(t)},div:function(t){return this.clone().divSelf(t)},addScalar:function(t){return this.clone().addScalarSelf(t)},subScalar:function(t){return this.clone().subScalarSelf(t)},mulScalar:function(t){return this.clone().mulScalarSelf(t)},divScalar:function(t){return this.clone().divScalarSelf(t)},clampSelf:function(t,e){return this.x<t.x&&(this.x=t.x),this.y<t.y&&(this.y=t.y),this.x>e.x&&(this.x=e.x),this.y>e.y&&(this.y=e.y),this},clamp:function(t,e){return this.clone().clampSelf(t,e)},applySelf:function(t){return this.x=t(this.x),this.y=t(this.y),this},apply:function(t){return this.clone().applySelf(t)},absSelf:function(){return this.applySelf(Math.abs)},abs:function(){return this.clone().absSelf()},roundSelf:function(){return this.applySelf(Math.round)},round:function(){return this.clone().roundSelf()},dot:function(t){return this.x*t.x+this.y*t.y},cross:function(t){return this.x*t.y-this.y*t.x},repairSelf:function(t,e){return("number"!=typeof this.x||isNaN(this.x+1))&&(this.x=t||0),("number"!=typeof this.y||isNaN(this.y+1))&&(this.y=e||0),this},repair:function(t,e){return this.clone().repairSelf(t,e)},toString:function(){return this.x+","+this.y},format:function(t){return t=t||"%x,%y",t=t.replace(new RegExp("%x","g"),this.x),t=t.replace(new RegExp("%y","g"),this.y)}},i}();return t.zero=new t(0,0),t.one=new t(1,1),t.up=new t(0,-1),t.down=new t(0,1),t.left=new t(-1,0),t.right=new t(1,0),t.upLeft=new t(-1,-1),t.downLeft=new t(-1,1),t.upRight=new t(1,-1),t.downRight=new t(1,1),t.prototype.magnitude=t.prototype.length,Object.freeze&&(Object.freeze(t.zero),Object.freeze(t.one),Object.freeze(t.up),Object.freeze(t.down),Object.freeze(t.left),Object.freeze(t.right),Object.freeze(t.upLeft),Object.freeze(t.downLeft),Object.freeze(t.upRight),Object.freeze(t.downRight)),t});
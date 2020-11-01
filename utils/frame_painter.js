var Vector = require('vector2js');

var cvs,ctx;
var patterns = {};

function init(canvas_input,context_input) {
  cvs = canvas_input
  ctx = context_input
}

async function set_patterns(patterns_input, callback) {
  patterns = patterns_input
  await load_imgs(patterns)
  callback()
}

function load_imgs(patterns) {
  return new Promise((resolve, reject) => {
    var cnt = 8
    for (let type in patterns){
      for (let site in patterns[type]){
        patterns[type][site]["img"] = cvs.createImage()
        patterns[type][site]["img"].src = patterns[type][site]["path"]
        patterns[type][site]["img"].onload = function () {
          if (--cnt==0) {
            console.log(patterns)
            resolve(1)
          }
        }  
      }
    }
  })
}

function draw(dots, frame_width, card_width, hls) {
  var card_box = find_outer_box(card_width, dots)
  var frame_box = find_outer_box(frame_width, get_outer_dots(card_box))

  render(card_box, "card", card_width, hls)
  render(frame_box, "frame", frame_width, hls)
}

function get_outer_dots(box) {
  return [box.now["top"][3], box.now["right"][3], box.now["bottom"][3], box.now["left"][3]]
}

function find_outer_box(width, dots) {
  var va = new Vector(dots[0].x, dots[0].y)
  var vb = new Vector(dots[1].x, dots[1].y)
  var vc = new Vector(dots[2].x, dots[2].y)
  var vd = new Vector(dots[3].x, dots[3].y)

  var new_va = va.clone()
  var new_vb = vb.clone()
  var new_vc = vc.clone()
  var new_vd = vd.clone()

  var vab = vb.sub(va)
  var vbc = vc.sub(vb)
  var vcd = vd.sub(vc)
  var vda = va.sub(vd)
  
  var shift_vab = vab.normalize().mulScalar(width)
  var shift_vbc = vbc.normalize().mulScalar(width)
  var shift_vcd = vcd.normalize().mulScalar(width)
  var shift_vda = vda.normalize().mulScalar(width)

  new_va.addSelf(shift_vda).subSelf(shift_vab)
  new_vb.addSelf(shift_vab).subSelf(shift_vbc)
  new_vc.addSelf(shift_vbc).subSelf(shift_vcd)
  new_vd.addSelf(shift_vcd).subSelf(shift_vda)

  var now_frame = {
    left:    [va, vb, new_vb, new_va],
    bottom:  [vb, vc, new_vc, new_vb],
    right: [vc, vd, new_vd, new_vc],
    top:   [vd, va, new_va, new_vd]
  }

  var raw_frame = []
  for (const key in now_frame) {
    var frame = now_frame[key]
    var ve = new Vector(60, 60)
 
    var top_len = frame[3].sub(frame[2]).length() 
    var bottom_len = frame[1].sub(frame[0]).length() 
    var diff = (top_len - bottom_len)/2

    var vf = new Vector(ve.x+bottom_len, ve.y+0)
    var vg = new Vector(ve.x+diff+bottom_len, ve.y-width)
    var vh = new Vector(ve.x-diff, ve.y-width)
    raw_frame.push([ve, vf, vg, vh])
  }

  raw_frame = {
    top: raw_frame[0],
    right: raw_frame[1],
    bottom: raw_frame[2],
    left: raw_frame[3]
  }

  return {
    raw: raw_frame,
    now: now_frame
  }
}

function render(box, type, pattern_height, hls) {
  var now_dots = box.now
  var raw_dots = box.raw
  for (const site in now_dots) {
    if (now_dots.hasOwnProperty(site)) {
      var dot1 = now_dots[site][0]
      var dot2 = now_dots[site][1]
      var dot3 = now_dots[site][2]
      var dot4 = now_dots[site][3]

      var idot1 = raw_dots[site][0]
      var idot2 = raw_dots[site][1]
      var idot3 = raw_dots[site][2]
      var idot4 = raw_dots[site][3]
      renderImage(idot3, dot3, idot2, dot2, idot4, dot4, idot1, type, site, pattern_height, hls);
      renderImage(idot1, dot1, idot2, dot2, idot4, dot4, idot1, type, site, pattern_height, hls);
    }
  }
}

function renderImage(arg_1, _arg_1, arg_2, _arg_2, arg_3, _arg_3, vertex, type, site, pattern_height, hls) {
  var saturation = hls[2]
  var lightness = hls[1]
  var img = patterns[type][site]["img"]
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(_arg_1.x, _arg_1.y);
  ctx.lineTo(_arg_2.x, _arg_2.y);
  ctx.lineTo(_arg_3.x, _arg_3.y);
  // ctx.stroke();
  ctx.closePath();
  ctx.clip();
  var result = getMatrix(arg_1 , _arg_1 , arg_2 , _arg_2 , arg_3 , _arg_3);
  ctx.transform(result.a, result.b, result.c, result.d, result.e, result.f);

  var pattern_width = img.width*pattern_height/img.height
  ctx.scale(1, -1);
  ctx.translate(-2*pattern_width, -60)
  for (let i = 0; i < cvs.width/pattern_width*1.3; i++) {
    ctx.translate(pattern_width, 0);
    ctx.globalCompositeOperation = "source-over"
    ctx.drawImage(img, 0, 0, img.width, img.height,0 ,0 ,pattern_width , pattern_height)
    ctx.globalCompositeOperation = "luminosity"
    ctx.fillStyle = "hsl(0,100%,"+lightness/255*100+"%,10%)"
    ctx.fillRect(0,0,1000,1000);
    ctx.globalCompositeOperation = "saturation"
    ctx.fillStyle = "hsl(0,"+saturation/255*100+"%,100%,10%)"
    ctx.fillRect(0,0,1000,1000);
  }
  ctx.restore();
}

function getMatrix (arg_1 , _arg_1 , arg_2 , _arg_2 , arg_3 , _arg_3){
  //传入x值解第一个方程 即  X = ax + cy + e 求ace
  //传入的四个参数，对应三元一次方程：ax+by+cz=d的四个参数：a、b、c、d，跟矩阵方程对比c为1
  var arr1 = [arg_1.x , arg_1.y , 1 , _arg_1.x];
  var arr2 = [arg_2.x , arg_2.y , 1 , _arg_2.x];
  var arr3 = [arg_3.x , arg_3.y , 1 , _arg_3.x];
  var result = equation(arr1 , arr2 , arr3);
  //传入y值解第二个方程 即  Y = bx + dy + f 求 bdf
  arr1[3] = _arg_1.y;
  arr2[3] = _arg_2.y;
  arr3[3] = _arg_3.y;
  var result2 = equation(arr1 , arr2 , arr3);
  var a = result.x;
  var c = result.y;
  var e = result.z;
  var b = result2.x;
  var d = result2.y;
  var f = result2.z;
  return {
      a : a,
      b : b,
      c : c,
      d : d,
      e : e,
      f : f
  };
}

function equation (arr1 , arr2 , arr3){
  var a1 = +arr1[0];
  var b1 = +arr1[1];
  var c1 = +arr1[2];
  var d1 = +arr1[3];

  var a2 = +arr2[0];
  var b2 = +arr2[1];
  var c2 = +arr2[2];
  var d2 = +arr2[3];

  var a3 = +arr3[0];
  var b3 = +arr3[1];
  var c3 = +arr3[2];
  var d3 = +arr3[3];

  //分离计算单元
  var m1 = c1 - (b1 * c2 / b2);
  var m2 = c2 - (b2 * c3 / b3);
  var m3 = d2 - (b2 * d3 / b3);
  var m4 = a2 - (b2 * a3 / b3);
  var m5 = d1 - (b1 * d2 / b2);
  var m6 = a1 - (b1 * a2 / b2);

  //计算xyz
  var x = ((m1 / m2) * m3 - m5)/((m1 / m2) * m4 - m6);
  var z = (m3 - m4 * x) / m2;
  var y = (d1 - a1 * x - c1 * z) / b1;

  return {
      x : x,
      y : y,
      z : z
  }
}

module.exports={
  init: init,
  render: render,
  draw: draw,
  set_patterns: set_patterns
}
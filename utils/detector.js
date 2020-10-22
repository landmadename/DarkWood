var lineTools = require("./lineTools");
var cv;
var ksize;
var cnts, hierarchy;

function init(cv_input) {
  cv = cv_input
  ksize = new cv.Size(5, 5)
  cnts = new cv.MatVector()
  hierarchy = new cv.Mat()
  
}

function canny(mat, k) {
  cv.cvtColor(mat, mat, cv.COLOR_RGBA2GRAY, 0)
  cv.GaussianBlur(mat, mat, ksize,  0.3*((k-1)*0.5-1)+0.8);
  cv.Canny(mat, mat, 75, 200)
}

function contours(mat) {
  cv.findContours(mat, cnts, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE)
}

function approxPoly(mat, epsilon) {
  cv.rectangle(mat, new cv.Point(0, 0),  new cv.Point(1000, 1000), new cv.Scalar(0, 0, 0), -1)
  var poly = new cv.MatVector();
  for (var i=0; i<cnts.size(); ++i){
    if (cv.arcLength(cnts.get(i)) > 80){
      var approx = new cv.Mat()
      cv.approxPolyDP(cnts.get(i),approx, epsilon, true);
      poly.push_back(approx)
      approx.delete()
    }
  }
  cv.drawContours(mat, poly, -1, new cv.Scalar(255, 255, 255));
  poly.delete()
}

function draw_lines(mat, lines) {
  for (let i = 0; i < lines.rows; ++i) {
    let rho = lines.data32F[i * 2];
    let theta = lines.data32F[i * 2 + 1];
    let a = Math.cos(theta);
    let b = Math.sin(theta);
    let x0 = a * rho;
    let y0 = b * rho;
    let startPoint = { x: x0 - 2000 * b, y: y0 + 2000 * a };
    let endPoint = { x: x0 + 2000 * b, y: y0 - 2000 * a };
    cv.line(mat, startPoint, endPoint, [255, 0, 0, 255]);
  }
}

function draw_points(mat, points, Yoffset) {
  console.log(Yoffset,mat.rows-Yoffset)
  for (let i = 0; i < points.length; i++) {
    if (points[i].y>(Yoffset) && points[i].y<(mat.rows-Yoffset)) {
      cv.circle(mat, points[i], 20, [255, 0, 0, 255], -1)
    }
  }
}

function draw_mask(mat, mask, Yoffset) {
  var lines_mat = new cv.Mat()
  var points
  // var lines = []
  cv.HoughLines(mat, lines_mat, 1, 3.1415926/180, 120)
  // draw_lines(mat, lines_mat)
  lines = lineTools.getLinesFromData32F(lines_mat.data32F)
  points = lineTools.getAllIntersections(lines)
  draw_points(mask, points, Yoffset)
  lines_mat.delete()
}

function Harris(mat, mask, Yoffset) {
  var corners_mat = new cv.Mat()
  cv.goodFeaturesToTrack(mat, corners_mat, 20, 0.06, 200, mask, 3, true)

  let corners = []
  let len = corners_mat.data32F.length / 2
  for (let i = 0; i < len; ++i) {
    let point = {x: corners_mat.data32F[i * 2], y: corners_mat.data32F[i * 2 + 1]}
    corners.push(point)
  }

  draw_points(mat, corners, Yoffset)
  return corners
}

function detect(mat, offset) {
  var Yoffset = 0
  if (offset != undefined) {
    var Yoffset = -offset.y
  }
  var mask = cv.Mat.zeros(mat.rows, mat.cols, cv.CV_8UC1);
  canny(mat, 5)
  contours(mat)
  approxPoly(mat, 20)
  draw_mask(mat, mask, Yoffset)
  var corners = Harris(mat, mask, Yoffset)
  mask.delete()
  return corners
}

//////////////////////////////////////////////////
var quadrangle = [];

function combination(m, n, currentIndex = 0, choseArr = [], result = []) {
	let mLen = m.length
	if (currentIndex + n > mLen) {
		return
	}
	for (let i = currentIndex; i < mLen; i++) {
		if (n === 1) {
			result.push([...choseArr, m[i]])
			i + 1 < mLen && combination(m, n, i + 1, choseArr, result)
			break
		}
		combination(m, n - 1, i + 1, [...choseArr, m[i]], result)
	}
	return result
}

function get_area(points) {
  points.sort((a,b)=>a.x+a.y-b.x-b.y)
  var a = points[0]
  var b = points[3]
  if (points[1].x <points[2].x) {
    var c = points[1]
    var d = points[2]
  } else {
    var c = points[2]
    var d = points[1]
  }
  var area_abc2 = (a.x - c.x) * (b.y - c.y) - (a.y - c.y) * (b.x - c.x);  
  var area_abd2 = (a.x - d.x) * (b.y - d.y) - (a.y - d.y) * (b.x - d.x);   
  
  // 面积符号相同则两点在线段同侧,不相交 
  if ( area_abc2*area_abd2>=0 ) {
    a = points[0]
    b = points[1]
    if (points[2].x <points[3].x) {
      var c = points[2]
      var d = points[3]
    } else {
      var c = points[3]
      var d = points[2]
    }  
    c = points[2]
    d = points[3]
  }
  area_abc2 = (a.x - c.x) * (b.y - c.y) - (a.y - c.y) * (b.x - c.x); 
  area_abd2 = (a.x - d.x) * (b.y - d.y) - (a.y - d.y) * (b.x - d.x); 
  var area = (Math.abs(area_abc2) + Math.abs(area_abd2))/2
  return {
    area: area,
    points: [a,c,b,d]
  }
}

function get_max_quadrangle(points) {
  if (points.length < 4) {
    return quadrangle
  } else {
    var areas = []
    cbs = combination(points, 4)
    for (let i = 0; i < cbs.length; i++) {
      areas.push(get_area(cbs[i]))
    }
    areas.sort((a,b)=>b.area-a.area)
    // console.log(areas)
    quadrangle = areas[0].points
    return quadrangle
  }
}

module.exports = {
  init: init,
  detect: detect,
  get_max_quadrangle: get_max_quadrangle
}
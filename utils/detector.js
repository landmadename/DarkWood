/**
  ******************************************************************************
  * @文件    detector.c
  * @作者    陈泽宇
  * @版本    V1.0
  * @日期    2020年10月7日
  * @简述    提取最主要矩形物体的文件
  * ****************************************************************************
**/

var lineTools = require("./lineTools");
var cv;
var ksize;
var cnts, hierarchy;

/*
 * 功能说明: 初始化，并导入opencv
 * 形    参: cv_input：被导入的opencv对象
 * 返 回 值: 无 
 */
function init(cv_input) {
  cv = cv_input
  ksize = new cv.Size(5, 5)
  cnts = new cv.MatVector()
  hierarchy = new cv.Mat()
}

/*
 * 功能说明: canny算法画出轮廓
 * 形    参: mat：图像矩阵
 *           k：去噪点程度
 * 返 回 值: 无 
 */
function canny(mat, k) {
  cv.cvtColor(mat, mat, cv.COLOR_RGBA2GRAY, 0)
  cv.GaussianBlur(mat, mat, ksize,  0.3*((k-1)*0.5-1)+0.8);
  cv.Canny(mat, mat, 75, 200)
}

/*
 * 功能说明: findContours算法提取轮廓
 * 形    参: mat：图像矩阵
 * 返 回 值: 无 
 */
function contours(mat) {
  cv.findContours(mat, cnts, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE)
}

/*
 * 功能说明: approxPoly算法多边形拟合轮廓
 * 形    参: mat：图像矩阵
 *           epsilon：指定的精度
 * 返 回 值: 无 
 */
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

/*
 * 功能说明: 在图上绘出检测到的直线
 * 形    参: mat：图像矩阵
 *           lines：直线数组
 * 返 回 值: 无 
 */
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

/*
 * 功能说明: 在图上绘出直线交点
 * 形    参: mat：图像矩阵
 *           points：交点
 *           Yoffset：上下忽略高度
 * 返 回 值: 无 
 */
function draw_points(mat, points, Yoffset) {
  for (let i = 0; i < points.length; i++) {
    if (points[i].y>(Yoffset) && points[i].y<(mat.rows-Yoffset)) {
      cv.circle(mat, points[i], 20, [255, 0, 0, 255], -1)
    }
  }
}

/*
 * 功能说明: 绘制遮罩图层
 * 形    参: mat：图像矩阵
 *           mask：遮罩图层矩阵
 *           Yoffset：上下忽略高度
 * 返 回 值: 无 
 */
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

/*
 * 功能说明: Harris算法提取遮罩下的所有角点
 * 形    参: mat：图像矩阵
 *           mask：遮罩图层矩阵
 *           Yoffset：上下忽略高度
 * 返 回 值: 所有角点
 */
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

/*
 * 功能说明: 获取图片的色相、饱和度、亮度
 * 形    参: mat：图像矩阵
 * 返 回 值: 图片的色相、饱和度、亮度
 */
function get_hls(mat) {
  var hls = cv.Mat.zeros(mat.rows, mat.cols, cv.CV_8UC3)
  cv.cvtColor(mat, hls, cv.COLOR_BGR2HLS, 0)
  var hls_mean = cv.mean(hls)
  hls.delete()
  return hls_mean
}

/*
 * 功能说明: 矩形检测
 * 形    参: mat：图像矩阵
 *           offset：上下左右的忽略高度
 * 返 回 值: 所有矩形坐标
 */
function detect(mat, offset) {
  var Yoffset = 0
  var mask, corners

  if (offset != undefined) { Yoffset = -offset.y }
  mask = cv.Mat.zeros(mat.rows, mat.cols, cv.CV_8UC1);
  canny(mat, 5)
  contours(mat)
  approxPoly(mat, 20)
  draw_mask(mat, mask, Yoffset)
  corners = Harris(mat, mask, Yoffset)
  mask.delete()
  return corners
}

/*
*********************获取最大矩形*******************
*/
var quadrangle = [];

/*
 * 功能说明: 绘制遮罩图层
 * 形    参: m：数组
 *           n：n个元素组合
 * 返 回 值: 无 
 */
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

/*
 * 功能说明: 获取坐标所围的面积
 * 形    参: points：矩形坐标
 * 返 回 值: 无 
 */
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

/*
 * 功能说明: 获取最大四边形
 * 形    参: points：矩形坐标
 * 返 回 值: 无 
 */
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
    quadrangle = areas[0].points
    return quadrangle
  }
}

/*
 * 功能说明: 清除保存的最大四边形坐标
 * 形    参: 无
 * 返 回 值: 无 
 */
function clear_max_quadrangle() {
  quadrangle = []
}

module.exports = {
  init: init,
  detect: detect,
  get_max_quadrangle: get_max_quadrangle,
  clear_max_quadrangle: clear_max_quadrangle,
  get_hls: get_hls
}
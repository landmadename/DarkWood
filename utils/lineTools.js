/**
  ******************************************************************************
  * @文件    lineTools.c
  * @作者    陈泽宇
  * @版本    V1.0
  * @日期    2020年10月7日
  * @简述    各种直线操作
  * ****************************************************************************
**/

const UNCAL_THETA = 0.5; //判为平行阈值


/*
 * 功能说明: 直线对象
 * 形    参: rho：到直线的距离
 *           theta：直线夹角
 * 返 回 值: 无 
 */
class Line {
  constructor(rho, theta) {
    this.rho = rho
    this.theta = theta
    let a = Math.cos(theta);
    let b = Math.sin(theta);
    let x0 = a * rho;
    let y0 = b * rho;
    this.startPoint = { x: x0 - 2000 * b, y: y0 + 2000 * a };
    this.endPoint = { x: x0 + 2000 * b, y: y0 - 2000 * a };
  }
}

/*
 * 功能说明: 从数据流中获取所有的直线
 * 形    参: data32F：数据流
 * 返 回 值: 直线数组
 */
function getLinesFromData32F (data32F) {
  let lines = []
  let len = data32F.length / 2
  for (let i = 0; i < len; ++i) {
    let rho = data32F[i * 2];
    let theta = data32F[i * 2 + 1];
    lines.push(new Line(rho, theta))
  }
  return lines
}

/*
 * 功能说明: 计算两直线间的交点
 * 形    参: l1：直线1
 *           l2：直线2
 * 返 回 值: 交点
 */
function getIntersection (l1, l2) {
  //角度差太小 不算，
  let minTheta = Math.min(l1.theta, l2.theta)
  let maxTheta = Math.max(l1.theta, l2.theta)
  if (Math.abs(l1.theta - l2.theta) < UNCAL_THETA || Math.abs(minTheta + Math.PI - maxTheta) < UNCAL_THETA) {
    return;
  }
  if (l1.theta < Number.EPSILON) {
    l1.startPoint.x = l1.startPoint.x+5
    l1.endPoint.x = l1.endPoint.x-5
  }
  //计算两条直线的交点
  let intersection;
  let a1 = Math.abs(l1.startPoint.x - l1.endPoint.x) < Number.EPSILON ? 0 : (l1.startPoint.y - l1.endPoint.y) / (l1.startPoint.x - l1.endPoint.x);
  let b1 = l1.startPoint.y - a1 * (l1.startPoint.x);
  let a2 = Math.abs((l2.startPoint.x - l2.endPoint.x)) < Number.EPSILON ? 0 : (l2.startPoint.y - l2.endPoint.y) / (l2.startPoint.x - l2.endPoint.x);
  let b2 = l2.startPoint.y - a2 * (l2.startPoint.x);
  if (Math.abs(a2 - a1) > Number.EPSILON) {
    let x = (b1 - b2) / (a2 - a1)
    let y = a1 * x + b1
    intersection = { x, y }
    if (Math.abs(x)>1999 || Math.abs(y)>1999) {
      return;
    }
    return intersection
  }
}

/*
 * 功能说明: 计算所有交点
 * 形    参: lines：所有的直线
 * 返 回 值: 所有的交点
 */
function getAllIntersections (lines) {
  let points = []
  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      let point = getIntersection(lines[i], lines[j])
      if (point) {
        points.push(point)
      }
    }
  }
  return points
}

module.exports = {
  getLinesFromData32F: getLinesFromData32F,
  getAllIntersections: getAllIntersections
}
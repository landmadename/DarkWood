var Vector = require('vector2js');
var lineTools = require("./lineTools");

const radius = 35
const move_mode = -1;
var prev_point = false
var prev_scale_length = 0

function get_touched_point_index(points, touch_point) {
  for (let index = 0; index < points.length; index++) {
    if (is_touched(points[index], touch_point)) {
      prev_point = touch_point
      return index
    } 
  }
  if (point_in_poly(touch_point, points)) {
    prev_point = touch_point
    return move_mode
  }
  return false
}

function point_in_poly(point, poly) { 
  for (var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i) 
      ((poly[i].y <= point.y && point.y < poly[j].y) || (poly[j].y <= point.y && point.y < poly[i].y)) 
      && (point.x < (poly[j].x - poly[i].x) * (point.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x) 
      && (c = !c); 
  return c; 
}

function is_touched(center, point) {
  return new Vector(center.x, center.y).subSelf(new Vector(point.x, point.y)).length() < radius
}

function get_move_offset(point) {
  let offset = new Vector(point.x, point.y).subSelf(new Vector(prev_point.x, prev_point.y))
  prev_point = point
  return offset
}

function set_first_scale_length(points) {
  prev_scale_length = new Vector(points[0].x, points[0].y).subSelf(new Vector(points[1].x, points[1].y)).length()
}

function get_scale_offset(points) {
  var scale_length = new Vector(points[0].x, points[0].y).subSelf(new Vector(points[1].x, points[1].y)).length()
  var offset = scale_length-prev_scale_length
  prev_scale_length = scale_length
  return offset
}

function scale_shift(points, offset) {
  var direction = (offset>0 ? 1:-1)
  var center = lineTools.getAllIntersections([
    { startPoint:points[0], endPoint:points[2] },
    { startPoint:points[1], endPoint:points[3] }
  ])
  var v0c = new Vector(points[0].x, points[0].y).subSelf(new Vector(center[0].x, center[0].y)).mulScalarSelf(direction*0.01)
  var v1c = new Vector(points[1].x, points[1].y).subSelf(new Vector(center[0].x, center[0].y)).mulScalarSelf(direction*0.01)
  var v2c = new Vector(points[2].x, points[2].y).subSelf(new Vector(center[0].x, center[0].y)).mulScalarSelf(direction*0.01)
  var v3c = new Vector(points[3].x, points[3].y).subSelf(new Vector(center[0].x, center[0].y)).mulScalarSelf(direction*0.01)
  // offset = 1
  points[0].x += v0c.x
  points[0].y += v0c.y
  points[1].x += v1c.x
  points[1].y += v1c.y
  points[2].x += v2c.x
  points[2].y += v2c.y
  points[3].x += v3c.x
  points[3].y += v3c.y
}

function move_shift(points, offset) {
  points[0].x += offset.x
  points[0].y += offset.y
  points[1].x += offset.x
  points[1].y += offset.y
  points[2].x += offset.x
  points[2].y += offset.y
  points[3].x += offset.x
  points[3].y += offset.y
}

function point_shift(quadrangle, raw_quadrangle, move_offset, moving_point_index) {
  quadrangle[moving_point_index].x += move_offset.x
  quadrangle[moving_point_index].y += move_offset.y
  raw_quadrangle[moving_point_index].x += move_offset.x
  raw_quadrangle[moving_point_index].y += move_offset.y

}

function correct(points) {
  var height = (new Vector(points[0].x, points[0].y).subSelf(new Vector(points[1].x, points[1].y)).length() + new Vector(points[2].x, points[2].y).subSelf(new Vector(points[3].x, points[3].y)).length())/2
  var width = (new Vector(points[0].x, points[0].y).subSelf(new Vector(points[3].x, points[3].y)).length() + new Vector(points[2].x, points[2].y).subSelf(new Vector(points[1].x, points[1].y)).length())/2

  points[1].x = points[0].x
  points[1].y = points[0].y + height
  points[2].x = points[0].x + width
  points[2].y = points[0].y + height
  points[3].x = points[0].x + width
  points[3].y = points[0].y
}

function scale(offset, size) {
  var direction = (offset>0 ? 1:-1)
  return size*(1 + direction*0.01)
}

function get_pic_width(points) {
  var raw_length1 = new Vector(points[0].x, points[0].y).subSelf(new Vector(points[3].x, points[3].y)).length()
  var raw_length2 = new Vector(points[1].x, points[1].y).subSelf(new Vector(points[2].x, points[2].y)).length()
  return (raw_length1 + raw_length2)/2
}

module.exports = {
  get_touched_point_index: get_touched_point_index,
  get_move_offset: get_move_offset,
  set_first_scale_length: set_first_scale_length,
  get_scale_offset: get_scale_offset,
  scale_shift: scale_shift,
  move_shift: move_shift,
  scale: scale,
  correct: correct,
  point_shift: point_shift,
  get_pic_width: get_pic_width
}
var Vector = require('vector2js');

function Pool() {
  this.queue = new Array()
  this.len = 9
  this.devide = 6

  this.insert = function (points) {
    if (this.queue.length < this.len) {
      this.queue.push(points)
    } else {
      this.queue.shift()
      this.queue.push(points)
    }
  }

  this.clear = function () {
    this.queue = new Array()
  }

  this.shift_next_step = function (from, to) {
    if (this.queue.length > 0) {
      var avg_len = this.get_average_length()
      for (let i = 0; i < 4; i++) {
        var v = new Vector(to[i].x, to[i].y).sub(new Vector(from[i].x, from[i].y))
        v.mulScalarSelf(avg_len/v.length())
        from[i].x += v.x
        from[i].y += v.y
      }
    }
  }

  this.get_average_length = function () {
    var sum = 0
    var fall = 1.6
    for (let t = 0; t < 4; t++) {
      var prev = new Vector(this.queue[0][t].x, this.queue[0][t].y)
      for (let i = 0; i < this.queue.length-1; i++) {
        sum += new Vector(this.queue[i][t].x, this.queue[i][t].y).sub(prev).length()
        prev = this.queue[i][t]
      }
    }
    return sum/this.queue.length/this.devide/4/fall
  }
}

module.exports = {
  Pool: Pool
}
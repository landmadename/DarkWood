var cvs,ctx;
const dpr = wx.getSystemInfoSync().pixelRatio

function init(canvas_input,context_input) {
  cvs = canvas_input
  ctx = context_input
}

function set_scene(src, quadrangle) {
  var img = cvs.createImage()
  img.src = src
  img.onload = function () {
    var img_to_show_width = img.height*cvs.width/cvs.height
    var img_Xoffset = (img.width-img_to_show_width)/2
    ctx.drawImage(img, img_Xoffset, 0, img_to_show_width, img.height, 0, 0, cvs.width/dpr, cvs.height/dpr)
    // ctx.save();
    // ctx.beginPath()
    // ctx.moveTo(quadrangle[0].x, quadrangle[0].y)
    // ctx.lineTo(quadrangle[1].x, quadrangle[1].y)
    // ctx.lineTo(quadrangle[2].x, quadrangle[2].y)
    // ctx.lineTo(quadrangle[3].x, quadrangle[3].y)
    // ctx.lineTo(quadrangle[0].x, quadrangle[0].y)
    // ctx.closePath()
    // ctx.clip()
    // ctx.clearRect(0, 0, cvs.width, cvs.height)
    // ctx.restore();
  }
}

function clear_scene() {
  ctx.clearRect(0, 0, cvs.width, cvs.height)
}

module.exports={
  init: init,
  set_scene: set_scene,
  clear_scene: clear_scene
}
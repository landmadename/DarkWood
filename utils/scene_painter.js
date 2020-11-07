var cvs,ctx;
const dpr = wx.getSystemInfoSync().pixelRatio

function init(canvas_input,context_input) {
  cvs = canvas_input
  ctx = context_input
}

function set_scene(src) {
  var img = cvs.createImage()
  img.src = src
  img.onload = function () {
    var img_to_show_width = img.height*cvs.width/cvs.height
    var img_Xoffset = (img.width-img_to_show_width)/2
    ctx.drawImage(img, img_Xoffset, 0, img_to_show_width, img.height, 0, 0, cvs.width/dpr, cvs.height/dpr)
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
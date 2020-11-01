var cvs,ctx;
var quadrangle;
var img_path;
var scene_painter = require("./scene_painter");
var frame_painter = require("./frame_painter");
const dpr = wx.getSystemInfoSync().pixelRatio

function init(canvas_input,context_input) {
  cvs = canvas_input
  ctx = context_input
}

function set_quadrangle(quadrangle_input) {
  quadrangle = quadrangle_input
}

function draw_croped_image(croped_image) {
  return new Promise((resolve, reject) => {
    var img = cvs.createImage()
    img.src = croped_image
    img.onload = function () {
      ctx.save();
      ctx.beginPath()
      ctx.moveTo(quadrangle[0].x, quadrangle[0].y)
      ctx.lineTo(quadrangle[1].x, quadrangle[1].y)
      ctx.lineTo(quadrangle[2].x, quadrangle[2].y)
      ctx.lineTo(quadrangle[3].x, quadrangle[3].y)
      ctx.lineTo(quadrangle[0].x, quadrangle[0].y)
      ctx.closePath()
      ctx.clip()
      ctx.drawImage(img, 0, 0)
      ctx.restore();
      resolve(1)
    }  
  })
}

function draw_scene(cvs_raw, ctx_raw, img) {
  return new Promise((resolve, reject) => {
    scene_painter.init(cvs, ctx)
    scene_painter.set_scene(img, quadrangle)
    setTimeout(
      ()=>{
        scene_painter.init(cvs_raw, ctx_raw)
        resolve(2)
      },1000
    )
  })
}

function draw_frame(cvs_raw, ctx_raw, frame_size, cardboard_size, hls) {
  return new Promise((resolve, reject) => {
    frame_painter.init(cvs, ctx)
    frame_painter.draw(quadrangle, frame_size, cardboard_size, hls)
    setTimeout(
      ()=>{
        frame_painter.init(cvs_raw, ctx_raw)
        resolve(3)
      },300
    )
  })
}

function get_img() {
  return new Promise((resolve, reject) => {
    wx.canvasToTempFilePath({
      canvas: cvs,
      fileType: 'png',
      success: (res) => {
        img_path = res.tempFilePath
        resolve(4)
      }
    })
  })
}

function get_authorize_of_album() {
  wx.getSetting({
    success(res) {
        if (!res.authSetting['scope.writePhotosAlbum']) {
            wx.authorize({
                scope: 'scope.writePhotosAlbum',
                success() {
                    save_img();
                }
            })
        } else {
          save_img();
        }
    }
})
}

function save_img() {
  wx.saveImageToPhotosAlbum({
    filePath: img_path,
    success: function (data) {
        wx.showToast({
            title: '保存到系统相册成功',
            icon: 'success',
            duration: 2000
        })
    },
    fail: function (err) {
        console.log(err);
        if (err.errMsg === "saveImageToPhotosAlbum:fail auth deny") {
            console.log("当初用户拒绝，再次发起授权")
            wx.openSetting({
                success(settingdata) {
                    console.log(settingdata)
                    if (settingdata.authSetting['scope.writePhotosAlbum']) {
                        console.log('获取权限成功，给出再次点击图片保存到相册的提示。')
                    } else {
                        console.log('获取权限失败，给出不给权限就无法正常使用的提示')
                    }
                }
            })
        } else {
            wx.showToast({
                title: '保存失败',
                icon: 'none'
            });
        }
    },
    complete(res) {
        console.log(res);
    }
  })
}

async function save() {
  wx.showLoading({
    title: '保存中',
  })
  await get_img()
  get_authorize_of_album()
  wx.hideLoading()
}

module.exports={
  init: init,
  draw_croped_image: draw_croped_image,
  set_quadrangle: set_quadrangle,
  draw_scene: draw_scene,
  draw_frame: draw_frame,
  save: save
}
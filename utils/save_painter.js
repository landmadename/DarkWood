var cvs,ctx;
var img_path;
var scene_painter = require("./scene_painter");
var main_painter = require("./main_painter");

function init(canvas_input,context_input) {
  cvs = canvas_input
  ctx = context_input
}

function clear() {
  ctx.clearRect(0, 0, 1000, 1000);
}

function draw_scene(cvs_raw, ctx_raw, img) {
  return new Promise((resolve, reject) => {
    scene_painter.init(cvs, ctx)
    scene_painter.set_scene(img)
    setTimeout(
      ()=>{
        scene_painter.init(cvs_raw, ctx_raw)
        resolve(2)
      },1000
    )
  })
}

function draw(cvs_raw, ctx_raw, frame_size, cardboard_size, hls, quadrangle, raw_quadrangle) {
  return new Promise((resolve, reject) => {
    main_painter.init(cvs, ctx)
    main_painter.draw_frame(quadrangle, frame_size, cardboard_size, hls)
    main_painter.draw_framed_image(quadrangle, raw_quadrangle)
    setTimeout(
      ()=>{
        main_painter.init(cvs_raw, ctx_raw)
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
  draw_scene: draw_scene,
  draw: draw,
  save: save,
  clear: clear
}
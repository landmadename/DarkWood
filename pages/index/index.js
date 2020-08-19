var cv;
var wasm = require("../../utils/wasm");
var detector = require("../../utils/detector");
var painter = require("../../utils/painter")
var tools = require("../../utils/tools")
var cvs3, ctx3;

var listener;

Page({
  data: {
    current_choose_panel: 0,
    mode: 'AR',
    processed: true,

    canvas_size: {
      width: 200,
      height: 200
    },
    camera_size: {
      width: 480,
      height: 640
    },
    canvasHeight: 600,
    frame_size: 80,
    cardboard_size: 80,

    imageUrl: "",
    croped_image: "",
    simple_crop_show: false,
  },

  getwasm: function () {
    wasm.init({
      url:"http://www.aiotforest.com/opencv.zip",
      type:"zip", //格式：wasm,zip
      useCache:true, //是否使用缓存
      self:this,
      success: function (Module) {
        cv=Module;
        detector.init(cv);
        console.log(cv);
      }
    })
  },

  toMat: function (frame) {
    return cv.matFromImageData({
      data:new Uint8ClampedArray(frame.data),
      width:frame.width,
      height:frame.height
    });
  },

  to_AR: function() {
    var that = this;
    var corners = [];
    var mat;
    var i = 1;
    var video_scale, Xoffset, Yoffset;
    var camera_size = {}
    var camera_ctx = wx.createCameraContext();
    listener = camera_ctx.onCameraFrame((frame) =>{
      // if (i++%that.data.frame_size == 0) {
      if (i++%15 == 0) {
        camera_size = {width: frame.width, height: frame.height}
        if (wx.getSystemInfoSync().platform == "devtools") {
          video_scale = that.data.canvas_size.height/camera_size.height
          Xoffset = (that.data.canvas_size.width-video_scale*camera_size.width)/2
          Yoffset = 0
        } else {
          video_scale = that.data.canvas_size.width/camera_size.width
          Yoffset = (that.data.canvas_size.height-video_scale*camera_size.height)/2
          Xoffset = 0
        }  
  
        mat = that.toMat(frame)
        corners = detector.detect(mat)
        quadrangle = detector.get_max_quadrangle(corners)
        q_to_show = JSON.parse(JSON.stringify(quadrangle))
        painter.scale_points(q_to_show, video_scale, Xoffset, Yoffset)
        painter.draw_points(q_to_show, cvs3, ctx3)
        // cv.imshow(cvs3, mat, ctx3)
        mat.delete()
      }
      if (i == 65000) {
        i=0
      }
    })
    listener.start()

    this.setData({
      mode: "AR"
    })
  },

  to_pic: function() {
    if (listener != undefined) {
      listener.stop()
    }
    var that = this
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success (res) {
        const tempFilePath = res.tempFilePaths[0]
        that.setData({
          imageUrl: tempFilePath,
          simple_crop_show: true,
          mode: "pic"
        })
      }
    })
  },

  close_crop: function() {
    this.setData({
      simple_crop_show: false,
      mode: 'AR'
    })
  },

  crop_complete: function(e) {
    this.setData({
      croped_image: e.detail.resultSrc,
      simple_crop_show: false
    })
    cv.imread(e.detail.resultSrc, function(mat) {
      corners = detector.detect(mat)
      quadrangle = detector.get_max_quadrangle(corners)
      q_to_show = JSON.parse(JSON.stringify(quadrangle))
      const dpr = wx.getSystemInfoSync().pixelRatio
      painter.scale_points(q_to_show, 1/dpr, 0, 0)
      painter.draw_points(q_to_show, cvs3, ctx3)
      // cv.imshow(cvs3, mat, ctx3)
      mat.delete()
    })
  },

  slider_change: function(e) {
    if (this.data.current_choose_panel == 0) {
      this.setData({
        frame_size: e.detail.value
      })
    } else {
      this.setData({
        cardboard_size: e.detail.value
      })
    }
  },

  tap_intro_button: function() {
    wx.navigateTo({
      url: '../intro/intro',
    })
  },

  // 通过点击设置当前的panel id
  tap_to_change_choose_panel: function(e) {
    var panel_id = parseInt(e.currentTarget.dataset.panel_id)
    this.setData({
      current_choose_panel: panel_id
    })
  },

  load_ctx: function(id) {
    var that = this
    const query = wx.createSelectorQuery()
    query.select(id)
      .fields({ node: true, size: true })
      .exec((res) => {
        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
  
        const dpr = wx.getSystemInfoSync().pixelRatio
        canvas.width = that.data.canvas_size.width * dpr
        canvas.height = that.data.canvas_size.height * dpr
        ctx.scale(dpr, dpr)

        console.log(canvas)
        cvs3 = canvas
        ctx3 = ctx
      })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getwasm()
    // 设置canvas高度
    wx.getSystemInfo({
      complete: (res) => {
        var canvasHeight = res.windowHeight - res.windowWidth/2
        this.setData({
          canvas_size: {
            width: res.windowWidth,
            height: canvasHeight
          }
        })
      },
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    this.load_ctx("#three")
    // tools.draw_demo("#three");
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    
  }
})
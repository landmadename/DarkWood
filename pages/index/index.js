var wasm = require("../../utils/wasm");
var cv;
var detector = require("../../utils/detector");
var image = "hi";
var cvs3, ctx3;

var listener;

Page({
  data: {
    current_choose_panel: 0,
    mode: 'pic',
    processed: true,

    canvas_size: {
      width: 200,
      height: 200
    },
    canvasHeight: 600,
    frame_size: 80,
    cardboard_size: 80,

    imageUrl: "",
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
    console.log("hi")
    var that = this;
    var mat;
    // var tmp = new cv.Mat();
    var i = 1;
    // var video_scale = cvs3.width/480
    // var video_size = new cv.Size(cvs3.width, parseInt(640*video_scale+1))
    var camera_ctx = wx.createCameraContext();
    console.log(camera_ctx)
    listener = camera_ctx.onCameraFrame((frame) =>{
      if (i++%10 == 0) {
        mat = that.toMat(frame)
        mat = detector.detect(mat)
        // cv.resize(mat, tmp, video_size, 0, 0, cv.INTER_AREA)
        cv.imshow(cvs3, mat, ctx3)
        mat.delete()
        // var mat = detector.toMat(frame);
        // var coords = detector.detect(mat);
        // cv.imshow(mat);
        // detector.draw(coords);
        // console.log(tmp)
      }
      // console.log(i)
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
    listener.stop()
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
    console.log(e.detail.resultSrc)
    cv.imread(e.detail.resultSrc, function(mat) {
      cv.imshow(cvs3, mat, ctx3)
    })
    this.setData({
      simple_crop_show: false,
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
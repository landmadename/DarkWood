var cv;
var wasm = require("../../utils/wasm");
var detector = require("../../utils/detector");
var painter = require("../../utils/painter")
var tools = require("../../utils/tools")
var frame_painter = require("../../utils/frame_painter");
var scene_painter = require("../../utils/scene_painter");

var cvs3, ctx3;
var cvs2, ctx2;

var listener;

var q_to_show;
var frame_size=40, cardboard_size=30;
var frame_id=4, card_id=6, scene_id=-1;

const dpr = wx.getSystemInfoSync().pixelRatio

Page({
  data: {
    current_choose_panel: 0,
    mode: 'AR',
    processed: true,
    frames: {},
    cards: {},
    scenes: {},
    current_frame_id: 4, 
    current_card_id: 6,
    current_scene_id: -1,

    canvas_size: {
      width: 200,
      height: 200
    },
    camera_size: {
      width: 480,
      height: 640
    },
    canvasHeight: 600,

    imageUrl: "",
    croped_image: "",
    simple_crop_show: false,
  },

  getwasm: function () {
    var that = this
    wasm.init({
      url:"http://www.aiotforest.com/opencv.zip",
      type:"zip", //格式：wasm,zip
      useCache:true, //是否使用缓存
      self:this,
      success: function (Module) {
        cv=Module;
        detector.init(cv);
        tools.set_cv(cv);
        that.to_AR();
      }
    })
  },

  to_AR: function() {
    var that = this;
    var corners = [];
    var mat;
    var i = 1;
    var scale, offset={};
    var number_of_frames_to_ignore = 6;
    var camera_ctx = wx.createCameraContext();
    scene_painter.clear_scene()
    ctx2.clearRect(0,0,1000,1000)
    listener = camera_ctx.onCameraFrame((frame) =>{
      if (i == 65000) {i=0}
      if (i == 1) {
        var camera_size = {width: frame.width, height: frame.height}
        offset = tools.get_offset_from_canvas_to_camera(that.data.canvas_size, camera_size)
        scale = tools.get_scale_from_canvas_to_camera(that.data.canvas_size, camera_size)
      }
      if (i++%number_of_frames_to_ignore == 0) {
        mat = tools.toMat(frame)
        corners = detector.detect(mat, offset)
        quadrangle = detector.get_max_quadrangle(corners)
        q_to_show = JSON.parse(JSON.stringify(quadrangle))
        painter.scale_points(q_to_show, scale, offset.x, offset.y)
        // painter.draw_points(q_to_show, cvs3, ctx3)
        that.draw()
        // cv.imshow(cvs3, mat, ctx3)
        mat.delete()
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
    var that = this
    this.setData({
      croped_image: e.detail.resultSrc,
      simple_crop_show: false
    })
    cv.imread(e.detail.resultSrc, function(mat) {
      corners = detector.detect(mat)
      quadrangle = detector.get_max_quadrangle(corners)
      q_to_show = JSON.parse(JSON.stringify(quadrangle))
      painter.scale_points(q_to_show, 1/dpr, {x:0, y:0})
      console.log(quadrangle)
      // painter.draw_points(q_to_show, cvs3, ctx3)
      that.draw()
      // cv.imshow(cvs3, mat, ctx3)
      mat.delete()
    })
  },

  slider_change: function(e) {
    if (this.data.current_choose_panel == 0) {
      frame_size = e.detail.value
    } else {
      cardboard_size = e.detail.value
    }
    this.draw()
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

  tap_to_change_frame: function(e) {
    frame_id = parseInt(e.currentTarget.dataset.frame_id)
    this.setData({
      current_frame_id: frame_id
    })
    this.set_patterns()
  },

  tap_to_change_card: function(e) {
    card_id = parseInt(e.currentTarget.dataset.card_id)
    this.setData({
      current_card_id: card_id
    })
    this.set_patterns()
  },

  tap_to_change_scene: function(e) {
    if (this.data.mode == "pic") {
      var new_scene_id = parseInt(e.currentTarget.dataset.scene_id)
      if (scene_id != new_scene_id) {
        scene_id = new_scene_id
        scene_painter.set_scene(this.data.scenes[scene_id]["img"], q_to_show)
      } else {
        scene_id = -1
        scene_painter.clear_scene()
      }
      this.setData({
        current_scene_id: scene_id
      })
    }
  },

  set_patterns: function () {
    frame_painter.set_patterns({
      "frame": {
        "top":    {"path":this.data.frames[frame_id]["top"]},
        "right":  {"path":this.data.frames[frame_id]["top"]},
        "bottom": {"path":this.data.frames[frame_id]["bottom"]},
        "left":   {"path":this.data.frames[frame_id]["bottom"]}  
      },
      "card": {
        "top":    {"path":this.data.cards[card_id]["img"]},
        "right":  {"path":this.data.cards[card_id]["img"]},
        "bottom": {"path":this.data.cards[card_id]["img"]},
        "left":   {"path":this.data.cards[card_id]["img"]}  
      }
    },
    this.draw
    )
  },

  load_ctx: function(id, setData) {
    var that = this
    const query = wx.createSelectorQuery()
    query.select(id)
      .fields({ node: true, size: true })
      .exec((res) => {
        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
  
        canvas.width = that.data.canvas_size.width * dpr
        canvas.height = that.data.canvas_size.height * dpr
        ctx.scale(dpr, dpr)

        setData(canvas, ctx)
      })
  },

  draw: function () {
    frame_painter.draw(q_to_show, frame_size, cardboard_size)
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    tools.load_frames("http://47.99.244.218:8090", this)
    tools.load_cards("http://47.99.244.218:8090", this)
    tools.load_scenes("http://47.99.244.218:8090", this)
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
    var that = this
    this.load_ctx("#three", (cvs, ctx)=>{
      cvs3 = cvs
      ctx3 = ctx
      scene_painter.init(cvs3, ctx3)
    })
    this.load_ctx("#two", (cvs, ctx)=>{
      cvs2 = cvs
      ctx2 = ctx
      frame_painter.init(cvs2, ctx2)
      that.set_patterns()
    })
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
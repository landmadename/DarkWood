var cv;
var wasm = require("../../utils/wasm");
var detector = require("../../utils/detector");
var tools = require("../../utils/tools")
var move_tools = require("../../utils/move_tools")
var main_painter = require("../../utils/main_painter");
var scene_painter = require("../../utils/scene_painter");
var save_painter = require("../../utils/save_painter");

var cvs_scene, ctx_scene;
var cvs_work, ctx_work;
var cvs_save, ctx_save;

var listener;

var q_to_show, raw_quadrangle;
var hls;
var frame_size=40, cardboard_size=30;
var frame_id=4, card_id=6, scene_id=-1;
var moving_point_index = false;

const without_scene = -1;

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
    quadrangle:[],

    canvas_size: {
      width: 200,
      height: 200
    },
    camera_size: {
      width: 480,
      height: 640
    },
    canvasHeight: 600,
    transparent_scene_id: 15,

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
    detector.clear_max_quadrangle()
    main_painter.clear()
    listener = camera_ctx.onCameraFrame((frame) =>{
      if (i == 65000) {i=0}
      if (i == 1) {
        var camera_size = {width: frame.width, height: frame.height}
        offset = tools.get_offset_from_canvas_to_camera(that.data.canvas_size, camera_size)
        scale = tools.get_scale_from_canvas_to_camera(that.data.canvas_size, camera_size)
        wx.hideLoading()
      }
      if (i++%number_of_frames_to_ignore == 0) {
        mat = tools.toMat(frame)
        hls = detector.get_hls(mat)
        corners = detector.detect(mat, offset)
        quadrangle = detector.get_max_quadrangle(corners)
        q_to_show = JSON.parse(JSON.stringify(quadrangle))
        tools.scale_points(q_to_show, scale, offset.x, offset.y)
        that.draw()
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
    main_painter.set_croped_image(e.detail.resultSrc)
    cv.imread(e.detail.resultSrc, function(mat) {
      hls = detector.get_hls(mat)
      corners = detector.detect(mat)
      if (corners.length < 4) {
        q_to_show = that.get_default_quadrangle()
      } else {
        quadrangle = detector.get_max_quadrangle(corners)
        q_to_show = JSON.parse(JSON.stringify(quadrangle))
        tools.scale_points(q_to_show, 1/dpr, 0, 0)
      }
      raw_quadrangle = JSON.parse(JSON.stringify(q_to_show))
      that.setData({
        quadrangle: q_to_show
      })
      that.draw()
      mat.delete()
    })
  },

  get_default_quadrangle: function () {
    return [
      {x: 100, y:100},
      {x: 100, y:this.data.canvas_size.height-100},
      {x: this.data.canvas_size.width-100, y:this.data.canvas_size.height-100},
      {x: this.data.canvas_size.width-100, y:100},
    ]
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
    // wx.navigateTo({
    //   url: '../intro/intro',
    // })
  },

  touch_start: function (e) {
    if (tools.in_pic_mode()) {
      if (e.touches.length == 1) {
        moving_point_index = move_tools.get_touched_point_index(q_to_show, e.touches[0])
      } else {
        moving_point_index = false
        move_tools.set_first_scale_length(e.touches)
      }
    }
   },

  touch_move: function (e) {
    if (tools.in_pic_mode()) {
      if (e.touches.length == 1) {
        if (moving_point_index !== false) {
          if (moving_point_index == -1) {
            let move_offset = move_tools.get_move_offset(e.touches[0])
            move_tools.move_shift(q_to_show, move_offset)
          } else if (moving_point_index >= 0) {
            let move_offset = move_tools.get_move_offset(e.touches[0])
            q_to_show[moving_point_index].x += move_offset.x
            q_to_show[moving_point_index].y += move_offset.y
            raw_quadrangle[moving_point_index].x += move_offset.x
            raw_quadrangle[moving_point_index].y += move_offset.y
          }
        }
        } else {
          let scale_offset = move_tools.get_scale_offset(e.touches)
          move_tools.scale_shift(q_to_show, scale_offset)
        }
        this.draw()
    }
  },

  touch_end: function (e) {
    if (tools.in_pic_mode()) {
      moving_point_index = false
    }
  },

  random_choose: function (type) {
    var ids = Object.keys(this.data[type])
    var randomElement = ids[Math.floor(Math.random() * ids.length)];
    var e = {}
    if (type == "frames") {
      e = {currentTarget: {dataset: {frame_id: randomElement}}}
      this.tap_to_change_frame(e)
    } else if (type == "cards") {
      e = {currentTarget: {dataset: {card_id: randomElement}}}
      this.tap_to_change_card(e)
    } else if (type == "scenes") {
      if (scene_id != randomElement) {
        e = {currentTarget: {dataset: {scene_id: randomElement}}}
        this.tap_to_change_scene(e)
      }
    }
  },

  tap_random_choose: function (e) {
    var type = e.currentTarget.dataset.type
    if (type == "frames_and_cards") {
      type = "frames"
      this.random_choose(type)
      type = "cards"
      this.random_choose(type)
    } else {
      this.random_choose(type)
    }
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

  scan_code: function () {
    var that = this
    wx.scanCode({
      success (res) {
        var data = JSON.parse(res.result)
        var type = Object.keys(data)[0]
        var e = {}
        if (type == "frames") {
          e = {currentTarget: {dataset: {frame_id: data["frames"]}}}
          that.tap_to_change_frame(e)
        } else if (type == "cards") {
          e = {currentTarget: {dataset: {card_id: data["card"]}}}
          that.tap_to_change_card(e)
        } else if (type == "scenes") {
          e = {currentTarget: {dataset: {scene_id: data["scene"]}}}
          that.tap_to_change_scene(e)
        }
      }
    })
  },

  tap_to_change_scene: function(e) {
    if (tools.in_pic_mode()) {
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

  correct: function () {
    move_tools.correct(q_to_show)
    this.draw()
  },

  save: async function () {
    if (tools.in_pic_mode()) {
      if (scene_id == this.data.transparent_scene_id) {
        save_painter.clear()
      } else if (scene_id == without_scene) {
        await save_painter.draw_scene(cvs_scene, ctx_scene, this.data.croped_image)
      } else {
        await save_painter.draw_scene(cvs_scene, ctx_scene, this.data.scenes[scene_id]["img"])
      }
      await save_painter.draw(cvs_work, ctx_work, frame_size, cardboard_size, hls, q_to_show, raw_quadrangle)
      save_painter.save()
    }
  },

  onLoad: function () {
    wx.showLoading({title: '加载中'})
    
    tools.set_this(this)
    this.load_cvs_ctx_and_initial()
    tools.load_frames("http://47.99.244.218:8090")
    tools.load_cards ("http://47.99.244.218:8090")
    tools.load_scenes("http://47.99.244.218:8090")
    tools.set_canvas_size()

    setTimeout(() => {
      this.getwasm()
    }, 1000);
  },

  

  load_cvs_ctx_and_initial: function () {
    tools.load_ctx("#to_save", (cvs, ctx)=>{
      cvs_save = cvs
      ctx_save = ctx
      save_painter.init(cvs_save, ctx_save)
    })
    tools.load_ctx("#scene", (cvs, ctx)=>{
      cvs_scene = cvs
      ctx_scene = ctx
      scene_painter.init(cvs_scene, ctx_scene)
    })
    tools.load_ctx("#work", (cvs, ctx)=>{
      cvs_work = cvs
      ctx_work = ctx
      main_painter.init(cvs_work, ctx_work)
    })
  },

  set_patterns: function () {
    main_painter.set_patterns({
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

  draw: function () {
    main_painter.clear()
    if (tools.quadrangle_is_ready(q_to_show)) {
      main_painter.draw_frame(q_to_show, frame_size, cardboard_size, hls)
      if (tools.in_pic_mode()) {
        main_painter.draw_framed_image(q_to_show, raw_quadrangle)
      }
    }
  },
  
})
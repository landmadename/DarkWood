// const wasm = require("../../utils/wasm");
const detector = require("../../utils/detector");
const tools = require("../../utils/tools")
const move_tools = require("../../utils/move_tools")
const main_painter = require("../../utils/main_painter");
const scene_painter = require("../../utils/scene_painter");
const save_painter = require("../../utils/save_painter");
// const { Pool } = require("../../utils/stabilizer");
const app = getApp()

var cv;
var listener;

var cvs_scene, ctx_scene;
var cvs_work, ctx_work;
var cvs_save, ctx_save;

var quadrangle_to_show, raw_quadrangle;
var frame_size=40, cardboard_size=30;
var frame_id=4, card_id=6, scene_id=-1;
var moving_point_index = false;
var custom_scene;
var frames_hue = {
  4: 101.70258620689656,
  9: 78.81306818181818
}
var hls;

const without_scene = -1;
const move_mode = -1;
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

  // WASM

  getwasm: function () {
    var that = this
    wasm.init({
      url:"http://www.aiotforest.com/opencv.zip",
      type:"zip",
      useCache:true,
      self:this,
      success: function (Module) {
        cv=Module;
        detector.init(cv);
        tools.set_cv(cv);
        // that.to_AR();
      }
    })
  },

  // to AR

  to_AR: function() {
    var that = this;
    var corners = [], mat, i = 1, scale, offset={};
    const number_of_frames_to_ignore = 6;
    var pool = new Pool()
    var camera_ctx = wx.createCameraContext();
    quadrangle = []
    quadrangle_to_show = tools.get_default_quadrangle_to_show()

    scene_painter.clear_scene()
    detector.clear_max_quadrangle()
    main_painter.clear()
    wx.hideLoading()

    listener = camera_ctx.onCameraFrame((frame) =>{
      if (i == 65000) {i=0}
      if (i == 1) {
        var camera_size = {width: frame.width, height: frame.height}
        offset = tools.get_offset_from_canvas_to_camera(that.data.canvas_size, camera_size)
        scale = tools.get_scale_from_canvas_to_camera(that.data.canvas_size, camera_size)
      }
      if (i++%number_of_frames_to_ignore == 0) {
        mat = tools.toMat(frame)
        // hls = detector.get_hls(mat)
        corners = detector.detect(mat, offset)
        quadrangle = tools.deep_copy(detector.get_max_quadrangle(corners))
        if (quadrangle.length != 0) {
          tools.scale_points(quadrangle, scale, offset)
          pool.insert(quadrangle)
        }  
        mat.delete()
      }
      if (quadrangle.length != 0) {
        pool.shift_next_step(quadrangle_to_show, quadrangle)
      }
      that.draw()
    })
    listener.start()
    this.setData({
      mode: "AR"
    })
  },

  // to Pic

  to_pic: function() {
    if (listener != undefined) { listener.stop() }
    tools.choose_image()
  },

  close_crop: function() {
    if (this.data.setting_custom_scene == true) {
      this.setData({
        simple_crop_show: false,
        setting_custom_scene: false
      })
    } else {
      this.setData({
        simple_crop_show: false,
        mode: 'AR'
      })
    }
  },

  crop_complete: function(e) {
    scene_painter.clear_scene()
    scene_id = -1
    this.setData({
      current_scene_id: scene_id
    })
    if (this.data.setting_custom_scene == true) {
      this.setData({
        simple_crop_show: false,
        setting_custom_scene: false
      })
      custom_scene = e.detail.resultSrc
      this.set_scene(-1)
    } else {
      var that = this
      main_painter.set_croped_image(e.detail.resultSrc)
      this.setData({
        croped_image: e.detail.resultSrc,
        simple_crop_show: false
      })

      wx.uploadFile({
        url: 'http://47.99.244.218:8010/',
        filePath: e.detail.resultSrc,
        name: 'file',
        formData: {
          'type': 'pic'
        },
        success (e){
          quadrangle = detector.get_max_quadrangle(JSON.parse(e.data))
          quadrangle_to_show = tools.deep_copy(quadrangle)
          raw_quadrangle = tools.deep_copy(quadrangle_to_show)
          that.draw()
        },
        complete(e){
          console.log(e)
        }
      })
    }
  },

  // touch and swipe on canvas

  touch_start: function (e) {
    if (tools.in_pic_mode()) {
      if (e.touches.length == 1) {
        moving_point_index = move_tools.get_touched_point_index(quadrangle_to_show, e.touches[0])
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
          if (moving_point_index == move_mode) {
            // 拖动
            var move_offset = move_tools.get_move_offset(e.touches[0])
            move_tools.move_shift(quadrangle_to_show, move_offset)
          } else {
            // 拖拽角点
            var move_offset = move_tools.get_move_offset(e.touches[0])
            move_tools.point_shift(quadrangle_to_show, raw_quadrangle, move_offset, moving_point_index)
          }
        }
        } else {
          // 缩放
          let scale_offset = move_tools.get_scale_offset(e.touches)
          cardboard_size = move_tools.scale(quadrangle_to_show, scale_offset, cardboard_size)
          frame_size = move_tools.scale(quadrangle_to_show, scale_offset, frame_size)
          // console.log(scale_offset, cardboard_size, frame_size)
          move_tools.scale_shift(quadrangle_to_show, scale_offset)
        }
        this.draw()
    }
  },

  touch_end: function (e) {
    if (tools.in_pic_mode()) {
      moving_point_index = false
    }
  },

  // operate handler
  
  slider_change: function(e) {
    if (e.detail.value != 0){
      if (this.data.current_choose_panel == 0) {
        frame_size = e.detail.value
      } else if (this.data.current_choose_panel == 1){
        cardboard_size = e.detail.value
      }
      this.draw()  
    }
  },

  tap_intro_button: function() {
    wx.navigateTo({
      url: '../intro/intro?frame_id=' + this.data.current_frame_id,
    })
  },

  intelligent_recommend: function () {
    var that = this
    cv.imread(this.data.croped_image, function(mat) {
      hue = detector.get_hls(mat)[0]
      that.tap_to_change_frame({currentTarget: {dataset: {frame_id: tools.find_closest_by_value(frames_hue, hue)}}})
    })
  },

  tap_camera: function () {
    if (tools.in_pic_mode()){
      tools.choose_image()
      this.setData({
        setting_custom_scene: true
      })
    }
  },

  tap_random_choose: function (e) {
    var type = e.currentTarget.dataset.type
    if (type == "frames_and_cards") {
      type = "frames"
      tools.random_choose(type)
      type = "cards"
      tools.random_choose(type)
    } else {
      tools.random_choose(type)
    }
  },

  tap_to_change_choose_panel: function(e) {
    var panel_id = parseInt(e.currentTarget.dataset.panel_id)
    this.setData({
      current_choose_panel: panel_id
    })
  },

  tap_to_change_frame: function(e) {
    frame_id = parseInt(e.currentTarget.dataset.frame_id)
    tools.set_frame(frame_id)
  },

  tap_to_change_card: function(e) {
    card_id = parseInt(e.currentTarget.dataset.card_id)
    tools.set_card(card_id)
  },

  tap_to_change_scene: function(e) {
    if (tools.in_pic_mode()) {
      var new_scene_id = parseInt(e.currentTarget.dataset.scene_id)
      this.set_scene(new_scene_id)
    }
  },

  scan_code: function () {
    var that = this
    wx.scanCode({
      success (res) {
        var data = JSON.parse(res.result)
        var type = Object.keys(data)[0]
        if (type == "frames") {
          tools.set_frame(data["frames"])
        } else if (type == "cards") {
          tools.set_card(data["frames"])
        } else if (type == "scenes") {
          that.set_scene(data["scenes"])
        }
      }
    })
  },

  correct: function () {
    move_tools.correct(quadrangle_to_show)
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
      await save_painter.draw(cvs_work, ctx_work, frame_size, cardboard_size, hls, quadrangle_to_show, raw_quadrangle)
      save_painter.save()
    }
  },

  onShow: function () {
    if (app.globalData.card_id != -1) {
      card_id = app.globalData.card_id
      this.set_patterns()
      this.setData({
        current_card_id: card_id
      })  
      app.globalData.card_id = -1
    }
  },

  onLoad: function () {
    // wx.showLoading({title: '加载中'})
    
    app.globalData.card_id = -1
    tools.set_this(this)
    this.load_cvs_ctx_and_initial()
    tools.load_frames("http://47.99.244.218:8090")
    tools.load_cards ("http://47.99.244.218:8090")
    tools.load_scenes("http://47.99.244.218:8090")
    tools.load_album ("http://47.99.244.218:8090")
    tools.set_canvas_size()

    setTimeout(() => {
      // this.getwasm()
    }, 1000);
  },

  // tools

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

  set_frame: function (frame_id) {
    this.setData({
      current_frame_id: frame_id
    })
    this.set_patterns()
  },

  set_card: function (card_id) {
    this.setData({
      current_card_id: card_id
    })
    this.set_patterns()
  },

  set_scene: function (new_scene_id) {
    if (new_scene_id == -1) {
      scene_painter.set_scene(custom_scene,quadrangle_to_show)
    } else if (scene_id != new_scene_id) {
      scene_id = new_scene_id
      scene_painter.set_scene(this.data.scenes[scene_id]["img"], quadrangle_to_show)
    } else {
      scene_id = -1
      scene_painter.clear_scene()
    }
    this.setData({
      current_scene_id: scene_id
    })
  },

  draw: function () {
    main_painter.clear()
    if (tools.quadrangle_is_ready(quadrangle_to_show)) {
      main_painter.draw_frame(quadrangle_to_show, frame_size, cardboard_size, hls)
      if (tools.in_pic_mode()) {
        main_painter.draw_framed_image(quadrangle_to_show, raw_quadrangle)
      }
    }
  },
})
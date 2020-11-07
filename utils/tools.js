var cv
var that
var loaded_count = 0

function set_cv(cv_input) {
    cv = cv_input
}

function set_this(this_input) {
    that = this_input
}

function set_canvas_size() {
    wx.getSystemInfo({
        complete: (res) => {
        var canvasHeight = res.windowHeight - res.windowWidth/2
        that.setData({
            canvas_size: {
            width: res.windowWidth,
            height: canvasHeight
            }
        })
        },
    })
}

function scale_points(points, scale, offset) { 
    for (let i = 0; i < points.length; i++) { 
        points[i].x = points[i].x * scale + offset.x
        points[i].y = points[i].y * scale + offset.y
    }
    return points
}

function load_ctx(id, setData) {
    const dpr = wx.getSystemInfoSync().pixelRatio
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
  }

function load_data() {
    wx.request({
        url: 'http://47.99.244.218:8090/api/v2/pages/?type=frame.FramePage&fields=*',
        method: 'GET',
        success: function (res) {
            console.log(res)
      }
    })
}

function load_frames(site) {
    wx.request({
        url: site + '/api/v2/pages/?type=frame.FramePage&fields=*',
        method: 'GET',
        success: function (res) {
            var frames = {}
            res.data.items.forEach(i => {
                frames[i.id] = {
                    id: i.id,
                    prev: site + i.prev.meta.download_url,
                    bottom: site + i.bottom.meta.download_url,
                    top: site + i.top.meta.download_url,
                    content: i.content
                }
            }); 
            that.setData({
                frames: frames
            })
            loaded_count++
            check_and_set_patterns()
        }
    })
}

function load_cards(site) {
    wx.request({
        url: site + '/api/v2/pages/?type=frame.CardPage&fields=*',
        method: 'GET',
        success: function (res) {
            var cards = {}
            res.data.items.forEach(i => {
                cards[i.id] = {
                    id: i.id,
                    prev: site + i.prev.meta.download_url,
                    img: site + i.img.meta.download_url,
                }
            }); 
            that.setData({
                cards: cards
            })
            loaded_count++
            check_and_set_patterns()
        }
    })
}

function load_scenes(site) {
    wx.request({
        url: site + '/api/v2/pages/?type=frame.ScenePage&fields=*',
        method: 'GET',
        success: function (res) {
            var scenes = {}
            res.data.items.forEach(i => {
                scenes[i.id] = {
                    id: i.id,
                    prev: site + i.prev.meta.download_url,
                    img: site + i.img.meta.download_url,
                }
            }); 
            that.setData({
                scenes: scenes
            })
            loaded_count++
            check_and_set_patterns()
        }
    })
}

function check_and_set_patterns() {
    if (loaded_count == 3) {
        setTimeout(() => {
            that.set_patterns()
        }, 500);
    }
}

function get_offset_from_canvas_to_camera(canvas_size, camera_size) {
    if (wx.getSystemInfoSync().platform == "devtools") {
        scale = canvas_size.height/camera_size.height
        Xoffset = (canvas_size.width-scale*camera_size.width)/2
        Yoffset = 0
    } else {
        scale = canvas_size.width/camera_size.width
        Yoffset = (canvas_size.height-scale*camera_size.height)/2
        Xoffset = 0
    }
    return {
        x: Xoffset,
        y: Yoffset,
    }
}

function get_scale_from_canvas_to_camera(canvas_size, camera_size) {
    if (wx.getSystemInfoSync().platform == "devtools") {
        scale = canvas_size.height/camera_size.height
    } else {
        scale = canvas_size.width/camera_size.width
    }
    return scale
}

function toMat(frame) {
    return cv.matFromImageData({
      data:new Uint8ClampedArray(frame.data),
      width:frame.width,
      height:frame.height
    });
}

function quadrangle_is_ready(quadrangle) {
    return quadrangle != undefined && quadrangle.length == 4
}

function in_pic_mode() {
    return that.data.mode == "pic"
}

function random_choose(type) {
    var ids = Object.keys(that.data[type])
    var randomElement = ids[Math.floor(Math.random() * ids.length)];
    var e = {}
    if (type == "frames") {
        e = {currentTarget: {dataset: {frame_id: randomElement}}}
        that.tap_to_change_frame(e)
    } else if (type == "cards") {
        e = {currentTarget: {dataset: {card_id: randomElement}}}
        that.tap_to_change_card(e)
    } else if (type == "scenes" && scene_id != randomElement) {
        e = {currentTarget: {dataset: {scene_id: randomElement}}}
        that.tap_to_change_scene(e)
    }
}

function get_default_quadrangle() {
    return [
        {x: 100, y:100},
        {x: 100, y:that.data.canvas_size.height-100},
        {x: that.data.canvas_size.width-100, y:that.data.canvas_size.height-100},
        {x: that.data.canvas_size.width-100, y:100},
    ]
}

function deep_copy(obj) {
    return JSON.parse(JSON.stringify(obj))
}

function choose_image() {
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
}

module.exports = {
    set_cv: set_cv,
    set_this: set_this,

    load_ctx: load_ctx,
    load_data: load_data,
    load_frames: load_frames,
    load_cards: load_cards,
    load_scenes: load_scenes,

    get_offset_from_canvas_to_camera: get_offset_from_canvas_to_camera,
    get_scale_from_canvas_to_camera:
    get_scale_from_canvas_to_camera,

    toMat: toMat,
    set_canvas_size: set_canvas_size,
    scale_points: scale_points,
    quadrangle_is_ready: quadrangle_is_ready,
    in_pic_mode: in_pic_mode,
    random_choose: random_choose,
    get_default_quadrangle: get_default_quadrangle,
    deep_copy: deep_copy,
    choose_image: choose_image
}
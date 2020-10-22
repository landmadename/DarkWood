var cv

function set_cv(cv_input) {
    cv = cv_input
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

function load_frames(site, that) {
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
        }
    })
}

function load_cards(site, that) {
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
        }
    })
}

function load_scenes(site, that) {
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
        }
    })
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

module.exports = {
    set_cv: set_cv,

    load_data: load_data,
    load_frames: load_frames,
    load_cards: load_cards,
    load_scenes: load_scenes,

    get_offset_from_canvas_to_camera: get_offset_from_canvas_to_camera,
    get_scale_from_canvas_to_camera:
    get_scale_from_canvas_to_camera,

    toMat: toMat,
}
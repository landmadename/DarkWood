const tools = require("../../utils/tools")
const app = getApp()

Page({

  data: {

  },

  prev_img: function (e) {
    wx.previewImage({
      current: e.target.dataset.src,
      urls: [e.target.dataset.src]
    })
  },

  try_collocation: function (e) {
    app.globalData.card_id = e.currentTarget.dataset.card_page
    wx.navigateBack({})
  },

  onLoad: function (options) {
    var frame_id = options["frame_id"]
    var content = app.globalData.frames[frame_id]["content"]
    var history = app.globalData.frames[frame_id]["history"]
    content = tools.parse_content(content)
    history = tools.parse_history(history)
    this.setData({
      content: content,
      history: history
    })
  },
})
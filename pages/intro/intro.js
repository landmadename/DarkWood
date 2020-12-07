const tools = require("../../utils/tools")
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
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

  /**
   * 生命周期函数--监听页面加载
   */
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

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    
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
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

module.exports = {
    load_data: load_data,
    load_frames: load_frames,
    load_cards: load_cards
}
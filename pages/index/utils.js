function draw_demo(id) {
  const query = wx.createSelectorQuery()
  query.select(id)
    .fields({ node: true, size: true })
    .exec((res) => {
      const canvas = res[0].node
      const ctx = canvas.getContext('2d')

      const dpr = wx.getSystemInfoSync().pixelRatio
      canvas.width = res[0].width * dpr
      canvas.height = res[0].height * dpr
      ctx.scale(dpr, dpr)

      ctx.fillStyle ='white'
      ctx.fillRect(0, 0, 1000, 1000)

      ctx.arc(100, 75, 50, 0, 2 * Math.PI)
      ctx.fillStyle ='#e0ece4'
      ctx.fill()
      
      ctx.beginPath()
      ctx.moveTo(40, 75)
      ctx.lineTo(160, 75)
      ctx.moveTo(100, 15)
      ctx.lineTo(100, 135)
      ctx.strokeStyle = '#AAAAAA'
      ctx.stroke()
      
      ctx.fontSize = 12
      ctx.fillStyle = 'black'
      ctx.fillText('0', 165, 78)
      ctx.fillText('0.5*PI', 83, 145)
      ctx.fillText('1*PI', 15, 78)
      ctx.fillText('1.5*PI', 83, 10)
    })
}

module.exports = {
  draw_demo: draw_demo
}
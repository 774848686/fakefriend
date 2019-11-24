const app = getApp();
const MAX_IMG_LENGTH = 9;
Page({
  /**
   * 页面的初始数据
   */
  data: {
    dataSource: [{
      name: '',
      icon: '',
      content: '',
      resource: []
    }],
    photoWidth: wx.getSystemInfoSync().windowWidth / 5
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {},
  onShow() {
    let dataSource = JSON.parse(wx.getStorageSync('sendInfo') || '[]');
    this.setData({
    dataSource})
  },
  // 点击图片进行大图查看
  LookPhoto(e) {
    const {dataset:{photurl, imgsource}} = e.currentTarget
    wx.previewImage({
      current: photurl,
      urls: imgsource
    })
  },
  showAlbomn(){
    wx.showModal({
      title: '提示',
      content: '选择相册',
      success (r) {
        if (r.confirm) {
          wx.chooseImage({
            count: MAX_IMG_LENGTH, // 默认9  
            sizeType: ['original'], // 可以指定是原图还是压缩图，默认二者都有  
            sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有  
            success(res) {
              if (res.tempFilePaths.length > 0) {
                wx.navigateTo({
                  url: '/pages/release/index',
                  success: function(rs) {
                    // 通过eventChannel向被打开页面传送数据 注意要在json文件里配置 "usingComponents": {}
                    rs.eventChannel.emit('acceptDataFromOpenedPage', { img_url: res.tempFilePaths })
                  }
                })
              }
            }
          })
        } else if (r.cancel) {
          console.log('用户点击取消')
        }
      }
    })
  },

  // 删除朋友圈
  delete(e) {
    const {dataset:{index}} = e.currentTarget
    let {dataSource} = this.data
    dataSource.splice(index, 1)
    this.setData({
    dataSource}, () => {
      wx.setStorage({
        key:"sendInfo",
        data:JSON.stringify(dataSource)
      });
      wx.showToast({
        title: '删除成功'
      })
    })
  }
})

const MAX_IMG_LENGTH = 9
Page({
  data: {
    img_url: [],
    content: '',
    hidden: true,
    flag: false,
    x: 0,
    y: 0,
    elements: [],
    longTapIndex: 0,
    moveareaHeight: '',
    moveareaWidth: '',
    moveviewLeft: 0,
    moveviewTop: 0,
    viewImg: '',
    isOpen:false
  },
  onLoad(options) {
   const eventChannel = this.getOpenerEventChannel();
    // 监听acceptDataFromOpenerPage事件，获取上一页面通过eventChannel传送到当前页面的数据
    eventChannel.on('acceptDataFromOpenedPage', (data)=> {
      this.setData({
        isOpen:true
      });
      const {img_url} = data;
      this.setData({
        img_url
      });
      // 为了解决在页面跳转间 dom元素获取为空 不可排序bug
      setTimeout(res=>{
        this.elementsQuery('.item').then(elements => {
          this.setData({
            elements
          })
        });
      },100)
    })
  },
  onHide(){
    let {content,img_url} = this.data;
    let userInfo = {
      icon:'http://aliimg.changba.com/cache/photo/153031874_640_640.jpg',
      name:'Devin'
    };
    let source = {content,img_url,...userInfo}
    this.setStore('editInfo',source);
  },
  onShow(){
    if(this.data.isOpen){
      this.setStore('editInfo',[]);
      return;
    };
    this.setData({
      ...this.getStore('editInfo')
    });
  },
  input (e) {
    this.setData({
      content: e.detail.value
    })
  },
  // 获取元素的属性
  createSelectorQuery(selector) {
    let query = wx.createSelectorQuery()
    return new Promise(resolve => {
      query.select(selector).boundingClientRect(rect => {
        resolve({
          width: rect.width,
          height: rect.height
        })
      }).exec()
    })
  },
  // 获取dom 集合
  elementsQuery(selector) {
    let query = wx.createSelectorQuery();
    return new Promise(resolve => {
      query.selectAll(selector).fields({
        dataset: true,
        rect: true
      }, (result) => {
        resolve(result)
      }).exec()
    })
  },
  chooseimage() {
    var that = this
    wx.chooseImage({
      count: MAX_IMG_LENGTH - this.data.img_url.length, // 默认9  
      sizeType: ['original'], // 可以指定是原图还是压缩图，默认二者都有  
      sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有  
      success(res) {
        if (res.tempFilePaths.length > 0) {
          that.createSelectorQuery('.image_content').then(res => {
            const {width, height} = res
            that.moveareaHeight = `${height}px`
            that.moveareaWidth = `${width}px`
          })
          that.setData({
            img_url: [...that.data.img_url, ...res.tempFilePaths]
          });
            that.elementsQuery('.item').then(rs => {
              that.setData({
                elements: rs
              })
            })
        }
        // 图如果满了9张，不显示加图
        that.setData({
          hideAdd: that.data.img_url.length === MAX_IMG_LENGTH
        })
      }
    })
  },
  // 发布按钮事件
  send: function () {
    wx.showLoading({
      title: '发布中'
    });
    setTimeout(()=>{
      this.submit()
    },1000)
    
  },
  // 发布逻辑
  submit () {
    let {content,img_url} = this.data;
    let userInfo = {
      icon:'http://aliimg.changba.com/cache/photo/153031874_640_640.jpg',
      name:'Devin'
    };
    let source = [{content,img_url,...userInfo}]
    this.setStore('sendInfo',source);
    wx.hideLoading();
    wx.navigateBack({
      delta: 1
    });
  },
  setStore(key,source){
    wx.setStorage({
      key,
      data:JSON.stringify(source)
    });
  },
  getStore(key){
    return JSON.parse(wx.getStorageSync(key)) || {};
  },
  deletePic(e){
    let images = this.data.img_url
    let index = e.currentTarget.dataset.index;
    images.splice(index, 1);
    this.setData({
      img_url: images
    })
  },
  // 长按
  _longtap(e) {
    const detail = e.detail
    const {offsetLeft, offsetTop, dataset:{index}} = e.currentTarget
    this.setData({
      hidden: false,
      longTapIndex: index,
      viewImg: this.data.img_url[index],
      flag: true
    });
  },
  // 触摸开始
  touchs: function (e) {
    this.setData({
      beginIndex: e.currentTarget.dataset.index
    });
    this.calculateOffset( e.currentTarget.dataset.index);
  },
  // 触摸结束
  touchend(e) {
    this.setData({
      viewImg: '',
      hidden: true,
    })
    const x = e.changedTouches[0].pageX
    const y = e.changedTouches[0].pageY
    const beginIndex = this.data.beginIndex;
    let list = this.data.elements;
    let data = this.data.img_url;
    for (let j = 0; j < list.length; j++) {
      const item = list[j];
      // 这里的item.left item.right 是指节点的左右边界坐标
      if (x > item.left && x < item.right && y > item.top && y < item.bottom) {
        const endIndex = item.dataset.index;
        // 每一個图片进行前移 两两进行交换
        if (beginIndex < endIndex) {
          let temp = data[beginIndex]
          for (let i = beginIndex; i < endIndex; i++) {
            data[i] = data[i + 1]
          }
          data[endIndex] = temp
        }
        // 每个图片进行后移 两两进行交换
        if (beginIndex > endIndex) {
          let temp = data[beginIndex]
          for (let i = beginIndex; i > endIndex; i--) {
            data[i] = data[i - 1]
          }
          data[endIndex] = temp;
        }
      }
    }
    this.setData({
      flag: false,
      img_url: data
    })
  },
  touchMove(e) {
    let x = e.touches[0].pageX
    let y = e.touches[0].pageY
    this.setData({
      x: x - 75,
      y: y - 140
    })
  },
  // 滑动
  touchm (e) {
    let x = e.touches[0].pageX
    let y = e.touches[0].pageY
    this.setData({
      x: x - 75,
      y: y - 140
    })
  },
  // 计算每一个move-view 的left top
  calculateOffset(index) {
    this.createSelectorQuery('.image').then(res => {
      const {width, height} = res
      const isfloor = Math.floor(index / 3)
      this.setData({
        x: `${width*index+index*10}px`,
        y: `${height*isfloor+isfloor*10}px`
      })
    })
  },
    // 点击图片进行大图查看
    viewImgs(e) {
      const {dataset:{photurl, imgsource}} = e.currentTarget
      wx.previewImage({
        current: photurl,
        urls: imgsource
      })
    },
})

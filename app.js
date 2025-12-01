// app.js
App({
  onLaunch() {
    // 获取用户位置权限
    wx.getSetting({
      success: (res) => {
        if (!res.authSetting['scope.userLocation']) {
          wx.authorize({
            scope: 'scope.userLocation',
            success: () => {
              console.log('位置授权成功');
            },
            fail: () => {
              console.log('位置授权失败');
            }
          });
        }
      }
    });
  },
  globalData: {
    userInfo: null,
    // 南京市中心坐标
    nanjingCenter: {
      latitude: 32.0603,
      longitude: 118.7969
    },
    // 南京著名景点数据
    attractions: [
      {
        id: 1,
        name: '中山陵',
        latitude: 32.0586,
        longitude: 118.8485,
        address: '南京市玄武区石象路7号',
        description: '中山陵是中国近代伟大的民主革命先行者孙中山先生的陵寝，位于南京市玄武区紫金山南麓钟山风景名胜区内，是全国重点文物保护单位。',
        category: '历史文化',
        rating: 4.8,
        image: '/images/zhongshanling.jpg',
        openTime: '08:30-17:00',
        ticket: '免费（需预约）'
      },
      {
        id: 2,
        name: '夫子庙',
        latitude: 32.0227,
        longitude: 118.7880,
        address: '南京市秦淮区秦淮河畔',
        description: '夫子庙是中国四大文庙之一，位于南京市秦淮区，是中国最大的传统古街市，与秦淮河相邻，是南京历史文化的重要象征。',
        category: '历史文化',
        rating: 4.6,
        image: '/images/fuzimiao.jpg',
        openTime: '09:00-22:00',
        ticket: '免费'
      },
      {
        id: 3,
        name: '玄武湖',
        latitude: 32.0773,
        longitude: 118.7942,
        address: '南京市玄武区玄武巷1号',
        description: '玄武湖是中国最大的皇家园林湖泊，也是中国仅存的江南皇家园林，被誉为"金陵明珠"。',
        category: '自然风光',
        rating: 4.7,
        image: '/images/xuanwuhu.jpg',
        openTime: '06:00-21:00',
        ticket: '免费'
      },
      {
        id: 4,
        name: '明孝陵',
        latitude: 32.0582,
        longitude: 118.8350,
        address: '南京市玄武区紫金山南独龙阜玩珠峰下',
        description: '明孝陵是明朝开国皇帝朱元璋和皇后马氏的合葬陵墓，是中国规模最大的帝王陵寝之一，被列为世界文化遗产。',
        category: '历史文化',
        rating: 4.7,
        image: '/images/mingxiaoling.jpg',
        openTime: '06:30-18:00',
        ticket: '70元'
      },
      {
        id: 5,
        name: '总统府',
        latitude: 32.0468,
        longitude: 118.7957,
        address: '南京市玄武区长江路292号',
        description: '总统府是中国近代建筑遗存中规模最大、保存最完整的建筑群，既有中国古代传统的建筑，又有西式风格的建筑。',
        category: '历史文化',
        rating: 4.6,
        image: '/images/zongtongfu.jpg',
        openTime: '08:30-17:00',
        ticket: '40元'
      },
      {
        id: 6,
        name: '南京博物院',
        latitude: 32.0436,
        longitude: 118.8218,
        address: '南京市玄武区中山东路321号',
        description: '南京博物院是中国三大博物馆之一，设有六大馆，藏有各类文物42万余件，是了解中国历史文化的重要场所。',
        category: '博物馆',
        rating: 4.8,
        image: '/images/bowuyuan.jpg',
        openTime: '09:00-17:00（周一闭馆）',
        ticket: '免费（需预约）'
      },
      {
        id: 7,
        name: '鸡鸣寺',
        latitude: 32.0658,
        longitude: 118.7954,
        address: '南京市玄武区鸡鸣寺路1号',
        description: '鸡鸣寺始建于西晋，是南京最古老的佛教寺庙之一，素有"南朝第一寺"之称，每年春季樱花盛开时景色尤为美丽。',
        category: '宗教建筑',
        rating: 4.5,
        image: '/images/jimingsi.jpg',
        openTime: '07:00-17:00',
        ticket: '10元'
      },
      {
        id: 8,
        name: '南京长江大桥',
        latitude: 32.1152,
        longitude: 118.7339,
        address: '南京市鼓楼区',
        description: '南京长江大桥是长江上第一座由中国自行设计和建造的双层式铁路、公路两用桥梁，是20世纪60年代中国建桥史上的重要里程碑。',
        category: '现代建筑',
        rating: 4.5,
        image: '/images/changjiangdaqiao.jpg',
        openTime: '全天开放',
        ticket: '免费'
      },
      {
        id: 9,
        name: '侵华日军南京大屠杀遇难同胞纪念馆',
        latitude: 32.0316,
        longitude: 118.7376,
        address: '南京市建邺区水西门大街418号',
        description: '这是为铭记侵华日军攻占南京后制造的南京大屠杀而建立的遗址型专史纪念馆，是国家公祭日活动举办地。',
        category: '纪念馆',
        rating: 4.9,
        image: '/images/jinianguan.jpg',
        openTime: '08:30-16:30（周一闭馆）',
        ticket: '免费（需预约）'
      },
      {
        id: 10,
        name: '老门东',
        latitude: 32.0170,
        longitude: 118.7880,
        address: '南京市秦淮区剪子巷',
        description: '老门东是南京老城南传统民居生活街区，保留了明清时期的街巷格局和建筑风貌，是体验南京传统文化的好去处。',
        category: '历史街区',
        rating: 4.5,
        image: '/images/laomendong.jpg',
        openTime: '全天开放',
        ticket: '免费'
      }
    ]
  }
});

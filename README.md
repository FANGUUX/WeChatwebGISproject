# WeChatwebGISproject

智慧旅游微信小程序 - 基于 WebGIS 的智能景点推荐与路线规划系统

## 项目概述

本项目是一个面向游客的智慧旅游微信小程序，提供智能景点推荐、路线规划、周边美食发现等功能。

## 功能模块

### 1. 用户账户与管理 (User Accounts & Management)
- **注册登录 (Registration and Login)**: 支持微信一键登录和手机号密码登录
- **个人资料管理 (Personal Profile Management)**: 用户可以编辑昵称、头像、性别、生日等信息
- **行为与偏好采集 (User Behavior and Preference Collection)**: 自动记录用户浏览、搜索、访问行为，支持偏好设置

### 2. 智能景点推荐 (Intelligent Attraction Recommendation)
- 基于多源数据生成 TOP10 推荐列表：
  - **天气因素**: 根据当前天气推荐适合的景点
  - **客流数据**: 实时展示景点拥挤程度
  - **评分数据**: 综合用户评价进行推荐
- 支持按分类浏览和搜索

### 3. 智能路线规划 (Intelligent Route Planning)
- **多点路径优化**: 自动优化多个景点的访问顺序
- **多模态交通方式**: 支持步行、骑行、驾车、公交等出行方式
- **实时动态调整**: 根据用户当前位置实时更新路线

### 4. 周边美食发现 (Surrounding Food Discovery)
- 基于用户位置推荐附近美食商家
- 支持按菜系筛选
- 结合用户偏好进行个性化推荐

### 5. 系统支撑与接口 (System Support & Interfaces)
- **数据管理**: 景点、美食商家数据的增删改查
- **用户权限控制**: 基于角色的权限管理（普通用户、管理员）
- **第三方服务集成**: 天气 API、地图 API 集成

## 项目结构

```
WeChatwebGISproject/
├── server/                     # 后端服务
│   ├── config/                 # 配置文件
│   ├── controllers/            # 控制器
│   ├── middleware/             # 中间件
│   ├── models/                 # 数据模型
│   ├── routes/                 # 路由
│   ├── services/               # 业务服务
│   ├── utils/                  # 工具函数
│   ├── app.js                  # 应用入口
│   └── package.json
│
├── miniprogram/                # 微信小程序前端
│   ├── pages/                  # 页面
│   │   ├── index/              # 首页
│   │   ├── user/               # 用户相关页面
│   │   ├── recommendation/     # 推荐相关页面
│   │   ├── route/              # 路线相关页面
│   │   └── food/               # 美食相关页面
│   ├── services/               # API 服务
│   ├── utils/                  # 工具函数
│   ├── app.js                  # 小程序入口
│   ├── app.json                # 小程序配置
│   └── app.wxss                # 全局样式
│
└── project.config.json         # 项目配置
```

## 技术栈

### 后端
- **Node.js + Express**: Web 服务框架
- **MongoDB + Mongoose**: 数据库
- **JWT**: 用户认证
- **bcryptjs**: 密码加密

### 前端
- **微信小程序原生框架**: 页面开发
- **WXML/WXSS**: 页面结构和样式
- **地图组件**: 路线展示和导航

## 快速开始

### 后端启动

```bash
cd server
npm install
cp .env.example .env  # 配置环境变量
npm start
```

### 小程序开发

1. 使用微信开发者工具导入项目
2. 配置 `miniprogram/services/api.js` 中的 `BASE_URL`
3. 配置 `project.config.json` 中的 `appid`

## API 接口

### 用户接口
- `POST /api/v1/user/login/wechat` - 微信登录
- `POST /api/v1/user/register` - 手机号注册
- `POST /api/v1/user/login` - 手机号登录
- `GET /api/v1/user/profile` - 获取用户资料
- `PUT /api/v1/user/profile` - 更新用户资料
- `PUT /api/v1/user/preferences` - 更新用户偏好

### 推荐接口
- `GET /api/v1/recommendations` - 获取 TOP10 推荐
- `GET /api/v1/recommendations/personalized` - 获取个性化推荐
- `GET /api/v1/recommendations/nearby` - 获取附近景点
- `GET /api/v1/recommendations/attractions/:id` - 获取景点详情

### 路线接口
- `POST /api/v1/routes` - 创建路线
- `GET /api/v1/routes` - 获取用户路线列表
- `GET /api/v1/routes/:id` - 获取路线详情
- `POST /api/v1/routes/:id/waypoints` - 添加路径点
- `POST /api/v1/routes/:id/optimize` - 优化路线
- `POST /api/v1/routes/:id/multimodal` - 设置多模态交通

### 美食接口
- `GET /api/v1/food/nearby` - 发现附近美食
- `GET /api/v1/food/cuisines` - 获取菜系列表
- `GET /api/v1/food/:id` - 获取餐厅详情

### 管理接口
- `GET /api/v1/admin/users` - 获取用户列表
- `PUT /api/v1/admin/users/:id/status` - 更新用户状态
- `POST /api/v1/admin/attractions` - 创建景点
- `POST /api/v1/admin/food` - 创建美食商家

## 许可证

MIT
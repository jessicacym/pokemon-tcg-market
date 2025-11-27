# Pokemon TCG Card Trade Market

一个基于 Pokemon TCG API 的宝可梦卡牌交易市场应用。

## 功能特点

✨ **三大核心功能**：
- 🔍 **卡片搜索** - 按名称和稀有度搜索宝可梦卡片
- ❤️ **收藏功能** - 收藏喜欢的卡片，方便随时查看
- 📊 **价格提醒** - 设置价格提醒，追踪卡片价格变化

## 技术栈

- **前端**: HTML, CSS, JavaScript
- **后端**: Node.js, Express
- **API**: Pokemon TCG API (https://pokemontcg.io/)
- **特性**:
  - 双层缓存系统（前端 + 后端）
  - 自动重试机制
  - 响应式设计

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 API 密钥

创建 `.env` 文件并添加您的 Pokemon TCG API 密钥：

```env
POKEMON_TCG_API_KEY=your_api_key_here
```

> 在 https://pokemontcg.io/ 获取免费 API 密钥

### 3. 启动服务器

```bash
npm start
```

服务器将在 http://localhost:3000 启动

## 项目结构

```
pokemon-tcg/
├── public/
│   ├── index.html          # 主页面
│   └── test-api.html       # API 测试页面
├── server.js               # Express 服务器
├── package.json            # 项目配置
├── .env.example            # 环境变量示例
└── README.md               # 项目说明
```

## 功能说明

### 搜索卡片
- 支持按卡片名称搜索
- 支持按稀有度筛选
- 智能缓存，重复搜索瞬间显示

### 收藏管理
- 添加/删除收藏
- 查看收藏列表
- 数据持久化

### 价格提醒
- 设置目标价格
- 启用/禁用提醒
- 管理所有提醒

## 性能优化

- ⚡ **首次搜索**: 1-3 秒
- ⚡ **缓存搜索**: < 0.1 秒
- 🔄 **自动重试**: 最多 3 次
- 💾 **缓存时长**: 5 分钟

## 注意事项

- Pokemon TCG API 有时会响应较慢，请耐心等待
- 建议使用 API 密钥以获得更高的速率限制
- 首次搜索可能需要较长时间，但结果会被缓存

## 许可证

ISC

## 作者

Created with ❤️ using Pokemon TCG API

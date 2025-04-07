# 使用官方 Nuxt 3 镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 lock 文件
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制所有文件
COPY . .

# 生成 Nuxt 构建
RUN npm run build

# 设置环境变量
ENV REDIS_ENABLED=false
ENV REDIS_URL=redis://localhost:6379

# 运行 Nuxt
CMD ["npm", "run", "start"]

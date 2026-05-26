# Node.js 18 환경 (alpine = 용량 작은 버전)
FROM node:18-alpine 

# 컨테이너 안에서 /app 폴더에서 작업
WORKDIR /app

# package.json 먼저 복사
COPY package*.json ./

# 패키지 설치
RUN npm install --production

# 나머지 코드 전부 복사
COPY . .

# 8080 포트 열기
EXPOSE 8080

# 서버 실행
CMD ["node", "index.js"]
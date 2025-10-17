# 🚀 भू-अभिलेख - Land Records Management System

## 📋 प्रोजेक्ट जानकारी

**एप्लिकेशन नाम:** भू-अभिलेख  
**वर्जन:** 1.0.0  
**टेक्नोलॉजी:** Next.js 15 + TypeScript + Tailwind CSS + Prisma

## 🌟 मुख्य फीचर्स

- 🔐 User Authentication (Login/Signup)
- 📁 Project Management
- 📊 Land Records Management
- 📈 Data Visualization (Charts & Graphs)
- 📤 Excel Import/Export
- 📱 Responsive Design
- 🇮🇳 Hindi Language Support

## 🛠️ टेक्नोलॉजी स्टैक

- **Frontend:** Next.js 15, React 19, TypeScript
- **Styling:** Tailwind CSS, shadcn/ui
- **Database:** Prisma ORM, SQLite
- **Authentication:** NextAuth.js
- **Charts:** Recharts
- **File Handling:** XLSX library

## 🚀 डिप्लॉयमेंट गाइड

### 1. प्री-रिक्वायरमेंट्स

```bash
# Node.js version 18+ आवश्यक
node --version

# npm version 9+ आवश्यक
npm --version
```

### 2. प्रोजेक्ट सेटअप

```bash
# 1. प्रोजेक्ट क्लोन करें
git clone <your-repo-url>
cd your-project-name

# 2. डिपेंडेंसी इंस्टॉल करें
npm install

# 3. एनवायरनमेंट वेरिएबल्स सेट करें
cp .env.example .env.local
```

### 3. एनवायरनमेंट वेरिएबल्स

`.env.local` फाइल बनाएं:

```env
# Database
DATABASE_URL="file:./db/custom.db"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# App URL
APP_URL="http://localhost:3000"
```

### 4. डेटाबेस सेटअप

```bash
# Prisma क्लाइंट जेनरेट करें
npx prisma generate

# डेटाबेस पुश करें
npx prisma db push

# (ऑप्शनल) माइग्रेशन रन करें
npx prisma migrate dev
```

### 5. डेवलपमेंट मोड

```bash
# डेवलपमेंट सर्वर स्टार्ट करें
npm run dev

# एप्लिकेशन चलेगा: http://localhost:3000
```

### 6. प्रोडक्शन बिल्ड

```bash
# एप्लिकेशन बिल्ड करें
npm run build

# प्रोडक्शन सर्वर स्टार्ट करें
npm run start
```

## 🌐 होस्टिंग ऑप्शन

### 1. Vercel (रिकमेंडेड)

```bash
# Vercel CLI इंस्टॉल करें
npm i -g vercel

# डिप्लॉय करें
vercel

# प्रोडक्शन डिप्लॉय
vercel --prod
```

**Vercel के लिए एनवायरनमेंट वेरिएबल्स:**
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Random secret key
- `NEXTAUTH_URL` - Your Vercel URL

### 2. Netlify

```bash
# बिल्ड करें
npm run build

# Netlify पर डिप्लॉय करें
# Build command: npm run build
# Publish directory: .next
```

### 3. Railway

```bash
# Railway CLI इंस्टॉल करें
npm install -g @railway/cli

# लॉगिन करें
railway login

# डिप्लॉय करें
railway up
```

### 4. DigitalOcean App Platform

1. GitHub में कोड पुश करें
2. DigitalOcean App Platform में कनेक्ट करें
3. Build command: `npm run build`
4. Run command: `npm start`

### 5. AWS Amplify

1. AWS Amplify Console में जाएं
2. GitHub रिपॉजिटरी कनेक्ट करें
3. Build settings:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

## 🗄️ डेटाबेस कॉन्फिग्यरेशन

### प्रोडक्शन के लिए PostgreSQL (रिकमेंडेड)

**Prisma Schema अपडेट:**

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Environment Variable:**
```env
DATABASE_URL="postgresql://username:password@host:port/database"
```

### SQLite (डेवलपमेंट/स्मॉल साइट्स)

```env
DATABASE_URL="file:./db/custom.db"
```

## 🔧 एडिशनल कॉन्फिग्यरेशन

### 1. CORS सेटअप

`next.config.ts` में:

```typescript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ]
  },
}
```

### 2. डोमेन कॉन्फिग्यरेशन

```env
NEXTAUTH_URL="https://yourdomain.com"
APP_URL="https://yourdomain.com"
```

## 📊 परफॉर्मेंस ऑप्टिमाइजेशन

### 1. इमेज ऑप्टिमाइजेशन

```bash
# Next.js Image ऑप्टिमाइजेशन एनेबल करें
# सभी इमेज Next.js Image component का उपयोग करें
```

### 2. बंडल ऑप्टिमाइजेशन

```bash
# बंडल एनालिसिस करें
npm run build
npx @next/bundle-analyzer
```

## 🔒 सिक्योरिटी

### 1. एनवायरनमेंट वेरिएबल्स

- कभी भी `.env` फाइल GitHub में पुश न करें
- सभी सीक्रेट्स होस्टिंग प्लेटफॉर्म में सेट करें

### 2. डेटाबेस सिक्योरिटी

- प्रोडक्शन में PostgreSQL का उपयोग करें
- डेटाबेस कनेक्शन SSL एनेबल करें

## 🐛 ट्रबलशूटिंग

### कॉमन इश्यूज:

1. **Build Error:**
   ```bash
   # Node modules क्लीन करें
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Database Connection Error:**
   ```bash
   # DATABASE_URL चेक करें
   echo $DATABASE_URL
   ```

3. **Authentication Error:**
   ```bash
   # NEXTAUTH_SECRET रीजेनरेट करें
   openssl rand -base64 32
   ```

## 📞 सपोर्ट

अगर आपको कोई समस्या आती है, तो:

1. डॉक्यूमेंटेशन चेक करें
2. GitHub Issues में समस्या रिपोर्ट करें
3. डेवलपर से संपर्क करें

---

**🎉 आपका भू-अभिलेख सिस्टम तैयार है डिप्लॉय करने के लिए!**
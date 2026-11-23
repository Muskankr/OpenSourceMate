# OpenSourceMate

[English](README.md) | **हिन्दी**

[![CI](https://github.com/Muskankr/OpenSourceMate/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Muskankr/OpenSourceMate/actions/workflows/ci.yml)
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/Muskankr/OpenSourceMate)
[![Coverage](https://img.shields.io/badge/Coverage-85%25-brightgreen.svg)](#बैकएंड-टेस्ट-चलाएं-run-the-backend-tests)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/Muskankr/OpenSourceMate?style=flat&logo=github)](https://github.com/Muskankr/OpenSourceMate/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/Muskankr/OpenSourceMate?style=flat&logo=github)](https://github.com/Muskankr/OpenSourceMate/network/members)
[![Open Issues](https://img.shields.io/github/issues/Muskankr/OpenSourceMate?style=flat&logo=github)](https://github.com/Muskankr/OpenSourceMate/issues)
[![Deployment](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://open-source-mate-tawny.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi)](https://fastapi.tiangolo.com/)

> **अपने कौशल (skills) से मेल खाने वाले ओपन-सोर्स अवसरों को खोजें।**

OpenSourceMate एक AI-संचालित ओपन-सोर्स योगदान खोज मंच (contribution discovery platform) है जो डेवलपर के सार्वजनिक GitHub प्रोफाइल और तकनीकी अनुभव का विश्लेषण करके उनके लिए सार्थक योगदान के अवसरों की पहचान करने में मदद करता है।

यह प्रोजेक्ट इस उद्देश्य के साथ विकसित किया जा रहा है कि डेवलपर्स और नए योगदानकर्ताओं (beginners) के लिए ओपन-सोर्स योगदान के अवसरों की खोज को आसान और सुलभ बनाया जा सके।

---

## 📑 विषय-सूची (Table of Contents)

- [✨ वर्तमान सुविधाएँ (Current Features)](#-वर्तमान-सुविधाएँ-current-features)
  - [🔎 GitHub प्रोफाइल विश्लेषण (GitHub Profile Analysis)](#-github-प्रोफाइल-विश्लेषण-github-profile-analysis)
  - [🧠 तकनीकी कौशल विश्लेषण (Technical Skill Analysis)](#-तकनीकी-कौशल-विश्लेषण-technical-skill-analysis)
  - [👥 योगदानकर्ता दीवार (Contributors Wall)](#-योगदानकर्ता-दीवार-contributors-wall)
  - [🎯 योगदान खोज — आगामी सुविधाएँ (Contribution Discovery — Coming Next)](#-योगदान-खोज--आगामी-सुविधाएँ-contribution-discovery--coming-next)
- [🖼️ स्क्रीनशॉट्स (Screenshots)](#%EF%B8%8F-स्क्रीनशॉट्स-screenshots)
- [🏗️ प्रोजेक्ट संरचना (Project Structure)](#%EF%B8%8F-प्रोजेक्ट-संरचना-project-structure)
- [🛠️ टेक स्टैक (Tech Stack)](#%EF%B8%8F-टेक-स्टैक-tech-stack)
- [🚀 शुरुआत कैसे करें (Getting Started)](#-शुरुआत-कैसे-करें-getting-started)
  - [GitHub Codespaces में विकास करें (Develop in GitHub Codespaces)](#github-codespaces-में-विकास-करें-develop-in-github-codespaces)
  - [🐳 Docker Compose के साथ चलाएं (Run with Docker Compose)](#-docker-compose-के-साथ-चलाएं-run-with-docker-compose)
  - [आवश्यक शर्तें (Prerequisites)](#आवश्यक-शर्तें-prerequisites)
  - [1. रिपॉजिटरी को क्लोन करें (Clone the repository)](#1-रिपॉजिटरी-को-क्लोन-करें-clone-the-repository)
  - [2. फ्रंटएंड चलाएं (Run the frontend)](#2-फ्रंटएंड-चलाएं-run-the-frontend)
  - [3. बैकएंड चलाएं (Run the backend)](#3-बैकएंड-चलाएं-run-the-backend)
  - [बैकएंड टेस्ट चलाएं (Run the backend tests)](#बैकएंड-टेस्ट-चलाएं-run-the-backend-tests)
- [⚡ रूट डेवलपमेंट कमांड्स (Makefile & PowerShell)](#-रूट-डेवलपमेंट-कमांड्स-makefile--powershell)
- [📡 API एंडपॉइंट्स और एरर हैंडलिंग (API Endpoints & Error Handling)](#-api-एंडपॉइंट्स-और-एरर-हैंडलिंग-api-endpoints--error-handling)
  - [हेल्थ चेक (Health Check)](#हेल्थ-चेक-health-check)
  - [एकीकृत एरर प्रारूप (Unified Error Format)](#एकीकृत-एरर-प्रारूप-unified-error-format)
- [🔐 एनवायरनमेंट वेरिएबल्स (Environment Variables)](#-एनवायरनमेंट-वेरिएबल्स-environment-variables)
  - [मुख्य दिशा-निर्देश (Key Guidelines)](#मुख्य-दिशा-निर्देश-key-guidelines)
  - [सेटअप निर्देश (Setup Instructions)](#सेटअप-निर्देश-setup-instructions)
  - [समर्थित एनवायरनमेंट वेरिएबल्स (Supported Environment Variables)](#समर्थित-एनवायरनमेंट-वेरिएबल्स-supported-environment-variables)
- [🧩 यह कैसे काम करता है (How It Works)](#-यह-कैसे-काम-करता-है-how-it-works)
- [🧹 कोड गुणवत्ता, लिंटिंग और प्री-कमिट (Code Quality, Linting & Pre-Commit)](#-कोड-गुणवत्ता-लिंटिंग-और-प्री-कमिट-code-quality-linting--pre-commit)
- [🤝 योगदान कैसे करें (Contributing)](#-योगदान-कैसे-करें-contributing)
- [👥 योगदानकर्ता (Contributors)](#-योगदानकर्ता-contributors)
- [🐛 इश्यू और फीचर अनुरोध (Issues & Feature Requests)](#-इश्यू-और-फीचर-अनुरोध-issues--feature-requests)
- [💬 सहायता (Support)](#-सहायता-support)
- [🏛️ शासन प्रणाली (Governance)](#%EF%B8%8F-शासन-प्रणाली-governance)
- [🔒 सुरक्षा (Security)](#-सुरक्षा-security)
- [📚 प्रोजेक्ट दृष्टिकोण (Project Vision)](#-प्रोजेक्ट-दृष्टिकोण-project-vision)
- [🌱 योगदान के क्षेत्र (Contributing Areas)](#-योगदान-के-क्षेत्र-contributing-areas)
- [📄 लाइसेंस (License)](#-लाइसेंस-license)
- [⭐ प्रोजेक्ट का समर्थन करें (Support the Project)](#-प्रोजेक्ट-का-समर्थन-करें-support-the-project)
- [👩‍💻 लेखक (Author)](#-लेखक-author)

---

## ✨ वर्तमान सुविधाएँ (Current Features)

### 🔎 GitHub प्रोफाइल विश्लेषण (GitHub Profile Analysis)

एक सार्वजनिक GitHub यूज़रनेम दर्ज करें, और OpenSourceMate उपयोगी प्रोफाइल जानकारी प्राप्त करता है जैसे:

- GitHub यूज़रनेम
- नाम और बायो (bio)
- सार्वजनिक रिपॉजिटरी संख्या (public repository count)
- फॉलोअर्स (followers) और फॉलोइंग (following)
- GitHub प्रोफाइल का लिंक

### 🧠 तकनीकी कौशल विश्लेषण (Technical Skill Analysis)

OpenSourceMate यूज़र की सार्वजनिक GitHub रिपॉजिटरी का विश्लेषण करके तकनीकी कौशलों की पहचान करता है और प्रदर्शित करता है:

- पहचानी गई तकनीकें/भाषाएँ (detected technologies/languages)
- प्रत्येक कौशल से जुड़ी रिपॉजिटरी संख्या
- कौशल वितरण (skill distribution)
- विश्लेषित रिपॉजिटरी की कुल संख्या

### 👥 योगदानकर्ता दीवार (Contributors Wall)

OpenSourceMate होमपेज पर एक लाइव कंट्रीब्यूटर्स वॉल के साथ अपने ओपन-सोर्स समुदाय का सम्मान करता है। यह सार्वजनिक GitHub Contributors API से योगदानकर्ता डेटा प्राप्त करता है और:

- योगदानकर्ता के अवतार, यूज़रनेम, व्यक्तिगत योगदान संख्या और उनके GitHub प्रोफाइल लिंक प्रदर्शित करता है।
- बॉट खातों, अनाम प्रविष्टियों और डुप्लिकेट्स को फ़िल्टर करता है।
- लोडिंग और खाली अवस्थाएं (empty states) प्रदान करता है, साथ ही API त्रुटियों और दर सीमाओं (rate limits) के लिए पुनः प्रयास (retry) का विकल्प देता है।
- मोबाइल और डेस्कटॉप स्क्रीन दोनों के लिए एक रिस्पॉन्सिव लेआउट का उपयोग करता है।

### 🎯 योगदान खोज — आगामी सुविधाएँ (Contribution Discovery — Coming Next)

OpenSourceMate का अगला चरण डेवलपर के तकनीकी प्रोफाइल को ओपन GitHub इश्यूज़ से जोड़ने पर केंद्रित है।

योजनाबद्ध क्षमताओं में शामिल हैं:

- कौशल-आधारित इश्यू मिलान (skill-based issue matching)
- व्यक्तिगत इश्यू अनुशंसाएँ (personalized issue recommendations)
- योगदान अनुकूलता विश्लेषण (contribution compatibility analysis)
- शुरुआती-अनुकूल इश्यू खोज (beginner-friendly issue discovery)
- रिपॉजिटरी और इश्यू का संदर्भ
- योगदान अवसर रैंकिंग

> योजनाबद्ध के रूप में चिह्नित सुविधाएँ प्रोजेक्ट के रोडमैप का हिस्सा हैं और हो सकता है कि अभी उपलब्ध न हों। पूर्ण मील के पत्थर, फीचर स्थिति और सामुदायिक योजना के लिए [ROADMAP.md](ROADMAP.md) देखें।

---

## 🖼️ स्क्रीनशॉट्स (Screenshots)

### डैशबोर्ड (Dashboard)

<img width="1302" height="726" alt="Dashboard" src="https://github.com/user-attachments/assets/ba5ac505-b7c3-4c32-a438-afe194e31942" />

### यह कैसे काम करता है (How It Works)

<img width="1257" height="723" alt="How it works" src="https://github.com/user-attachments/assets/908d7b73-7283-4903-83bf-4e0950fa2ee9" />

### प्रोफाइल विश्लेषण (Analyze Profile)

<img width="1213" height="727" alt="Analyze Profile" src="https://github.com/user-attachments/assets/a115a54f-6359-4db9-83d1-647e28e4167a" />

---

## 🏗️ प्रोजेक्ट संरचना (Project Structure)

```text
OpenSourceMate/
│
├── backend/
│   ├── API और सर्वर-साइड लॉजिक
│   ├── GitHub एकीकरण
│   ├── डेवलपर प्रोफाइल विश्लेषण
│   └── कौशल विश्लेषण
│
├── frontend/
│   ├── Next.js एप्लिकेशन
│   ├── GitHub प्रोफाइल एनालाइज़र UI
│   ├── तकनीकी कौशल विज़ुअलाइज़ेशन
│   └── योगदान खोज इंटरफ़ेस
│
├── docs/
│   └── आर्किटेक्चर, कंपोनेंट गाइड और विनिर्देश (specifications)
│
└── README.md
```

> 📖 विस्तृत सिस्टम डिज़ाइन, कंपोनेंट आरेख और अनुरोध प्रवाह (request flows) के लिए [ARCHITECTURE.md](ARCHITECTURE.md) देखें।

---

## 🛠️ टेक स्टैक (Tech Stack)

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend

- Python
- FastAPI
- Uvicorn
- Pydantic

### AI / Data

बैकएंड को एक AI/डेटा इकोसिस्टम के साथ विकसित किया जा रहा है जिसमें निम्नलिखित तकनीकें शामिल हैं:

- Google GenAI
- OpenAI-संगत टूलिंग
- Sentence Transformers
- Transformers
- spaCy
- PyTorch

### डेवलपर और एकीकरण उपकरण (Developer & Integration Tools)

- GitHub APIs
- GitPython
- REST APIs

---

## 🚀 शुरुआत कैसे करें (Getting Started)

### GitHub Codespaces में विकास करें (Develop in GitHub Codespaces)

आप बिना किसी स्थानीय सेटअप के सीधे अपने ब्राउज़र या VS Code में GitHub Codespaces का उपयोग करके OpenSourceMate विकसित कर सकते हैं:

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/Muskankr/OpenSourceMate)

1. ऊपर दिए गए **Open in GitHub Codespaces** बैज पर क्लिक करें (या GitHub पर **Code > Codespaces > Create codespace on main** चुनें)।
2. देवकंटेनर (devcontainer) स्वचालित रूप से Python 3.12, Node.js 22, सभी बैकएंड और फ्रंटएंड निर्भरताएँ इंस्टॉल करता है, और डिफ़ॉल्ट एनवायरनमेंट फाइलें सेट करता है।
3. Codespace प्रारंभ होने के बाद, एकीकृत टर्मिनल में दोनों एप्लिकेशन चलाएं:
   - **फ्रंटएंड**: `make dev-frontend` (पोर्ट `3000` पर पूर्वावलोकन में स्वचालित रूप से खुलता है)
   - **बैकएंड**: `make dev-backend` (पोर्ट `8000` पर FastAPI सर्वर)
   - **टेस्ट चलाएं**: `make test` (या `make test-backend` / `make test-frontend`)

---

### 🐳 Docker Compose के साथ चलाएं (Run with Docker Compose)

योगदानकर्ता किसी भी मैन्युअल सेटअप के बिना केवल एक कमांड के साथ फ्रंटएंड और बैकएंड दोनों को एक साथ चला सकते हैं:

```bash
# 1. रिपॉजिटरी को क्लोन करें
git clone https://github.com/Muskankr/OpenSourceMate.git
cd OpenSourceMate

# 2. सभी सेवाएँ शुरू करें
docker compose up
```

दोनों सेवाएँ स्वचालित रूप से शुरू हो जाती हैं:

- **फ्रंटएंड यूआई:** [`http://localhost:3000`](http://localhost:3000)
- **बैकएंड एपीआई:** [`http://localhost:8000`](http://localhost:8000)
- **ओपनएपीआई डॉक्स:** [`http://localhost:8000/docs`](http://localhost:8000/docs)

#### एनवायरनमेंट सेटिंग्स और सीक्रेट्स सुरक्षा

- **सुरक्षित डिफ़ॉल्ट सेटिंग्स:** दोनों कंटेनर सुरक्षित स्थानीय विकास डिफ़ॉल्ट के साथ शुरू होते हैं। इमेज लेयर्स में कोई सीक्रेट्स नहीं जोड़े जाते।
- **वैकल्पिक सेटिंग्स:** उच्च GitHub API दर सीमा के लिए `.env.example` को `.env` के रूप में कॉपी करें और `GITHUB_TOKEN` दर्ज करें।

---

### आवश्यक शर्तें (Prerequisites)

सुनिश्चित करें कि आपके सिस्टम में निम्नलिखित इंस्टॉल हैं:

- Git
- Node.js
- npm
- Python 3.x

---

## 1. रिपॉजिटरी को क्लोन करें (Clone the repository)

```bash
git clone https://github.com/Muskankr/OpenSourceMate.git
cd OpenSourceMate
```

---

## 2. फ्रंटएंड चलाएं (Run the frontend)

```bash
cd frontend
npm install
```

एनवायरनमेंट वेरिएबल्स कॉन्फ़िगर करें (स्थानीय विकास के लिए वैकल्पिक, डिफ़ॉल्ट `http://localhost:8000` है):

### Windows (PowerShell)

```powershell
Copy-Item .env.example .env.local
```

### macOS / Linux

```bash
cp .env.example .env.local
```

फ्रंटएंड डेवलपमेंट सर्वर शुरू करें:

```bash
npm run dev
```

फ्रंटएंड निम्नलिखित पते पर उपलब्ध होगा:

```text
http://localhost:3000
```

---

## 3. बैकएंड चलाएं (Run the backend)

एक दूसरा टर्मिनल खोलें:

```bash
cd backend
```

एक वर्चुअल एनवायरनमेंट बनाएं और सक्रिय करें:

### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

### macOS / Linux

```bash
python3 -m venv venv
source venv/bin/activate
```

एनवायरनमेंट वेरिएबल्स कॉन्फ़िगर करें (वैकल्पिक, [एनवायरनमेंट वेरिएबल्स](#-एनवायरनमेंट-वेरिएबल्स-environment-variables) देखें):

### Windows (PowerShell)

```powershell
Copy-Item .env.example .env
```

### macOS / Linux

```bash
cp .env.example .env
```

निर्भरताएँ (dependencies) इंस्टॉल करें:

```bash
pip install -r requirements.txt
```

FastAPI बैकएंड सर्वर शुरू करें:

```bash
uvicorn app.main:app --reload --port 8000
```

बैकएंड API निम्नलिखित पते पर उपलब्ध होगी:

```text
http://localhost:8000
```

इंटरएक्टिव OpenAPI दस्तावेज़ीकरण (Swagger UI) `http://localhost:8000/docs` पर उपलब्ध है।

प्रत्येक एंडपॉइंट के curl, Python और JavaScript उदाहरणों और Bruno अनुरोध संग्रह के लिए [API Usage Examples](docs/api-usage-examples.md) देखें।

### बैकएंड टेस्ट चलाएं (Run the backend tests)

परीक्षण GitHub API को मॉक करते हैं, इसलिए किसी नेटवर्क कनेक्शन या टोकन की आवश्यकता नहीं है।

```bash
pip install -r requirements-dev.txt
pytest --cov=app --cov-report=term-missing
```

CI द्वारा न्यूनतम 80% कवरेज सीमा (coverage threshold) अनिवार्य की गई है।

> बैकएंड सेटअप वर्तमान में निरंतर विकसित हो रहा है। प्रोजेक्ट के आगे बढ़ने के साथ अधिक विस्तृत सेटअप निर्देश और एनवायरनमेंट कॉन्फ़िगरेशन प्रलेखित किए जाएंगे।

---

## ⚡ रूट डेवलपमेंट कमांड्स (Makefile & PowerShell)

डेवलपर्स की सुविधा के लिए, सामान्य कार्यों को रिपॉजिटरी रूट से सीधे `make` (macOS/Linux) या PowerShell हेल्पर स्क्रिप्ट (Windows) का उपयोग करके चलाया जा सकता है:

| कार्य (Task)                    | macOS / Linux (`make`) | Windows PowerShell (`.\scripts\dev.ps1`) |
| ------------------------------- | ---------------------- | ---------------------------------------- |
| **सभी निर्भरताएँ इंस्टॉल करें** | `make install`         | `.\scripts\dev.ps1 install`              |
| **फ्रंटएंड देव सर्वर चलाएं**    | `make dev-frontend`    | `.\scripts\dev.ps1 dev-frontend`         |
| **बैकएंड देव सर्वर चलाएं**      | `make dev-backend`     | `.\scripts\dev.ps1 dev-backend`          |
| **सभी लिंटर्स चलाएं**           | `make lint`            | `.\scripts\dev.ps1 lint`                 |
| **कोड फॉर्मेटर्स चलाएं**        | `make format`          | `.\scripts\dev.ps1 format`               |
| **सभी टेस्ट चलाएं**             | `make test`            | `.\scripts\dev.ps1 test`                 |
| **बैकएंड टेस्ट चलाएं**          | `make test-backend`    | `.\scripts\dev.ps1 test-backend`         |
| **फ्रंटएंड टेस्ट चलाएं**        | `make test-frontend`   | `.\scripts\dev.ps1 test-frontend`        |
| **कैश फाइलें साफ़ करें**        | `make clean`           | `.\scripts\dev.ps1 clean`                |

---

## 📡 API एंडपॉइंट्स और एरर हैंडलिंग (API Endpoints & Error Handling)

सभी बैकएंड प्रतिक्रियाएँ Pydantic सीरियलाइज़र के साथ क्रमबद्ध की जाती हैं, और त्रुटि प्रतिक्रियाएँ एक एकीकृत एरर प्रारूप का पालन करती हैं।

### हेल्थ चेक (Health Check)

```http
GET /api/health/
GET /api/health
```

सर्विस स्वास्थ्य स्थिति (health status) और संस्करण लौटाता है।

**प्रतिक्रिया (`200 OK`):**

```json
{
  "status": "healthy",
  "service": "OpenSourceMate API",
  "version": "0.1.0"
}
```

```http
GET /api/health/diagnostics
```

GitHub API कनेक्टिविटी और कैश प्रदर्शन सहित विस्तृत डायग्नोस्टिक मेट्रिक्स लौटाता है।

### एकीकृत एरर प्रारूप (Unified Error Format)

सभी API एंडपॉइंट्स पर सभी त्रुटि प्रतिक्रियाएँ मशीन-पठनीय त्रुटि कोड और मानव-पठनीय संदेशों के साथ एक मानकीकृत JSON संरचना लौटाती हैं:

```json
{
  "error": {
    "code": "INVALID_USERNAME",
    "message": "Invalid GitHub username '-octocat'. GitHub usernames must be 1-39 characters, contain only alphanumeric characters or single hyphens, and cannot start or end with a hyphen.",
    "details": {
      "username": "-octocat"
    }
  },
  "detail": "Invalid GitHub username '-octocat'. GitHub usernames must be 1-39 characters, contain only alphanumeric characters or single hyphens, and cannot start or end with a hyphen."
}
```

सामान्य त्रुटि कोड:

- `INVALID_USERNAME` (HTTP 400): यूज़रनेम GitHub प्रारूप बाधाओं का उल्लंघन करता है।
- `NOT_FOUND` (HTTP 404): अनुरोधित GitHub उपयोगकर्ता या संसाधन नहीं मिला।
- `VALIDATION_ERROR` (HTTP 422): अनुरोध पैरामीटर या बॉडी पेलोड स्कीमा सत्यापन में विफल रहा।
- `RATE_LIMIT_EXCEEDED` (HTTP 429): अपस्ट्रीम GitHub दर सीमा समाप्त हो गई; इसमें `reset_at` टाइमस्टैम्प शामिल है।
- `INTERNAL_SERVER_ERROR` (HTTP 500): प्रोसेसिंग के दौरान अनपेक्षित अपवाद।

---

## 🔐 एनवायरनमेंट वेरिएबल्स (Environment Variables)

OpenSourceMate Next.js फ्रंटएंड और FastAPI बैकएंड को कॉन्फ़िगर करने के लिए एनवायरनमेंट वेरिएबल्स का उपयोग करता है।

### मुख्य दिशा-निर्देश (Key Guidelines)

- **शून्य-क्रेडेंशियल स्थानीय सेटअप (Zero-credential local setup)**: सभी वेरिएबल्स के सुरक्षित डिफ़ॉल्ट मान हैं। आप बिना किसी बाहरी API कुंजी या टोकन के पूरे फ्रंटएंड और बैकएंड को स्थानीय रूप से चला सकते हैं।
- **वैकल्पिक सुविधाएँ (Optional features)**: उच्च GitHub API दर सीमा, AI-सहायता प्राप्त इश्यू विश्लेषण और सिमेंटिक मिलान जैसे एकीकरण वैकल्पिक हैं। यदि आप इन सुविधाओं का परीक्षण या विकास करना चाहते हैं, तो आप अपने क्रेडेंशियल्स प्रदान कर सकते हैं।
- **गोपनीयता सुरक्षा (Secret security)**: **कभी भी `.env` या `.env.local` फाइलों, API कुंजियों, पासवर्ड या व्यक्तिगत एक्सेस टोकन को Git में कमिट न करें।** इन फाइलों को `.gitignore` द्वारा अनदेखा किया जाता है।

### सेटअप निर्देश (Setup Instructions)

अपने स्थानीय वातावरण को कॉन्फ़िगर करने के लिए:

1. **`backend/.env.example` को `backend/.env` में कॉपी करें:**
   - Windows (PowerShell): `Copy-Item backend\.env.example backend\.env`
   - macOS / Linux: `cp backend/.env.example backend/.env`
2. **`frontend/.env.example` को `frontend/.env.local` में कॉपी करें:**
   - Windows (PowerShell): `Copy-Item frontend\.env.example frontend\.env.local`
   - macOS / Linux: `cp frontend/.env.example frontend/.env.local`
     _(ध्यान दें: Next.js `.env`, `.env.development`, और `.env.local` से एनवायरनमेंट वेरिएबल्स लोड करता है। स्थानीय विकास के लिए, `.env.local` में कॉपी करना अनुशंसित है क्योंकि यह प्राथमिकता लेता है और डिफ़ॉल्ट रूप से स्रोत नियंत्रण से बाहर रखा जाता है)।_
3. **प्लेसहोल्डर मानों को अपने क्रेडेंशियल्स से बदलें:**
   - नई बनाई गई `.env` फाइलों को संपादित करें और प्लेसहोल्डर मानों को अपनी API कुंजियों या टोकन से बदलें (उदा. उच्च दर सीमाओं के लिए `GITHUB_TOKEN` या AI विश्लेषण के लिए `AI_API_KEY`)।
4. **सही बैकएंड API URL कॉन्फ़िगर करें:**
   - सत्यापित करें कि `frontend/.env.local` में `NEXT_PUBLIC_API_URL` आपके बैकएंड इंस्टेंस की ओर इंगित करता है (स्थानीय विकास के लिए `http://localhost:8000`)।
5. **वास्तविक `.env` फाइलों या क्रेडेंशियल्स को कभी कमिट न करें:**
   - सुनिश्चित करें कि स्थानीय `.env` और `.env.local` फाइलें असंबद्ध और अनट्रैक रहें।

### समर्थित एनवायरनमेंट वेरिएबल्स (Supported Environment Variables)

| वेरिएबल                     | स्थान                 | आवश्यक                   | विवरण                                                                                                                                                                                                                                                                                                                                  |
| --------------------------- | --------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ENVIRONMENT`               | `backend/.env`        | Dev: नहीं, Prod: नहीं    | लक्षित रनटाइम वातावरण: `development` (डिफ़ॉल्ट), `production`, या `testing`। सुरक्षा मान्यताओं और डिफ़ॉल्ट को नियंत्रित करता है।                                                                                                                                                                                                       |
| `DEBUG`                     | `backend/.env`        | Dev: नहीं, Prod: नहीं    | FastAPI डिबग मोड सक्षम करता है। विकास में डिफ़ॉल्ट `True` है। उत्पादन में कड़ाई से `False` है (उत्पादन में `True` सेट करने पर स्टार्टअप विफल होता है)।                                                                                                                                                                                 |
| `SECRET_KEY`                | `backend/.env`        | Dev: नहीं, Prod: **हाँ** | हस्ताक्षर और सुरक्षा के लिए क्रिप्टोग्राफ़िक गुप्त कुंजी। विकास में डिफ़ॉल्ट देव कुंजी का उपयोग होता है। उत्पादन में **सख्ती से आवश्यक** (न्यूनतम 16 वर्ण); यदि सेट नहीं है तो स्टार्टअप विफल होता है।                                                                                                                                 |
| `ALLOWED_HOSTS`             | `backend/.env`        | Dev: नहीं, Prod: नहीं    | `TrustedHostMiddleware` के लिए अनुमत HTTP Host हेडर की अल्पविराम से अलग सूची या JSON सरणी। सुरक्षित डिफ़ॉल्ट: `["*"]` (सभी होस्ट की अनुमति देता है)। उत्पादन में सटीक डोमेन नाम कॉन्फ़िगर करें।                                                                                                                                        |
| `CORS_ORIGINS`              | `backend/.env`        | Dev: नहीं, Prod: नहीं    | अनुमत फ्रंटएंड ऑरिजिन की अल्पविराम से अलग सूची या JSON सरणी। डिफ़ॉल्ट: `["http://localhost:3000", "http://127.0.0.1:3000", "https://open-source-mate-tawny.vercel.app"]`।                                                                                                                                                              |
| `CORS_ALLOW_CREDENTIALS`    | `backend/.env`        | Dev: नहीं, Prod: नहीं    | बूलियन जो दर्शाता है कि क्या क्रॉस-ऑरिजिन कुकीज़ और प्रमाणीकरण हेडर समर्थित हैं। सुरक्षित डिफ़ॉल्ट: `False`।                                                                                                                                                                                                                           |
| `CORS_ALLOW_METHODS`        | `backend/.env`        | Dev: नहीं, Prod: नहीं    | अनुमत HTTP विधियों की अल्पविराम से अलग सूची या JSON सरणी। डिफ़ॉल्ट: `["*"]`।                                                                                                                                                                                                                                                           |
| `CORS_ALLOW_HEADERS`        | `backend/.env`        | Dev: नहीं, Prod: नहीं    | अनुमत HTTP हेडर की अल्पविराम से अलग सूची या JSON सरणी। डिफ़ॉल्ट: `["*"]`।                                                                                                                                                                                                                                                              |
| `GITHUB_TOKEN`              | `backend/.env`        | Dev: नहीं, Prod: नहीं    | GitHub पर्सनल एक्सेस टोकन (classic या fine-grained)। GitHub REST API दर सीमा को 60 से बढ़ाकर 5,000 अनुरोध/घंटा करता है। सुरक्षित डिफ़ॉल्ट: खाली (अनाधिकृत अनुरोध)। इसे प्राप्त करने के लिए, GitHub **Settings > Developer Settings > Personal access tokens** पर जाएं और टोकन जनरेट करें (सार्वजनिक केवल-पढ़ने की अनुमति पर्याप्त है)। |
| `GITHUB_CACHE_TTL`          | `backend/.env`        | Dev: नहीं, Prod: नहीं    | GitHub प्रोफाइल और रिपॉजिटरी API प्रतिक्रियाओं के लिए इन-मेमोरी कैश अवधि (सेकंड में)। सुरक्षित डिफ़ॉल्ट: `300` (5 मिनट)। विकास के दौरान इन-मेमोरी कैशिंग अक्षम करने के लिए `0` पर सेट करें।                                                                                                                                            |
| `GITHUB_MAX_REPO_PAGES`     | `backend/.env`        | Dev: नहीं, Prod: नहीं    | प्रति उपयोगकर्ता प्रोफाइल फेच के लिए अनुमत अधिकतम पेजिनेशन कॉल की संख्या। सुरक्षित डिफ़ॉल्ट: `3`।                                                                                                                                                                                                                                      |
| `GITHUB_REPOS_PER_PAGE`     | `backend/.env`        | Dev: नहीं, Prod: नहीं    | GitHub API से प्रति पृष्ठ अनुरोधित रिपॉजिटरी की संख्या (GitHub द्वारा अनुमत अधिकतम 100 है)। सुरक्षित डिफ़ॉल्ट: `100`।                                                                                                                                                                                                                  |
| `GITHUB_MAX_REPOS_CAP`      | `backend/.env`        | Dev: नहीं, Prod: नहीं    | प्रति उपयोगकर्ता प्रोफ़ाइल में विश्लेषित कुल रिपॉजिटरी की व्यावहारिक अधिकतम सीमा। सुरक्षित डिफ़ॉल्ट: `300`।                                                                                                                                                                                                                            |
| `AI_API_KEY`                | `backend/.env`        | Dev: नहीं, Prod: नहीं    | वैकल्पिक AI-संचालित इश्यू विश्लेषण (`/api/ai/analyze-issue`) के लिए उपयोग की जाने वाली OpenAI API कुंजी। सुरक्षित डिफ़ॉल्ट: खाली। इसे प्राप्त करने के लिए, [platform.openai.com](https://platform.openai.com/) पर एक API कुंजी उत्पन्न करें।                                                                                           |
| `AI_MODEL`                  | `backend/.env`        | Dev: नहीं, Prod: नहीं    | `AI_API_KEY` सेट होने पर OpenAI को दिया जाने वाला मॉडल नाम। सुरक्षित डिफ़ॉल्ट: `gpt-4o-mini`।                                                                                                                                                                                                                                          |
| `GEMINI_API_KEY`            | `backend/.env`        | Dev: नहीं, Prod: नहीं    | `AISettings` द्वारा समर्थित वैकल्पिक Google Gemini API कुंजी। सुरक्षित डिफ़ॉल्ट: खाली।                                                                                                                                                                                                                                                 |
| `OSM_MAX_EXPLANATION_WORDS` | `backend/.env`        | Dev: नहीं, Prod: नहीं    | AI-जनरेटेड इश्यू मिलान स्पष्टीकरण के लिए अधिकतम शब्द गणना। सुरक्षित डिफ़ॉल्ट: `50`।                                                                                                                                                                                                                                                    |
| `OSM_USE_EMBEDDINGS`        | `backend/.env`        | Dev: नहीं, Prod: नहीं    | इश्यू मिलान के लिए वैकल्पिक सिमेंटिक sentence-transformers एम्बेडिंग को सक्षम करने के लिए फ्लैग (`true`/`false`)। सुरक्षित डिफ़ॉल्ट: `false`।                                                                                                                                                                                          |
| `NEXT_PUBLIC_API_URL`       | `frontend/.env.local` | Dev: नहीं, Prod: **हाँ** | Next.js फ्रंटएंड द्वारा एक्सेस किया जाने वाला FastAPI बैकएंड सर्वर का बेस URL। सुरक्षित डिफ़ॉल्ट: `http://localhost:8000`। उत्पादन में, इसे अपने तैनात बैकएंड API URL पर सेट करें।                                                                                                                                                     |

> **फ़्रेमवर्क और देव/उत्पादन नोट्स:**
>
> - बैकएंड **FastAPI** में Pydantic Settings का उपयोग करके कार्यान्वित किया गया है, Django में नहीं। Django-विशिष्ट सेटिंग्स का उपयोग नहीं किया जाता है।
> - **विकास में** (`ENVIRONMENT=development`), `DEBUG` डिफ़ॉल्ट रूप से `True` होता है और एक असुरक्षित डिफ़ॉल्ट `SECRET_KEY` की अनुमति होती है ताकि डेवलपर्स बिना किसी कॉन्फ़िगरेशन के सीधे `uvicorn app.main:app --reload` चला सकें।
> - **उत्पादन में** (`ENVIRONMENT=production`), एप्लिकेशन सख्त उत्पादन नियमों को लागू करता है: `DEBUG` अनिवार्य रूप से `False` होना चाहिए, और `SECRET_KEY` कम से कम 16 वर्णों की एक उच्च-एन्ट्रॉपी स्ट्रिंग होनी चाहिए। यदि `SECRET_KEY` सेट नहीं है, खाली है, या डिफ़ॉल्ट कुंजी का उपयोग कर रहा है, तो एप्लिकेशन स्टार्टअप पर एक स्पष्ट `ValueError` के साथ **विफल हो जाता है**।
> - फ्रंटएंड (`NEXT_PUBLIC_*`) में कभी भी सर्वर-साइड क्रेडेंशियल या API कुंजियों को उजागर न करें। केवल सार्वजनिक कॉन्फ़िगरेशन (जैसे बैकएंड API URL) को `frontend/.env.local` में रखा जाना चाहिए।

**कभी भी API कुंजी, पासवर्ड, टोकन या अन्य गुप्त जानकारी को Git में कमिट न करें।**

---

## 🧩 यह कैसे काम करता है (How It Works)

वर्तमान कार्यप्रवाह (workflow) इस प्रकार है:

```text
                GitHub Username
                        │
                        ▼
               GitHub Profile API
                        │
                        ▼
              Profile Information
                        │
                        ▼
             Public Repositories
                        │
                        ▼
              Technical Analysis
                        │
                        ▼
                 Skill Profile
                        │
                        ▼
         Contribution Discovery
              (Roadmap)
```

योजनाबद्ध योगदान-खोज परत (contribution-discovery layer) इस पाइपलाइन का विस्तार करेगी:

```text
Developer Profile
        │
        ▼
Technical Skills
        │
        ▼
Open GitHub Issues
        │
        ▼
Compatibility Analysis
        │
        ▼
Personalized Opportunities
```

---

## 🧹 कोड गुणवत्ता, लिंटिंग और प्री-कमिट (Code Quality, Linting & Pre-Commit)

OpenSourceMate साफ़ और विश्वसनीय कोड बनाए रखने के लिए स्वचालित कोड गुणवत्ता उपकरणों का उपयोग करता है:

- **Pre-Commit**: `.pre-commit-config.yaml` के माध्यम से कॉन्फ़िगर किए गए स्वचालित Git प्री-कमिट हुक।
  ```bash
  # Install pre-commit hook into your local git repository
  cd backend && pip install -r requirements-dev.txt
  pre-commit install

  # Run pre-commit checks manually on all files
  pre-commit run --all-files
  ```
- **Backend (Python)**: लिंटिंग और फ़ॉर्मेटिंग के लिए [Ruff](https://docs.astral.sh/ruff/) (`ruff check backend`, `ruff format backend`)।
- **Frontend (TypeScript/Next.js)**: [Prettier](https://prettier.io/) और [ESLint](https://eslint.org/) (`npm run format:check`, `npm run lint`, `npx tsc --noEmit`)।

पूर्ण निर्देशों के लिए [Linting and Formatting Guide](docs/linting-and-formatting.md) देखें।

---

## 🤝 योगदान कैसे करें (Contributing)

- अपने कौशल के अनुकूल इश्यू खोजने के लिए [Label Guide](docs/LABELS.md) देखें।

OpenSourceMate एक ओपन-सोर्स प्रोजेक्ट के रूप में बनाया जा रहा है, और योगदान का सहर्ष स्वागत है।

योगदान करने से पहले:

1. रिपॉजिटरी को फोर्क करें।
2. एक फीचर ब्रांच बनाएं।
3. अपने बदलाव करें।
4. अपने परिवर्तनों का स्थानीय स्तर पर परीक्षण करें।
5. एक स्पष्ट कमिट संदेश के साथ अपने कार्य को कमिट करें।
6. अपनी ब्रांच को पुश करें।
7. एक पुल अनुरोध (Pull Request) खोलें।

उदाहरण:

```bash
git checkout -b feature/your-feature
```

अपने बदलाव करें और फिर:

```bash
git add .
git commit -m "feat: add your feature"
git push origin feature/your-feature
```

फिर निम्नलिखित का वर्णन करते हुए एक पुल अनुरोध खोलें:

- आपने क्या बदला
- आपने इसे क्यों बदला
- आपने इसका परीक्षण कैसे किया
- कोई प्रासंगिक स्क्रीनशॉट या उदाहरण

सेटअप, ब्रांच नामकरण, PR सम्मेलनों और कोडिंग मानकों पर विस्तृत दिशा-निर्देशों के लिए [CONTRIBUTING.md](CONTRIBUTING.md) देखें।

---

## 👥 योगदानकर्ता (Contributors)

OpenSourceMate में योगदान देने वाले सभी साथियों का धन्यवाद:

<p align="left">
  <a href="https://github.com/Muskankr/OpenSourceMate/graphs/contributors">
    <img src="https://contrib.rocks/image?repo=Muskankr/OpenSourceMate" alt="OpenSourceMate contributors" />
  </a>
</p>

### लाइव कंट्रीब्यूटर्स वॉल (Live Contributors Wall)

होमपेज वॉल [`frontend/components/ContributorsWall.tsx`](frontend/components/ContributorsWall.tsx) और [`frontend/utils/githubContributors.ts`](frontend/utils/githubContributors.ts) में कार्यान्वित है। यह GitHub के सार्वजनिक API से रिपॉजिटरी के शीर्ष योगदानकर्ताओं को प्राप्त करता है और उनके अवतार, यूज़रनेम, योगदान संख्या और उनके GitHub प्रोफाइल के लिंक प्रदर्शित करता है।

बॉट, अनाम और डुप्लिकेट प्रविष्टियों को फ़िल्टर किया जाता है। लोडिंग और खाली अवस्थाएं प्रदान की जाती हैं, और नेटवर्क, सर्वर या दर-सीमा त्रुटियां पेज को तोड़ने के बजाय पुनः प्रयास विकल्प के साथ एक उपयोगकर्ता-अनुकूल संदेश दिखाती हैं। अप्रमाणित GitHub API अनुरोध प्रति IP प्रति घंटे 60 अनुरोधों तक सीमित हैं।

किसी भी प्रकार के योगदान का स्वागत है! शुरुआत करने के लिए कृपया [CONTRIBUTING.md](CONTRIBUTING.md) देखें।

---

## 🐛 इश्यू और फीचर अनुरोध (Issues & Feature Requests)

कोई बग मिला या कोई विचार है?

एक नया इश्यू खोलें और शामिल करें:

- एक स्पष्ट शीर्षक
- समस्या या सुविधा का विवरण
- पुनरुत्पादन के चरण (steps to reproduce), जहाँ लागू हो
- अपेक्षित व्यवहार (expected behavior)
- वास्तविक व्यवहार (actual behavior)
- स्क्रीनशॉट या लॉग, जब उपयोगी हो

बड़े परिवर्तनों के लिए, कृपया कार्यान्वयन शुरू करने से पहले हमारी [प्रस्ताव प्रक्रिया](CONTRIBUTING.md#proposing-larger-changes-rfc-process) का पालन करते हुए एक [RFC प्रस्ताव](.github/ISSUE_TEMPLATE/proposal.yml) सबमिट करें।

---

## 💬 सहायता (Support)

OpenSourceMate सेट करने, किसी समस्या को डिबग करने, या प्रोजेक्ट को समझने में सहायता चाहिए?

- **प्रश्नोत्तर और चर्चाएं (Q&A & Discussions)**: [GitHub Discussions](https://github.com/Muskankr/OpenSourceMate/discussions) में प्रश्न पूछें, आर्किटेक्चर पर चर्चा करें, या विचार साझा करें।
- **बग रिपोर्ट (Bug Reports)**: पुनरुत्पादन चरणों और संवेदनशील जानकारी हटाए गए लॉग के साथ एक [GitHub Issue](https://github.com/Muskankr/OpenSourceMate/issues) खोलें।
- **महत्वपूर्ण**: सार्वजनिक इश्यू या चर्चाओं में कभी भी API कुंजियाँ, एक्सेस टोकन या निजी पासवर्ड पोस्ट न करें।

विस्तृत सहायता दिशा-निर्देशों और चेकलिस्ट के लिए [SUPPORT.md](SUPPORT.md) देखें।

---

## 🏛️ शासन प्रणाली (Governance)

OpenSourceMate खुले और पारदर्शी तरीके से संचालित होता है:

- **भूमिकाएँ**: योगदानकर्ता (Contributor), समीक्षक (Reviewer), और अनुरक्षक / प्रोजेक्ट लीड (Maintainer / Project Lead - [@Muskankr](https://github.com/Muskankr))।
- **प्रगति पथ**: योगदानकर्ता से समीक्षक और अनुरक्षक बनने के स्पष्ट, योग्यता-आधारित मार्ग।
- **निर्णय और सहमति**: RFCs के माध्यम से खुली चर्चा, नियमित सुधारों के लिए लेज़ी सर्वसम्मति (Lazy Consensus), और आर्किटेक्चर डिसीजन रिकॉर्ड्स ([`docs/adr/`](docs/adr/))।
- **संघर्ष समाधान**: डेटा-संचालित तकनीकी चर्चाएँ, आचार संहिता प्रवर्तन, और प्रोजेक्ट एडमिन का निर्णायक वोट।

संपूर्ण शासन मॉडल के लिए [GOVERNANCE.md](GOVERNANCE.md) पढ़ें।

---

## 🔒 सुरक्षा (Security)

कृपया सार्वजनिक इश्यू के माध्यम से सुरक्षा कमजोरियों की रिपोर्ट न करें।

जैसे-जैसे प्रोजेक्ट परिपक्व होगा, एक समर्पित सुरक्षा रिपोर्टिंग प्रक्रिया प्रलेखित की जाएगी।

इश्यू या पुल अनुरोधों में कभी भी निम्नलिखित शामिल न करें:

- API कुंजियाँ
- एक्सेस टोकन
- पासवर्ड
- व्यक्तिगत क्रेडेंशियल्स
- निजी रिपॉजिटरी जानकारी

---

## 📚 प्रोजेक्ट दृष्टिकोण (Project Vision)

ओपन-सोर्स योगदान को समझना विशेष रूप से उन डेवलपर्स के लिए कठिन हो सकता है जो अनिश्चित हैं:

- कौन से प्रोजेक्ट उनके कौशल से मेल खाते हैं?
- कौन से इश्यू उनके अनुभव के लिए उपयुक्त हैं?
- कोई इश्यू कितना कठिन है?
- रिपॉजिटरी को वास्तव में किस चीज़ की आवश्यकता है?
- उन्हें कहाँ से शुरुआत करनी चाहिए?

OpenSourceMate एक डेवलपर के मौजूदा तकनीकी अनुभव को सार्थक ओपन-सोर्स योगदान के अवसरों से जोड़कर उस खोज बाधा को कम करने का प्रयास करता है।

---

## 🌱 योगदान के क्षेत्र (Contributing Areas)

योगदानकर्ताओं के लिए कई संभावित क्षेत्र हैं:

| क्षेत्र (Area)       | उदाहरण (Examples)                                  |
| -------------------- | -------------------------------------------------- |
| Frontend             | UI, UX, पहुंच (accessibility), रिस्पॉन्सिव डिज़ाइन |
| Backend              | APIs, सत्यापन (validation), आर्किटेक्चर            |
| AI/ML                | मिलान (matching), एम्बेडिंग (embeddings), रैंकिंग  |
| GitHub Integration   | रिपॉजिटरी, इश्यू, मेटाडेटा                         |
| Testing              | यूनिट, एकीकरण (integration), E2E                   |
| Documentation        | गाइड, उदाहरण, आर्किटेक्चर                          |
| DevOps               | CI/CD, परिनियोजन (deployment), स्वचालन             |
| Developer Experience | ऑनबोर्डिंग, योगदानकर्ता उपकरण                      |

---

## 📄 लाइसेंस (License)

यह प्रोजेक्ट **MIT License** के तहत लाइसेंस प्राप्त है।

विवरण के लिए [LICENSE](LICENSE) फाइल देखें।

---

## ⭐ प्रोजेक्ट का समर्थन करें (Support the Project)

यदि आपको OpenSourceMate उपयोगी लगता है या आप इसके विकास में रुचि रखते हैं:

- ⭐ रिपॉजिटरी को स्टार करें
- 🐛 बग की रिपोर्ट करें
- 💡 नई सुविधाओं का सुझाव दें
- 🔧 पुल अनुरोध सबमिट करें
- 📖 दस्तावेज़ीकरण में सुधार करें

प्रत्येक योगदान डेवलपर्स के लिए ओपन-सोर्स भागीदारी को आसान बनाने में मदद करता है।

---

## 👩‍💻 लेखक (Author)

**Muskan Kumari**

GitHub: [@Muskankr](https://github.com/Muskankr)

---

<p align="center">
  ओपन-सोर्स योगदान की खोज को आसान बनाने के लिए निर्मित।
</p>

# OpenSourceMate

> **Find open-source opportunities that match your skills.**

OpenSourceMate is an AI-powered open-source contribution discovery platform that analyzes a developer's public GitHub profile and technical experience to help identify meaningful contribution opportunities.

The project is being developed with a focus on making open-source contribution discovery easier for developers and newcomers.

---

## ✨ Current Features

### 🔎 GitHub Profile Analysis

Enter a public GitHub username and OpenSourceMate retrieves useful profile information such as:

* GitHub username
* Name and bio
* Public repository count
* Followers and following
* Link to the GitHub profile

### 🧠 Technical Skill Analysis

OpenSourceMate analyzes the user's public GitHub repositories to identify technical skills and shows:

* Detected technologies/languages
* Repository count associated with each skill
* Skill distribution
* Number of repositories analyzed

### 🎯 Contribution Discovery — Coming Next

The next stage of OpenSourceMate is focused on connecting a developer's technical profile with open GitHub issues.

Planned capabilities include:

* Skill-based issue matching
* Personalized issue recommendations
* Contribution compatibility analysis
* Beginner-friendly issue discovery
* Repository and issue context
* Contribution opportunity ranking

> Features marked as planned are part of the project's roadmap and may not be available yet.

---

## 🏗️ Project Structure

```text
OpenSourceMate/
│
├── backend/
│   ├── API and server-side logic
│   ├── GitHub integration
│   ├── developer profile analysis
│   └── skill analysis
│
├── frontend/
│   ├── Next.js application
│   ├── GitHub profile analyzer UI
│   ├── technical skill visualization
│   └── contribution discovery interface
│
└── README.md
```

## Screenshots
# Dashboard
<img width="1302" height="726" alt="image" src="https://github.com/user-attachments/assets/ba5ac505-b7c3-4c32-a438-afe194e31942" />

# How it works?
<img width="1257" height="723" alt="image" src="https://github.com/user-attachments/assets/908d7b73-7283-4903-83bf-4e0950fa2ee9" />

# Analyze Profile
<img width="1213" height="727" alt="image" src="https://github.com/user-attachments/assets/a115a54f-6359-4db9-83d1-647e28e4167a" />

---

## 🛠️ Tech Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS

### Backend

* Python
* Django
* Django REST Framework

### AI / Data

The backend is being developed with an AI/data ecosystem that includes technologies such as:

* Google GenAI
* OpenAI-compatible tooling
* Sentence Transformers
* Transformers
* spaCy
* PyTorch

### Developer & Integration Tools

* GitHub APIs
* GitPython
* REST APIs

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

* Git
* Node.js
* npm
* Python 3.x

---

## 1. Clone the repository

```bash
git clone https://github.com/Muskankr/OpenSourceMate.git
cd OpenSourceMate
```

---

## 2. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at:

```text
http://localhost:3000
```

---

## 3. Run the backend

Open a second terminal:

```bash
cd backend
```

Create and activate a virtual environment:

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

Install dependencies:

```bash
pip install -r requirements.txt
```

Then start the backend using the project's configured Django development entry point.

> Backend setup is currently evolving. More detailed setup instructions and environment configuration will be documented as the project develops.

---

## 🔐 Environment Variables

If a feature requires external services or API credentials, configure them through environment variables rather than committing secrets to the repository.

Example:

```env
# Example only — use the variables required by the current backend configuration.
GITHUB_TOKEN=
GOOGLE_API_KEY=
OPENAI_API_KEY=
```

**Never commit API keys, passwords, tokens, or other secrets to Git.**

---

## 🧩 How It Works

The current workflow is:

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

The planned contribution-discovery layer will extend this pipeline:

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

## 🤝 Contributing

OpenSourceMate is being built as an open-source project, and contributions are welcome.

Before contributing:

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Test your changes locally.
5. Commit your work with a clear commit message.
6. Push your branch.
7. Open a pull request.

Example:

```bash
git checkout -b feature/your-feature
```

Make your changes and then:

```bash
git add .
git commit -m "feat: add your feature"
git push origin feature/your-feature
```

Then open a pull request describing:

* What you changed
* Why you changed it
* How you tested it
* Any relevant screenshots or examples

> A detailed `CONTRIBUTING.md` will be added as the contributor workflow matures.

---

## 🐛 Issues & Feature Requests

Found a bug or have an idea?

Open an issue and include:

* A clear title
* Description of the problem or feature
* Steps to reproduce, when applicable
* Expected behavior
* Actual behavior
* Screenshots or logs when useful

For larger changes, discuss the idea before starting implementation.

---

## 🔒 Security

Please do not report security vulnerabilities through public issues.

A dedicated security reporting process will be documented as the project matures.

Never include:

* API keys
* Access tokens
* Passwords
* Personal credentials
* Private repository information

in issues or pull requests.

---

## 📚 Project Vision

Open-source contribution can be difficult to navigate, especially for developers who are unsure:

* Which projects match their skills?
* Which issues are suitable for their experience?
* How difficult is an issue?
* What does a repository actually need?
* Where should they start?

OpenSourceMate aims to reduce that discovery barrier by connecting a developer's existing technical experience with meaningful open-source contribution opportunities.

---

## 🌱 Contributing Areas

There are many potential areas for contributors:

| Area                 | Examples                                 |
| -------------------- | ---------------------------------------- |
| Frontend             | UI, UX, accessibility, responsive design |
| Backend              | APIs, validation, architecture           |
| AI/ML                | matching, embeddings, ranking            |
| GitHub Integration   | repositories, issues, metadata           |
| Testing              | unit, integration, E2E                   |
| Documentation        | guides, examples, architecture           |
| DevOps               | CI/CD, deployment, automation            |
| Developer Experience | onboarding, contributor tools            |

---

## 📄 License

This project is licensed under the **MIT License**.

See the `LICENSE` file for details.

---

## ⭐ Support the Project

If you find OpenSourceMate useful or are interested in its development:

* ⭐ Star the repository
* 🐛 Report bugs
* 💡 Suggest features
* 🔧 Submit pull requests
* 📖 Improve documentation

Every contribution helps make open-source participation easier for developers.

---

## 👩‍💻 Author

**Muskan Kumari**

GitHub: [@Muskankr](https://github.com/Muskankr)

---

<p align="center">
  Built to make open-source contribution discovery easier.
</p>

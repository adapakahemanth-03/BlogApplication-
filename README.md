# 🚀 BlogPlus — Full-Stack Content Platform

BlogPlus is a modern, high-performance, full-stack blogging application. It combines a robust, secure **Spring Boot REST API** backend with a highly responsive, clean, and intuitive **React & Tailwind CSS** frontend styled natively using **Shadcn UI** primitives.

The platform is architected around a fluid, full-width scrolling feed layout—delivering an immersive social reading experience similar to modern networks like Twitter/X, Medium, and LinkedIn.

---

## 📁 Project Architecture & Folder Structure

The project is organized into two completely decoupled root directories to maintain a strict separation of concerns, making local development and cloud deployment effortless.

```text
Blog_App/
│
├── 📂 client/                   # Frontend React Application (Vite + TS)
│   ├── 📂 src/
│   │   ├── 📂 assets/           # Global visual assets & SVGs
│   │   ├── 📂 components/       # UI Presentation Layer
│   │   │   ├── 📂 ui/           # Atomic Shadcn Components (Card, Dialog, Button)
│   │   │   ├── 📄 Navbar.tsx    # Global navigation with brand identity
│   │   │   └── 📄 PostCard.tsx  # Full-width horizontal blog card with feed features
│   │   ├── 📂 context/          # State Management
│   │   │   └── 📄 AuthContext.tsx # User session and access tokens tracking
│   │   ├── 📂 lib/
│   │   │   └── 📄 api.ts        # Environment-aware centralized fetch layer
│   │   └── 📂 types/
│   │       └── 📄 index.ts      # TypeScript interfaces for Post, User, and Comments
│   ├── 📄 tailwind.config.js    # Utility design system mapping
│   ├── 📄 package.json          # Dependency trees & build pipelines
│   └── 📄 .gitignore            # Excludes node_modules, dist, and .env files
│
└── 📂 server/                   # Backend Microservice (Spring Boot)
    ├── 📂 src/main/java/com/sample/blogapplication/
    │   ├── 📄 BlogApplication.java   # Core application bootstrap entry point
    │   ├── 📂 controller/       # Rest API Entry Layer (Exposes routes to client)
    │   ├── 📂 model/            # Data Layer Entities (User, Post, Comment schema mappings)
    │   ├── 📂 repository/       # Database Interface Abstractions (JPA Data Queries)
    │   └── 📂 service/          # Core Business Execution Logic
    ├── 📂 src/main/resources/
    │   └── 📄 application.properties # System environment ports & DB links
    ├── 📄 pom.xml               # Maven Dependency Configuration Tree
    └── 📄 .gitignore            # Excludes target folder, logs, and wrapper flags
```

---

## 🔄 Application Architecture & Data Flow

BlogPlus operates on a fully decoupled, state-driven transaction model. The diagram below illustrates how components interact across layers when a user requests or modifies articles:

```text
[ USER INTERACTION ]
       │ 
       ▼
 ┌───────────┐         HTTP (Fetch API)       ┌─────────────────┐
 │   React   │ ─────────────────────────────> │   Spring Boot   │
 │  Client   │                                │   REST API      │
 │ (Frontend)│ <───────────────────────────── │   (Backend)     │
 └───────────┘          JSON Response         └─────────────────┘
       │                                               │
       ▼ (State Hooks)                                 ▼ (Spring Data JPA)
 ┌───────────┐                                ┌─────────────────┐
 │ Shadcn UI │                                │                 │
 │ Feed Card │                                │   MySQL DB      │
 └───────────┘                                └─────────────────┘
```

### Detailed Lifecycle of a Request:
1. **Trigger:** A user clicks on the **Articles** tab. The interface calls `fetch()` configured dynamically through `lib/api.ts`.
2. **Network Route:** The request targets `process.env.VITE_API_URL` (falling back to `http://localhost:8080/api/blogs`).
3. **Controller Interception:** The Spring Boot `@RestController` processes the incoming mapping, handles security filters, and requests data from the service tier.
4. **Data Aggregation:** The Repository pulls relational records, ordering posts chronologically so the newest blogs appear at the absolute top.
5. **UI Rendering:** The backend pipes out a clean JSON payload. React parses the object array directly into state hooks, generating individual horizontal full-width content boxes populated with content, native emojis, likes, and comments.

---

## ✨ Key Features

- **Immersive Feed Layout:** Articles are displayed in premium, full-width horizontal cards arranged chronologically, featuring full text visibility directly on the timeline.
- **Rich Interaction Suite:** Integrated real-time Like systems and multi-nested Comment sections appended gracefully inside every article block.
- **Native Emoji Support:** Comprehensive UTF-8 emoji parsing natively supported from the editor composition pane through to database persistence.
- **Personal Workspace ("My Blogs"):** Dynamic user isolation metrics allowing creators to view, track, and manage their personalized authored history.
- **Robust Authentication:** Production-ready authentication engine with custom contextual error handlers providing explicit user direction.
- **Clean Responsive Styling:** Zero bloated custom CSS. Engineered entirely on standard utility layers using **Tailwind CSS** and **Shadcn UI**.

---

## 🚀 Local Development Setup

To run this application locally on your machine, clone the repository and split your workflow into two active terminal instances.

### Prerequisites
- Node.js (v18+ recommended)
- Java JDK 17 or higher
- Maven (included via wrapper scripts)

---

### Step 1: Start the Backend Server
Open your first terminal window, navigate to the server module, and boot the Spring runtime environment:

```bash
cd server
./mvnw spring-boot:run
```
*The API gateway will initialize on its native default port: `http://localhost:8080`.*

### Step 2: Start the Frontend Client
Open a second terminal window, navigate to the client container, restore node packages, and spin up the hot-reloading development server:

```bash
cd client
npm install
npm run dev
```
*The interface client layer will mount and provide a local hosting address (typically `http://localhost:5173`).*

---

## 🌐 Production & Deployment Architecture

This ecosystem is fully environment-variable driven and decoupled, allowing for effortless individual layer compilation and zero-downtime standard cloud deployment pipelines.

- **Frontend Variables:** The network fetching layer auto-binds to `VITE_API_URL` dynamically, allowing target compilation deployments to platforms like **Vercel** or **Netlify**.
- **Backend Portability:** The Spring instance is optimized for containerization or standard single-dyno hosting instances like **Render**, **Railway**, or **AWS Elastic Beanstalk**.

---

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.



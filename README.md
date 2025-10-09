# Revizio: Your AI-Powered Study Companion

Revizio is a fully functional, AI-driven web application designed to transform any PDF coursebook into an interactive learning experience. It serves as a virtual teaching companion that helps students revise material through auto-generated quizzes, a document-aware chat assistant, and personalized video recommendations.

**Live URL:** [https://revizio-mocha.vercel.app/](https://revizio-mocha.vercel.app/)

---

## How It Was Built

This project was built from the ground up in just a few days using a modern, full-stack TypeScript architecture, aggressively leveraging AI tools to accelerate development.

* **Frontend:** [Next.js](https://nextjs.org/) (App Router) with React 19, styled with [Tailwind CSS](https://tailwindcss.com/) and a professional component library built using [shadcn/ui](https://ui.shadcn.com/), [Sonner](https://sonner.emilkowal.ski/) for notifications, and [Recharts](https://recharts.org/) for data visualization.
* **Backend Platform:** [Supabase](https://supabase.com/) served as the all-in-one backend, providing:
    * **Database:** Supabase's cloud-native PostgreSQL for storing user data, PDF metadata, and quiz results.
    * **Storage:** For hosting and serving all uploaded PDF files.
    * **Authentication:** Handled user sessions securely, including anonymous sign-ins.
    * **Edge Functions:** Deployed serverless Deno functions for all dynamic, AI-powered logic.
* **AI & Embeddings:**
    * **Orchestration:** [LangChain.js](https://js.langchain.com/) was used to structure interactions with various AI models.
    * **Quiz & Chat Generation:** OpenAI's `gpt-3.5-turbo` model was used for generating quizzes and conversational responses.
    * **Embeddings:** OpenAI's text embedding models were used to convert PDF text into vector embeddings for the RAG pipeline.
    * **Vector Database:** Supabase's `pg_vector` extension was used for efficient vector similarity search.
* **External Services:**
    * **Google's YouTube Data API:** To fetch relevant educational videos based on user's weak topics.
* **Deployment:** The application is deployed on [Vercel](https://vercel.com) with a CI/CD pipeline connected to the GitHub repository.

---

## Features

### ✅ Must-Have Features
- **PDF Management:** Users can upload their own PDF coursebooks and select from a list of previously uploaded documents.
- **Split-Screen PDF Viewer:** A responsive UI displays the selected PDF alongside an interactive panel for quizzing and chat.
- **Dynamic Quiz Engine:** Generates a variety of questions (MCQs, SAQs, LAQs) from the PDF content on demand.
- **Interactive Quizzing:** Users can answer questions, submit for instant scoring (for MCQs), and view correct answers with detailed, AI-generated explanations.
- **Comprehensive Progress Tracking:** A dedicated dashboard tracks the user's learning journey with:
    - Aggregate stats (total quizzes, average score).
    - A line chart visualizing score progress over time.
    - A detailed history of all quiz attempts.
    - An analysis of the user's **Strengths & Weaknesses** based on question topics.

### ✨ Nice-to-Have Features
- **ChatGPT-Inspired Chat UI:** A clean, modern chat interface allows users to have a conversation with their documents.
- **RAG-Powered Chat with Citations:** The chat is powered by a full RAG (Retrieval-Augmented Generation) pipeline. The AI assistant answers questions based *only* on the content of the selected PDF and provides citations for its answers.
- **YouTube Video Recommender:** The dashboard intelligently recommends relevant YouTube videos based on the topics the user has struggled with in their quizzes.

---

## My Use of LLM Tools

As per the assignment's recommendation, AI tools were integral to the rapid development of this project. I worked alongside **Google's Gemini 2.5 Pro** as my primary development partner.

1.  **High-Level Strategy & Planning:** Gemini generated the initial 3-day project plan, suggested the technology stack (Next.js + Supabase), and provided the high-level architecture for the RAG pipeline.
2.  **Code Generation & Boilerplate:** It generated foundational code for:
    * React components (e.g., the `ChatView`, `QuizView`, and dashboard cards).
    * Supabase Edge Functions, including the initial versions for PDF processing and AI interactions.
    * SQL schemas for the PostgreSQL database.
3.  **Complex Debugging:** This was the most critical use case. Gemini was instrumental in solving a wide range of challenging issues, including:
    * Resolving persistent CORS errors between the frontend and Supabase functions.
    * Debugging numerous dependency conflicts, especially with `react-pdf` and its incompatibility with React 19 and Next.js's Turbopack.
    * Fixing subtle bugs in server-side data fetching for the dashboard.
    * Correcting incorrect import paths in Deno Edge Functions that were causing silent crashes.
4.  **Creative Assets:** The prompt to generate the application's favicon was created with Gemini's assistance and executed using **Grok 4**.
5.  **Documentation:** This README file was structured and written with Gemini's help, based on an analysis of the final codebase.

---

## How to Run Locally

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/Mohd-Ashhar/revizio.git](https://github.com/Mohd-Ashhar/revizio.git)
    cd revizio
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set up environment variables:**
    * Create a new file named `.env.local` in the root of the project.
    * Add your Supabase, OpenAI, and YouTube API keys:
        ```env
        NEXT_PUBLIC_SUPABASE_URL="YOUR_SUPABASE_PROJECT_URL"
        NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
        OPENAI_API_KEY="YOUR_OPENAI_API_KEY"
        YOUTUBE_API_KEY="YOUR_YOUTUBE_DATA_API_KEY"
        ```
4.  **Run the development server:**
    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) to view the app.
# Revizio: Your AI-Powered Study Companion

Revizio is a web application designed to help students study more effectively from their PDF coursebooks by generating interactive quizzes and providing a conversational learning experience.

**Live URL:** [Insert Your Vercel URL Here]

## How It Was Built

This project was built using a modern, full-stack TypeScript architecture:

- **Frontend:** [Next.js](https://nextjs.org/) with React 19, styled using [Tailwind CSS](https://tailwindcss.com/) and [shadcn/ui](https://ui.shadcn.com/) components.
- **Backend:** [Supabase](https://supabase.com/) was used as a comprehensive backend-as-a-service for:
  - **Database:** PostgreSQL for storing user data, PDF metadata, and quiz results.
  - **Storage:** For hosting and serving uploaded PDF files.
  - **Edge Functions:** Serverless Deno functions for handling PDF processing and AI logic.
- **AI & Embeddings:**
  - **LangChain.js:** To orchestrate interactions with large language models.
  - **OpenAI:** Used for both quiz generation (`gpt-3.5-turbo`) and creating text embeddings for RAG.
  - **pg_vector:** PostgreSQL extension for efficient vector similarity search.
- **Deployment:** The application is deployed on [Vercel](https://vercel.com).

## Features

### What's Done (Must-Have Features)

- [x] **PDF Management:** Users can upload their own PDF coursebooks and select from a list of previously uploaded documents.
- [x] **PDF Viewer:** A split-screen UI to display the selected PDF alongside the interactive quiz/chat panel.
- [x] **Quiz Generation:** Dynamically generates Multiple Choice (MCQ), Short Answer (SAQ), and Long Answer (LAQ) questions from the PDF content.
- [x] **Interactive Quizzing:** Users can answer questions, submit their quiz, and receive an instant score for MCQs.
- [x] **Results & Explanations:** After submission, the app displays the user's answers, the correct answers, and detailed explanations for each question.
- [x] **Progress Tracking Dashboard:** A comprehensive dashboard that shows:
  - Aggregate stats (total quizzes, average score).
  - A chart visualizing score progress over time.
  - A detailed history of all quiz attempts.
  - Analysis of a user's strengths and weaknesses based on question topics.

### What's Missing (Trade-offs)

- The "Nice-to-Have" RAG-powered Chat UI was implemented on the backend but was not integrated into the frontend UI as a trade-off to ensure all "Must-Have" features were completed and polished before the deadline.

## My Use of LLM Tools

I used an AI assistant (Google's Gemini) extensively throughout this project to accelerate development, per the assignment's recommendation. Key uses included:

1.  **Project Planning:** Generating the initial 3-day project plan and technology stack.
2.  **Code Generation:** Creating boilerplate for React components, Supabase Edge Functions, and SQL schemas.
3.  **Debugging:** Solving complex issues related to CORS, dependency conflicts (`react-pdf`), and server-side data fetching.
4.  **Documentation:** Generating this README template.

## How to Run Locally

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/revizio.git](https://github.com/your-username/revizio.git)
    cd revizio
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set up environment variables:**
    - Create a file named `.env.local` in the root of the project.
    - Add your Supabase and OpenAI keys:
      ```env
      NEXT_PUBLIC_SUPABASE_URL="YOUR_SUPABASE_PROJECT_URL"
      NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
      OPENAI_API_KEY="YOUR_OPENAI_API_KEY"
      ```
4.  **Run the development server:**
    `bash
    npm run dev
    `
    Open [http://localhost:3000](http://localhost:3000) to view the app.

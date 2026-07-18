# Gympulse

A sleek, premium full-stack fitness and AI-powered nutrition tracking platform. Gympulse eliminates the friction of manual workout logging and dietary tracking by utilizing intelligent templating engines and AI vision analysis.

## Tech Stack
* **Frontend:** React.js, Tailwind CSS
* **Backend:** Node.js, Express.js
* **Database:** MongoDB, Mongoose
* **AI Integration:** Google Gemini Vision API
* **Authentication:** JWT, Google OAuth 2.0
* **Media Storage:** Cloudinary
* **Email Services:** Nodemailer

## Core Features

### 1. The Blueprint Engine (Workout Architecture)
* **Custom & System Templates:** Load pre-defined routines (e.g., Push/Pull/Legs) or build and save customized user-specific blueprints.
* **Smart Auto-Fill:** Instantly populates active workout sessions with weights and reps from the user's previous historical session of that specific template.
* **Strict Data Sanitization:** Custom frontend validation aggressively filters empty, partial, or invalid sets before API submission, ensuring absolute database integrity.
* **Unified Exercise Library:** A pre-populated, categorized database of exercises with targeted body parts and text instructions.

### 2. AI Nutrition & Calorie Engine
* **Vision-Based Tracking:** Replaces manual macro tracking. Users upload a photo of their meal and a brief description.
* **Objective Macro Extraction:** Integrates the Gemini Vision API to analyze meal photos, estimate portion sizes, and extract raw macronutrients (Calories, Protein, Carbs, Fats) via a strict JSON parser.
* **Custom Goal Management:** Users set highly specific, user-defined nutritional targets.
* **Live Dashboard:** Real-time progress tracking showing remaining daily deficits or surpluses.

### 3. Identity, Security, & Social Export
* **Seamless Authentication:** One-click Google Sign-In via OAuth 2.0 alongside traditional JWT-based email/password registration.
* **Password Recovery Pipeline:** Secure, time-limited token generation and email dispatch via Nodemailer for account recovery.
* **Profile Management:** Integration with Cloudinary for secure, local-device profile image uploads without database bloat.
* **Social Export:** Utilizes HTML Canvas to automatically generate highly styled, downloadable summary cards of completed workouts and newly broken Personal Records (PRs).

## Installation & Setup

### Prerequisites
* Node.js installed
* MongoDB instance (local or MongoDB Atlas)
* Google Gemini API Key
* Cloudinary Account
* Google Cloud Console Account (for OAuth Client ID)

### Local Development

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/yourusername/gympulse.git](https://github.com/yourusername/gympulse.git)
   cd gympulse
   ```

2. **Install backend dependencies:**
   ```bash
   cd gympulse-backend
   npm install
   ```

3. **Install frontend dependencies:**
   ```bash
   cd ../gympulse-frontend
   npm install
   ```

4. **Environment Variables:**
   Create a `.env` file in the `gympulse-backend` root directory and configure the following variables:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   GEMINI_API_KEY=your_google_gemini_key
   CLIENT_ID=your_google_oauth_client_id
   CLIENT_SECRET=your_google_oauth_client_secret
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   EMAIL_USER=your_nodemailer_email
   EMAIL_PASS=your_nodemailer_app_password
   ```

5. **Start the application:**
   Open two terminal windows.
   
   Terminal 1 (Backend):
   ```bash
   cd gympulse-backend
   npm run dev
   ```

   Terminal 2 (Frontend):
   ```bash
   cd gympulse-frontend
   npm run dev
   ```

## Design Philosophy
Gympulse was built with a strict adherence to a minimal, premium dark-mode aesthetic. The architecture prioritizes a frictionless user experience, featuring fluid state transitions, non-intrusive feedback mechanisms, and a fully responsive design engineered for seamless operation across both mobile and desktop environments.

---
**Developed by:** Anuruddh Pratap Singh

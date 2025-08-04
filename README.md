# QR Generator - QREA

A modern web application for generating and customizing QR codes, built with Vue 3 and Vite.

## 🚀 Features

- **Customizable QR Generation**: Create QR codes with personalized content
- **Advanced Visual Editor**: Intuitive interface for real-time editing
- **Complete Customization**:
  - Configurable sizes (200-600px)
  - Custom background and foreground colors
  - Gradient support
  - Adjustable margins
  - Advanced styling options
- **User Management**: Authentication system with Supabase
- **Integrated Payments**: Subscription support via Stripe
- **Multilingual**: Support for Italian and English
- **Responsive Design**: Optimized for desktop and mobile
- **Robust Backend**: Node.js API with Express

## 🛠️ Tech Stack

### Frontend

- **Vue 3** with Composition API and `<script setup>`
- **Vite** for build tooling and dev server
- **Vue Router** for navigation
- **Vue I18n** for internationalization
- **Tailwind CSS** for styling
- **Lucide Vue** for icons
- **QR Code Styling** for QR generation

### Backend

- **Node.js** with Express
- **Supabase** for database and authentication
- **Stripe** for payments
- **Resend** for email delivery

## 📦 Installation

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn

### Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Backend Setup

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Start development server
npm run dev

# Start in production
npm start
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the project root and backend with the following variables:

**Frontend (.env)**

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

**Backend (.env)**

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
STRIPE_SECRET_KEY=your_stripe_secret_key
RESEND_API_KEY=your_resend_api_key
```

## 🚀 Deployment

### Frontend (Vercel)

The project is configured for Vercel deployment. See `vercel.json` for configuration.

### Backend (Fly.io)

The backend is configured for Fly.io deployment. See `fly.toml` for configuration.

```bash
# Deploy backend to Fly.io
cd backend
fly deploy
```

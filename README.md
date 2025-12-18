# Budget AI - Personal Finance App

A budgeting app I built for the Hackathon Challenge 2025. It helps you track spending, manage budgets, set savings goals, and get AI-powered financial advice.

## What It Does

Track everything money-related:
- Income from different sources
- Expenses by category with budgets
- Savings goals with progress tracking
- Investments (stocks, crypto, etc.) with returns
- Debts with payoff tracking
- Recurring bills and subscriptions
- AI chat assistant for financial questions
- Spending insights and predictions

## Getting Started

You'll need Python 3.8+ and Node.js 16+ installed.

### Quick Setup

**Windows:** Double-click `setup.bat` then `start.bat`

**Mac/Linux:** 
```bash
chmod +x setup.sh start.sh
./setup.sh
./start.sh
```

### Manual Setup

1. Install backend dependencies:
```bash
cd backend
pip install -r requirements.txt
```

2. Install frontend dependencies:
```bash
cd frontend
npm install --legacy-peer-deps
```

3. (Optional) Add ChatGPT API key for better AI:
   - Create `backend/.env` file
   - Add: `OPENAI_API_KEY=your_key_here`
   - Get key from https://platform.openai.com/

### Running It

**Backend (Terminal 1):**
```bash
cd backend
python app.py
```

**Frontend (Terminal 2):**
```bash
cd frontend
npm run dev
```

Then open http://localhost:3000 in your browser.

## How to Use

1. **Add Income**: Go to Budget tab, click "Add Income"
2. **Set Budgets**: Edit category limits in Budget tab
3. **Track Expenses**: Expenses tab → Add Expense (AI suggests category if you type description)
4. **Savings Goals**: Savings tab → Create goals and track progress
5. **Investments**: Investments tab → Add your portfolio
6. **Debts**: Debts tab → Track what you owe
7. **AI Helper**: Ask questions like "How much should I save?" or "Am I spending too much?"

## Features

- **Auto-categorization**: Type expense description, AI picks the category
- **Budget alerts**: Get warned when approaching limits
- **Spending trends**: See charts of where your money goes
- **Predictions**: AI predicts future spending
- **Net worth**: Calculates your total financial position
- **Export**: Download all your data

## Tech Stuff

- Backend: Flask (Python) with SQLite database
- Frontend: React with Vite, Tailwind CSS
- AI: OpenAI API (optional, has fallback)
- Charts: Recharts library

## Privacy

All data stays on your computer. No bank connections, no real financial data required. The database file is local to your machine.

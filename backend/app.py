"""
Flask API server for Budget AI - handles all backend operations including database, AI integration, and financial calculations.
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os
from datetime import datetime, timedelta
import json
from typing import Dict
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)
load_dotenv()

try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

app = Flask(__name__)
CORS(app)

DATABASE = 'budget.db'

def init_db():
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    
    c.execute('''CREATE TABLE IF NOT EXISTS income
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  amount REAL NOT NULL,
                  source TEXT,
                  date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  period TEXT DEFAULT 'monthly')''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS categories
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name TEXT UNIQUE NOT NULL,
                  budget_limit REAL,
                  color TEXT DEFAULT '#3B82F6')''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS expenses
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  amount REAL NOT NULL,
                  category_id INTEGER,
                  description TEXT,
                  date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  FOREIGN KEY (category_id) REFERENCES categories(id))''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS savings_goals
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name TEXT NOT NULL,
                  target_amount REAL NOT NULL,
                  current_amount REAL DEFAULT 0,
                  deadline DATE,
                  description TEXT,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS investments
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name TEXT NOT NULL,
                  type TEXT NOT NULL,
                  amount REAL NOT NULL,
                  purchase_date DATE,
                  current_value REAL,
                  notes TEXT,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS debts
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name TEXT NOT NULL,
                  total_amount REAL NOT NULL,
                  remaining_amount REAL NOT NULL,
                  interest_rate REAL DEFAULT 0,
                  due_date DATE,
                  description TEXT,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS recurring_expenses
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name TEXT NOT NULL,
                  amount REAL NOT NULL,
                  category_id INTEGER,
                  frequency TEXT DEFAULT 'monthly',
                  next_due_date DATE,
                  is_active INTEGER DEFAULT 1,
                  FOREIGN KEY (category_id) REFERENCES categories(id))''')
    
    default_categories = [
        ('Food', 200, '#EF4444'),
        ('Transport', 100, '#3B82F6'),
        ('Fun', 150, '#10B981'),
        ('Shopping', 100, '#F59E0B'),
        ('Other', 50, '#8B5CF6')
    ]
    
    for name, limit, color in default_categories:
        c.execute('INSERT OR IGNORE INTO categories (name, budget_limit, color) VALUES (?, ?, ?)',
                  (name, limit, color))
    
    conn.commit()
    conn.close()

init_db()

def get_api_key():
    api_key = os.getenv('OPENAI_API_KEY') or os.environ.get('OPENAI_API_KEY')
    
    if not api_key:
        env_file = os.path.join(os.path.dirname(__file__), '.env')
        if os.path.exists(env_file):
            try:
                with open(env_file, 'r') as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith('#') and 'OPENAI_API_KEY' in line:
                            if '=' in line:
                                api_key = line.split('=', 1)[1].strip()
                                break
            except:
                pass
    
    if api_key:
        api_key = api_key.strip('"').strip("'").strip()
        if api_key.lower() in ['your_openai_api_key_here', 'your_key_here', '', 'none', 'null']:
            api_key = None
    
    return api_key

def get_ai_response(user_message: str, user_data: Dict) -> str:
    api_key = get_api_key()
    
    if api_key and OPENAI_AVAILABLE:
        try:
            return get_openai_response(user_message, user_data, api_key)
        except Exception as e:
            print(f"OpenAI error: {e}")
            return get_rule_based_response(user_message, user_data)
    else:
        return get_rule_based_response(user_message, user_data)

def get_openai_response(user_message: str, user_data: Dict, api_key: str = None) -> str:
    if not OPENAI_AVAILABLE:
        return get_rule_based_response(user_message, user_data)
    
    if not api_key:
        api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        return get_rule_based_response(user_message, user_data)
    
    system_prompt = """You're a helpful budgeting assistant for teens. Give practical, encouraging advice in simple language. Keep it short and friendly."""
    
    category_spending = user_data.get('category_spending', {})
    spending_breakdown = "\n".join([f"  - {cat}: ${amt:.2f}" for cat, amt in category_spending.items()])
    
    context = f"""User's finances:
    - Income: ${user_data.get('total_income', 0):.2f}
    - Expenses: ${user_data.get('total_expenses', 0):.2f}
    - Remaining: ${user_data.get('remaining_budget', 0):.2f}
    - Spending: {spending_breakdown if spending_breakdown else "  - No expenses yet"}
    - Top Category: {user_data.get('top_category', 'N/A')}
    - Goals: {user_data.get('savings_goals', [])}
    """
    
    try:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=api_key)
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "system", "content": context},
                    {"role": "user", "content": user_message}
                ],
                max_tokens=300,
                temperature=0.8
            )
            return response.choices[0].message.content.strip()
        except:
            try:
                openai.api_key = api_key
                response = openai.ChatCompletion.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "system", "content": context},
                        {"role": "user", "content": user_message}
                    ],
                    max_tokens=300,
                    temperature=0.8
                )
                return response.choices[0].message.content.strip()
            except:
                return get_rule_based_response(user_message, user_data)
    except Exception as e:
        print(f"OpenAI error: {e}")
        return get_rule_based_response(user_message, user_data)

def get_rule_based_response(user_message: str, user_data: Dict) -> str:
    message_lower = user_message.lower()
    total_income = user_data.get('total_income', 0)
    total_expenses = user_data.get('total_expenses', 0)
    remaining = user_data.get('remaining_budget', 0)
    category_spending = user_data.get('category_spending', {})
    
    if 'save' in message_lower or 'saving' in message_lower:
        if total_income > 0:
            suggested_savings = total_income * 0.2
            return f"💡 Try saving 20% of your income. With ${total_income:.2f} income, aim for ${suggested_savings:.2f} this month. Even $10-20 a week helps!"
        return "💡 Start with 20% of your income. Small amounts like $10-20 per week add up fast!"
    
    if 'spend' in message_lower or 'spending' in message_lower or 'too much' in message_lower:
        if category_spending:
            top_category = max(category_spending.items(), key=lambda x: x[1])
            top_name, top_amount = top_category
            percentage = (top_amount / total_expenses * 100) if total_expenses > 0 else 0
            return f"📊 Your biggest expense is {top_name} at ${top_amount:.2f} ({percentage:.1f}% of spending). Try setting a weekly limit!"
        return "📊 Track expenses for a week to see where your money goes!"
    
    if 'budget' in message_lower or 'how much' in message_lower:
        if total_income > 0:
            return f"💰 Income: ${total_income:.2f}, Expenses: ${total_expenses:.2f}, Left: ${remaining:.2f}. Try saving ${total_income * 0.2:.2f}!"
        return "💰 Add your income first, then set category budgets. Try 50% needs, 30% wants, 20% savings!"
    
    if 'eat' in message_lower and 'out' in message_lower:
        food_spending = category_spending.get('Food', 0)
        if food_spending > 200:
            return f"🍔 You've spent ${food_spending:.2f} on food. Try cooking at home more - you could save $50-100/month!"
        return "🍔 Eating out adds up fast! Limit it to 2-3 times a week and cook more at home."
    
    if 'tip' in message_lower or 'advice' in message_lower or 'help' in message_lower:
        tips = [
            "💡 Track every expense, even small ones!",
            "💡 Use 50/30/20: 50% needs, 30% wants, 20% savings",
            "💡 Set weekly limits for fun categories",
            "💡 Review spending weekly",
            "💡 Save before you spend!"
        ]
        import random
        return random.choice(tips)
    
    return "🤖 I can help with budgeting! Ask about saving, spending habits, or budgeting tips."

@app.route('/', methods=['GET'])
def root():
    return jsonify({
        'message': 'Budget AI Backend API',
        'status': 'running',
        'endpoints': {
            'health': '/api/health',
            'income': '/api/income',
            'categories': '/api/categories',
            'expenses': '/api/expenses',
            'summary': '/api/summary',
            'ai_chat': '/api/ai/chat'
        }
    })

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'})

@app.route('/api/income', methods=['GET'])
def get_income():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute('SELECT * FROM income ORDER BY date_added DESC')
    income_records = [dict(row) for row in c.fetchall()]
    conn.close()
    
    total = sum(record['amount'] for record in income_records)
    return jsonify({'income': income_records, 'total': total})

@app.route('/api/income', methods=['POST'])
def add_income():
    data = request.json
    amount = float(data.get('amount', 0))
    source = data.get('source', 'Other')
    period = data.get('period', 'monthly')
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('INSERT INTO income (amount, source, period) VALUES (?, ?, ?)',
              (amount, source, period))
    conn.commit()
    income_id = c.lastrowid
    conn.close()
    
    return jsonify({'id': income_id, 'amount': amount, 'source': source, 'period': period}), 201

@app.route('/api/income/<int:income_id>', methods=['DELETE'])
def delete_income(income_id):
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('DELETE FROM income WHERE id = ?', (income_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Income deleted'}), 200

@app.route('/api/categories', methods=['GET'])
def get_categories():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute('SELECT * FROM categories ORDER BY name')
    categories = [dict(row) for row in c.fetchall()]
    conn.close()
    return jsonify(categories)

@app.route('/api/categories', methods=['POST'])
def add_category():
    data = request.json
    name = data.get('name')
    budget_limit = float(data.get('budget_limit', 0))
    color = data.get('color', '#3B82F6')
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    try:
        c.execute('INSERT INTO categories (name, budget_limit, color) VALUES (?, ?, ?)',
                  (name, budget_limit, color))
        conn.commit()
        category_id = c.lastrowid
        conn.close()
        return jsonify({'id': category_id, 'name': name, 'budget_limit': budget_limit, 'color': color}), 201
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Category already exists'}), 400

@app.route('/api/categories/<int:category_id>', methods=['PUT'])
def update_category(category_id):
    data = request.json
    budget_limit = float(data.get('budget_limit', 0))
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('UPDATE categories SET budget_limit = ? WHERE id = ?', (budget_limit, category_id))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Category updated'}), 200

@app.route('/api/expenses', methods=['GET'])
def get_expenses():
    period = request.args.get('period', 'month')
    
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    if period == 'month':
        start_date = datetime.now().replace(day=1).strftime('%Y-%m-%d')
    elif period == 'week':
        start_date = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
    else:
        start_date = '2020-01-01'
    
    c.execute('''SELECT e.*, c.name as category_name, c.color as category_color
                 FROM expenses e
                 LEFT JOIN categories c ON e.category_id = c.id
                 WHERE date(e.date_added) >= ?
                 ORDER BY e.date_added DESC''', (start_date,))
    expenses = [dict(row) for row in c.fetchall()]
    conn.close()
    return jsonify(expenses)

@app.route('/api/expenses', methods=['POST'])
def add_expense():
    data = request.json
    amount = float(data.get('amount', 0))
    category_id = int(data.get('category_id'))
    description = data.get('description', '')
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('INSERT INTO expenses (amount, category_id, description) VALUES (?, ?, ?)',
              (amount, category_id, description))
    conn.commit()
    expense_id = c.lastrowid
    conn.close()
    
    return jsonify({'id': expense_id, 'amount': amount, 'category_id': category_id, 'description': description}), 201

@app.route('/api/expenses/<int:expense_id>', methods=['DELETE'])
def delete_expense(expense_id):
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('DELETE FROM expenses WHERE id = ?', (expense_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Expense deleted'}), 200

@app.route('/api/summary', methods=['GET'])
def get_summary():
    period = request.args.get('period', 'month')
    
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    c.execute('SELECT SUM(amount) as total FROM income')
    total_income = c.fetchone()['total'] or 0
    
    if period == 'month':
        start_date = datetime.now().replace(day=1).strftime('%Y-%m-%d')
    elif period == 'week':
        start_date = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
    else:
        start_date = '2020-01-01'
    
    c.execute('''SELECT c.name, SUM(e.amount) as total, c.budget_limit, c.color
                 FROM expenses e
                 JOIN categories c ON e.category_id = c.id
                 WHERE date(e.date_added) >= ?
                 GROUP BY c.id, c.name, c.budget_limit, c.color''', (start_date,))
    
    category_spending = {}
    total_expenses = 0
    top_category = None
    top_amount = 0
    
    for row in c.fetchall():
        name = row['name']
        amount = row['total']
        category_spending[name] = amount
        total_expenses += amount
        if amount > top_amount:
            top_amount = amount
            top_category = name
    
    remaining_budget = total_income - total_expenses
    
    c.execute('SELECT name, budget_limit FROM categories')
    category_budgets = {row['name']: row['budget_limit'] for row in c.fetchall()}
    
    conn.close()
    
    return jsonify({
        'total_income': total_income,
        'total_expenses': total_expenses,
        'remaining_budget': remaining_budget,
        'category_spending': category_spending,
        'category_budgets': category_budgets,
        'top_category': top_category,
        'period': period
    })

@app.route('/api/ai/chat', methods=['POST'])
def ai_chat():
    data = request.json
    user_message = data.get('message', '')
    
    summary = get_summary().get_json()
    
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    c.execute('SELECT SUM(amount) as total FROM income')
    total_income = c.fetchone()['total'] or 0
    
    start_date = datetime.now().replace(day=1).strftime('%Y-%m-%d')
    c.execute('SELECT SUM(amount) as total FROM expenses WHERE date(date_added) >= ?', (start_date,))
    total_expenses = c.fetchone()['total'] or 0
    
    c.execute('SELECT SUM(current_value) as total FROM investments')
    total_investments = c.fetchone()['total'] or 0
    
    c.execute('SELECT SUM(current_amount) as total FROM savings_goals')
    total_savings = c.fetchone()['total'] or 0
    
    c.execute('SELECT SUM(remaining_amount) as total FROM debts')
    total_debts = c.fetchone()['total'] or 0
    
    c.execute('SELECT * FROM savings_goals')
    goals = [dict(row) for row in c.fetchall()]
    
    c.execute('SELECT * FROM investments')
    investments = [dict(row) for row in c.fetchall()]
    
    c.execute('SELECT * FROM debts')
    debts = [dict(row) for row in c.fetchall()]
    
    conn.close()
    
    net_worth = total_income - total_expenses + total_investments + total_savings - total_debts
    
    user_data = {
        'total_income': summary['total_income'],
        'total_expenses': summary['total_expenses'],
        'remaining_budget': summary['remaining_budget'],
        'category_spending': summary['category_spending'],
        'top_category': summary['top_category'],
        'savings_goals': goals,
        'investments': investments,
        'debts': debts,
        'net_worth': net_worth,
        'total_investments': total_investments,
        'total_debts': total_debts
    }
    
    response = get_ai_response(user_message, user_data)
    return jsonify({'response': response})

@app.route('/api/goals', methods=['GET'])
def get_goals():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute('SELECT * FROM savings_goals ORDER BY created_at DESC')
    goals = [dict(row) for row in c.fetchall()]
    conn.close()
    return jsonify(goals)

@app.route('/api/goals', methods=['POST'])
def add_goal():
    data = request.json
    name = data.get('name')
    target_amount = float(data.get('target_amount', 0))
    deadline = data.get('deadline')
    description = data.get('description', '')
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('''INSERT INTO savings_goals (name, target_amount, deadline, description)
                 VALUES (?, ?, ?, ?)''', (name, target_amount, deadline, description))
    conn.commit()
    goal_id = c.lastrowid
    conn.close()
    
    return jsonify({'id': goal_id, 'name': name, 'target_amount': target_amount, 
                   'current_amount': 0, 'deadline': deadline, 'description': description}), 201

@app.route('/api/goals/<int:goal_id>', methods=['PUT'])
def update_goal(goal_id):
    data = request.json
    current_amount = float(data.get('current_amount', 0))
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('UPDATE savings_goals SET current_amount = ? WHERE id = ?', 
              (current_amount, goal_id))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Goal updated'}), 200

@app.route('/api/goals/<int:goal_id>', methods=['DELETE'])
def delete_goal(goal_id):
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('DELETE FROM savings_goals WHERE id = ?', (goal_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Goal deleted'}), 200

@app.route('/api/trends', methods=['GET'])
def get_trends():
    period = request.args.get('period', 'month')
    days = 30 if period == 'month' else 7
    
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
    c.execute('''SELECT date(date_added) as date, SUM(amount) as total
                 FROM expenses
                 WHERE date(date_added) >= ?
                 GROUP BY date(date_added)
                 ORDER BY date(date_added)''', (start_date,))
    
    daily_totals = [{'date': row['date'], 'amount': row['total']} for row in c.fetchall()]
    
    c.execute('''SELECT c.name, SUM(e.amount) as total, COUNT(e.id) as count
                 FROM expenses e
                 JOIN categories c ON e.category_id = c.id
                 WHERE date(e.date_added) >= ?
                 GROUP BY c.id, c.name
                 ORDER BY total DESC''', (start_date,))
    
    category_trends = [{'name': row['name'], 'total': row['total'], 'count': row['count']} 
                       for row in c.fetchall()]
    
    conn.close()
    
    return jsonify({
        'daily_totals': daily_totals,
        'category_trends': category_trends,
        'period': period
    })

@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    start_date = datetime.now().replace(day=1).strftime('%Y-%m-%d')
    c.execute('''SELECT c.id, c.name, c.budget_limit, COALESCE(SUM(e.amount), 0) as spent
                 FROM categories c
                 LEFT JOIN expenses e ON c.id = e.category_id AND date(e.date_added) >= ?
                 GROUP BY c.id, c.name, c.budget_limit''', (start_date,))
    
    alerts = []
    for row in c.fetchall():
        budget_limit = row['budget_limit'] or 0
        spent = row['spent']
        if budget_limit > 0:
            percentage = (spent / budget_limit) * 100
            if percentage >= 100:
                alerts.append({
                    'type': 'over_budget',
                    'category': row['name'],
                    'message': f"You've exceeded your {row['name']} budget by ${spent - budget_limit:.2f}",
                    'severity': 'high'
                })
            elif percentage >= 80:
                alerts.append({
                    'type': 'warning',
                    'category': row['name'],
                    'message': f"You've used {percentage:.0f}% of your {row['name']} budget",
                    'severity': 'medium'
                })
    
    conn.close()
    return jsonify(alerts)

@app.route('/api/investments', methods=['GET'])
def get_investments():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute('SELECT * FROM investments ORDER BY created_at DESC')
    investments = [dict(row) for row in c.fetchall()]
    conn.close()
    return jsonify(investments)

@app.route('/api/investments', methods=['POST'])
def add_investment():
    data = request.json
    name = data.get('name')
    investment_type = data.get('type', 'Stock')
    amount = float(data.get('amount', 0))
    purchase_date = data.get('purchase_date')
    current_value = float(data.get('current_value', amount))
    notes = data.get('notes', '')
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('''INSERT INTO investments (name, type, amount, purchase_date, current_value, notes)
                 VALUES (?, ?, ?, ?, ?, ?)''',
              (name, investment_type, amount, purchase_date, current_value, notes))
    conn.commit()
    investment_id = c.lastrowid
    conn.close()
    
    return jsonify({'id': investment_id, 'name': name, 'type': investment_type,
                   'amount': amount, 'current_value': current_value}), 201

@app.route('/api/investments/<int:investment_id>', methods=['PUT'])
def update_investment(investment_id):
    data = request.json
    current_value = float(data.get('current_value', 0))
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('UPDATE investments SET current_value = ? WHERE id = ?',
              (current_value, investment_id))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Investment updated'}), 200

@app.route('/api/investments/<int:investment_id>', methods=['DELETE'])
def delete_investment(investment_id):
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('DELETE FROM investments WHERE id = ?', (investment_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Investment deleted'}), 200

@app.route('/api/debts', methods=['GET'])
def get_debts():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute('SELECT * FROM debts ORDER BY created_at DESC')
    debts = [dict(row) for row in c.fetchall()]
    conn.close()
    return jsonify(debts)

@app.route('/api/debts', methods=['POST'])
def add_debt():
    data = request.json
    name = data.get('name')
    total_amount = float(data.get('total_amount', 0))
    remaining_amount = float(data.get('remaining_amount', total_amount))
    interest_rate = float(data.get('interest_rate', 0))
    due_date = data.get('due_date')
    description = data.get('description', '')
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('''INSERT INTO debts (name, total_amount, remaining_amount, interest_rate, due_date, description)
                 VALUES (?, ?, ?, ?, ?, ?)''',
              (name, total_amount, remaining_amount, interest_rate, due_date, description))
    conn.commit()
    debt_id = c.lastrowid
    conn.close()
    
    return jsonify({'id': debt_id, 'name': name, 'total_amount': total_amount,
                   'remaining_amount': remaining_amount}), 201

@app.route('/api/debts/<int:debt_id>', methods=['PUT'])
def update_debt(debt_id):
    data = request.json
    remaining_amount = float(data.get('remaining_amount', 0))
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('UPDATE debts SET remaining_amount = ? WHERE id = ?',
              (remaining_amount, debt_id))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Debt updated'}), 200

@app.route('/api/debts/<int:debt_id>', methods=['DELETE'])
def delete_debt(debt_id):
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('DELETE FROM debts WHERE id = ?', (debt_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Debt deleted'}), 200

@app.route('/api/recurring', methods=['GET'])
def get_recurring():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute('''SELECT r.*, c.name as category_name, c.color as category_color
                 FROM recurring_expenses r
                 LEFT JOIN categories c ON r.category_id = c.id
                 WHERE r.is_active = 1
                 ORDER BY r.next_due_date''')
    recurring = [dict(row) for row in c.fetchall()]
    conn.close()
    return jsonify(recurring)

@app.route('/api/recurring', methods=['POST'])
def add_recurring():
    data = request.json
    name = data.get('name')
    amount = float(data.get('amount', 0))
    category_id = int(data.get('category_id', 0))
    frequency = data.get('frequency', 'monthly')
    next_due_date = data.get('next_due_date')
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('''INSERT INTO recurring_expenses (name, amount, category_id, frequency, next_due_date)
                 VALUES (?, ?, ?, ?, ?)''',
              (name, amount, category_id, frequency, next_due_date))
    conn.commit()
    recurring_id = c.lastrowid
    conn.close()
    
    return jsonify({'id': recurring_id, 'name': name, 'amount': amount}), 201

@app.route('/api/recurring/<int:recurring_id>', methods=['DELETE'])
def delete_recurring(recurring_id):
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('UPDATE recurring_expenses SET is_active = 0 WHERE id = ?', (recurring_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Recurring expense deleted'}), 200

@app.route('/api/overview', methods=['GET'])
def get_overview():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    c.execute('SELECT SUM(amount) as total FROM income')
    total_income = c.fetchone()['total'] or 0
    
    start_date = datetime.now().replace(day=1).strftime('%Y-%m-%d')
    c.execute('SELECT SUM(amount) as total FROM expenses WHERE date(date_added) >= ?', (start_date,))
    total_expenses = c.fetchone()['total'] or 0
    
    c.execute('SELECT SUM(current_value) as total FROM investments')
    total_investments = c.fetchone()['total'] or 0
    
    c.execute('SELECT SUM(current_amount) as total FROM savings_goals')
    total_savings = c.fetchone()['total'] or 0
    
    c.execute('SELECT SUM(remaining_amount) as total FROM debts')
    total_debts = c.fetchone()['total'] or 0
    
    net_worth = total_income - total_expenses + total_investments + total_savings - total_debts
    
    conn.close()
    
    return jsonify({
        'total_income': total_income,
        'total_expenses': total_expenses,
        'total_investments': total_investments,
        'total_savings': total_savings,
        'total_debts': total_debts,
        'net_worth': net_worth,
        'available_cash': total_income - total_expenses
    })

@app.route('/api/ai/categorize', methods=['POST'])
def ai_categorize_expense():
    data = request.json
    description = data.get('description', '')
    amount = data.get('amount', 0)
    
    api_key = get_api_key()
    
    if api_key and OPENAI_AVAILABLE:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=api_key)
            
            prompt = f"""Categorize this expense: "{description}" for ${amount}. 
            Return ONLY the category name from this list: Food, Transport, Fun, Shopping, Other.
            Return just the category name, nothing else."""
            
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=10,
                temperature=0.3
            )
            category = response.choices[0].message.content.strip()
            return jsonify({'category': category})
        except:
            pass
    
    desc_lower = description.lower()
    if any(word in desc_lower for word in ['food', 'restaurant', 'grocery', 'eat', 'meal', 'cafe', 'pizza', 'burger']):
        return jsonify({'category': 'Food'})
    elif any(word in desc_lower for word in ['uber', 'taxi', 'bus', 'train', 'gas', 'fuel', 'parking', 'transport']):
        return jsonify({'category': 'Transport'})
    elif any(word in desc_lower for word in ['movie', 'game', 'entertainment', 'fun', 'party', 'concert']):
        return jsonify({'category': 'Fun'})
    elif any(word in desc_lower for word in ['shop', 'store', 'buy', 'purchase', 'amazon', 'clothes']):
        return jsonify({'category': 'Shopping'})
    else:
        return jsonify({'category': 'Other'})

@app.route('/api/ai/budget-recommendations', methods=['GET'])
def ai_budget_recommendations():
    summary = get_summary().get_json()
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('SELECT SUM(remaining_amount) as total FROM debts')
    total_debts = c.fetchone()[0] or 0
    conn.close()
    
    overview = {'total_debts': total_debts}
    
    api_key = get_api_key()
    
    if api_key and OPENAI_AVAILABLE:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=api_key)
            
            prompt = f"""Based on this financial data:
            Income: ${summary['total_income']}
            Expenses: ${summary['total_expenses']}
            Category Spending: {json.dumps(summary['category_spending'])}
            Net Worth: ${overview.get('net_worth', 0)}
            
            Provide 3 specific budget recommendations. Format as JSON array with objects containing 'title' and 'description' fields."""
            
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=200,
                temperature=0.7
            )
            recommendations = json.loads(response.choices[0].message.content.strip())
            return jsonify(recommendations)
        except:
            pass
    
    recommendations = []
    if summary['total_expenses'] > summary['total_income'] * 0.8:
        recommendations.append({
            'title': 'Reduce Spending',
            'description': f"You're spending {((summary['total_expenses']/summary['total_income'])*100):.1f}% of your income. Try to reduce expenses by 10-20%."
        })
    
    top_category = summary.get('top_category')
    if top_category:
        recommendations.append({
            'title': f'Review {top_category} Spending',
            'description': f'{top_category} is your biggest expense category. Consider setting a weekly limit.'
        })
    
    if overview.get('total_debts', 0) > 0:
        recommendations.append({
            'title': 'Pay Down Debt',
            'description': f'You have ${overview["total_debts"]:.2f} in debt. Focus on paying high-interest debt first.'
        })
    
    return jsonify(recommendations)

@app.route('/api/ai/predict-expenses', methods=['GET'])
def ai_predict_expenses():
    period = request.args.get('period', 'month')
    days = 30 if period == 'month' else 7
    
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    start_date = (datetime.now() - timedelta(days=days*2)).strftime('%Y-%m-%d')
    c.execute('''SELECT date(date_added) as date, SUM(amount) as total
                 FROM expenses
                 WHERE date(date_added) >= ?
                 GROUP BY date(date_added)
                 ORDER BY date(date_added)''', (start_date,))
    
    daily_expenses = [{'date': row['date'], 'amount': row['total']} for row in c.fetchall()]
    conn.close()
    
    if len(daily_expenses) < 3:
        return jsonify({'predicted': 0, 'confidence': 'low', 'message': 'Need more data for accurate predictions'})
    
    recent_avg = sum(d['amount'] for d in daily_expenses[-7:]) / min(7, len(daily_expenses))
    predicted = recent_avg * days
    
    api_key = get_api_key()
    if api_key and OPENAI_AVAILABLE:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=api_key)
            
            prompt = f"""Based on these daily expenses: {json.dumps(daily_expenses[-14:])}
            Predict expenses for the next {days} days. Return JSON with 'predicted' (number) and 'confidence' (low/medium/high)."""
            
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=100,
                temperature=0.5
            )
            prediction = json.loads(response.choices[0].message.content.strip())
            return jsonify(prediction)
        except:
            pass
    
    return jsonify({
        'predicted': round(predicted, 2),
        'confidence': 'medium',
        'message': f'Based on recent spending patterns, you might spend around ${predicted:.2f} in the next {days} days.'
    })

@app.route('/api/reports/monthly', methods=['GET'])
def get_monthly_report():
    month = request.args.get('month', datetime.now().strftime('%Y-%m'))
    
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    c.execute('''SELECT SUM(amount) as total FROM income 
                 WHERE strftime('%Y-%m', date_added) = ?''', (month,))
    income = c.fetchone()['total'] or 0
    
    c.execute('''SELECT c.name, SUM(e.amount) as total, COUNT(e.id) as count
                 FROM expenses e
                 JOIN categories c ON e.category_id = c.id
                 WHERE strftime('%Y-%m', e.date_added) = ?
                 GROUP BY c.id, c.name''', (month,))
    
    category_expenses = [{'name': row['name'], 'total': row['total'], 'count': row['count']} 
                        for row in c.fetchall()]
    
    total_expenses = sum(c['total'] for c in category_expenses)
    
    conn.close()
    
    return jsonify({
        'month': month,
        'income': income,
        'expenses': total_expenses,
        'savings': income - total_expenses,
        'category_breakdown': category_expenses,
        'savings_rate': (income - total_expenses) / income * 100 if income > 0 else 0
    })

@app.route('/api/analysis/patterns', methods=['GET'])
def get_spending_patterns():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    c.execute('''SELECT strftime('%w', date_added) as day_of_week, 
                        strftime('%A', date_added) as day_name,
                        SUM(amount) as total, COUNT(*) as count
                 FROM expenses
                 WHERE date(date_added) >= date('now', '-30 days')
                 GROUP BY day_of_week, day_name
                 ORDER BY day_of_week''')
    
    day_patterns = [{'day': row['day_name'], 'total': row['total'], 'count': row['count']} 
                    for row in c.fetchall()]
    
    c.execute('''SELECT AVG(amount) as avg, MIN(amount) as min, MAX(amount) as max
                 FROM expenses
                 WHERE date(date_added) >= date('now', '-30 days')''')
    
    stats = c.fetchone()
    
    c.execute('''SELECT c.name, SUM(e.amount) as total
                 FROM expenses e
                 JOIN categories c ON e.category_id = c.id
                 WHERE date(e.date_added) >= date('now', '-30 days')
                 GROUP BY c.id, c.name
                 ORDER BY total DESC
                 LIMIT 1''')
    
    top_category = c.fetchone()
    
    conn.close()
    
    return jsonify({
        'day_patterns': day_patterns,
        'average_transaction': stats['avg'] if stats else 0,
        'min_transaction': stats['min'] if stats else 0,
        'max_transaction': stats['max'] if stats else 0,
        'top_category': {'name': top_category['name'], 'total': top_category['total']} if top_category else None
    })

@app.route('/api/export', methods=['GET'])
def export_data():
    export_type = request.args.get('type', 'expenses')
    
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    if export_type == 'expenses':
        c.execute('''SELECT e.*, c.name as category_name
                     FROM expenses e
                     LEFT JOIN categories c ON e.category_id = c.id
                     ORDER BY e.date_added DESC''')
        data = [dict(row) for row in c.fetchall()]
    elif export_type == 'income':
        c.execute('SELECT * FROM income ORDER BY date_added DESC')
        data = [dict(row) for row in c.fetchall()]
    elif export_type == 'all':
        c.execute('SELECT * FROM expenses')
        expenses = [dict(row) for row in c.fetchall()]
        c.execute('SELECT * FROM income')
        income = [dict(row) for row in c.fetchall()]
        c.execute('SELECT * FROM savings_goals')
        goals = [dict(row) for row in c.fetchall()]
        c.execute('SELECT * FROM investments')
        investments = [dict(row) for row in c.fetchall()]
        c.execute('SELECT * FROM debts')
        debts = [dict(row) for row in c.fetchall()]
        
        data = {
            'expenses': expenses,
            'income': income,
            'goals': goals,
            'investments': investments,
            'debts': debts
        }
    else:
        data = []
    
    conn.close()
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True, port=5000)

/**
 * Main app component - handles navigation, alerts, and renders all page components.
 */
import React, { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import BudgetManager from './components/BudgetManager'
import ExpenseTracker from './components/ExpenseTracker'
import AIAssistant from './components/AIAssistant'
import SavingsGoals from './components/SavingsGoals'
import Insights from './components/Insights'
import Investments from './components/Investments'
import Debts from './components/Debts'
import RecurringExpenses from './components/RecurringExpenses'
import AIRecommendations from './components/AIRecommendations'
import { Wallet, TrendingUp, DollarSign, Bot, Target, BarChart3, Bell, TrendingDown, Repeat, PieChart, Sparkles } from 'lucide-react'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [refreshKey, setRefreshKey] = useState(0)
  const [alerts, setAlerts] = useState([])

  const refreshData = () => {
    setRefreshKey(prev => prev + 1)
    loadAlerts()
  }

  const loadAlerts = async () => {
    try {
      const response = await fetch('/api/alerts')
      const data = await response.json()
      setAlerts(data)
    } catch (error) {
      console.error('Error loading alerts:', error)
    }
  }

  useEffect(() => {
    loadAlerts()
    const interval = setInterval(loadAlerts, 30000)
    return () => clearInterval(interval)
  }, [])

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'budget', label: 'Budget', icon: DollarSign },
    { id: 'expenses', label: 'Expenses', icon: Wallet },
    { id: 'goals', label: 'Savings', icon: Target },
    { id: 'investments', label: 'Investments', icon: PieChart },
    { id: 'debts', label: 'Debts', icon: TrendingDown },
    { id: 'recurring', label: 'Recurring', icon: Repeat },
    { id: 'insights', label: 'Insights', icon: BarChart3 },
    { id: 'recommendations', label: 'AI Tips', icon: Sparkles },
    { id: 'ai', label: 'AI Helper', icon: Bot }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-purple-800">
      <div className="container mx-auto px-4 py-6">
        <header className="mb-8 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-bold text-white mb-2">
                💰 Budget AI
              </h1>
              <p className="text-purple-100 text-lg">Your personal finance helper</p>
            </div>
            {alerts.length > 0 && (
              <div className="relative">
                <Bell className="text-white" size={28} />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold animate-pulse">
                  {alerts.length}
                </span>
              </div>
            )}
          </div>
        </header>

        {alerts.length > 0 && (
          <div className="mb-6 animate-slideIn">
            {alerts.slice(0, 2).map((alert, idx) => (
              <div
                key={idx}
                className={`mb-2 p-4 rounded-lg ${
                  alert.severity === 'high'
                    ? 'bg-red-100 border-l-4 border-red-500 text-red-800'
                    : 'bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800'
                }`}
              >
                <p className="font-semibold">{alert.message}</p>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-2 mb-6 flex flex-wrap gap-2 animate-fadeIn">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all duration-300 hover-lift ${
                  activeTab === tab.id
                    ? 'bg-white text-purple-600 shadow-lg scale-105'
                    : 'text-white hover:bg-white/20'
                }`}
              >
                <Icon size={20} />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="bg-white/95 backdrop-blur-lg rounded-xl shadow-2xl p-6 animate-fadeIn hover-lift">
          {activeTab === 'dashboard' && <Dashboard key={refreshKey} alerts={alerts} />}
          {activeTab === 'budget' && <BudgetManager key={refreshKey} onUpdate={refreshData} />}
          {activeTab === 'expenses' && <ExpenseTracker key={refreshKey} onUpdate={refreshData} />}
          {activeTab === 'goals' && <SavingsGoals key={refreshKey} onUpdate={refreshData} />}
          {activeTab === 'investments' && <Investments key={refreshKey} onUpdate={refreshData} />}
          {activeTab === 'debts' && <Debts key={refreshKey} onUpdate={refreshData} />}
          {activeTab === 'recurring' && <RecurringExpenses key={refreshKey} onUpdate={refreshData} />}
          {activeTab === 'insights' && <Insights key={refreshKey} />}
          {activeTab === 'recommendations' && <AIRecommendations key={refreshKey} />}
          {activeTab === 'ai' && <AIAssistant key={refreshKey} />}
        </div>

        <footer className="mt-6 text-center text-white/80 text-sm animate-fadeIn">
          <p>Built for Hackathon Challenge 2025 • Privacy-focused • No real financial data</p>
        </footer>
      </div>
    </div>
  )
}

export default App

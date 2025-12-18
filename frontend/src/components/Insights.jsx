/**
 * Insights component - displays spending trends, patterns, and financial insights.
 */
import React, { useState, useEffect } from 'react'
import { api } from '../api'
import { TrendingUp, TrendingDown, AlertCircle, Lightbulb } from 'lucide-react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'

export default function Insights() {
  const [trends, setTrends] = useState(null)
  const [summary, setSummary] = useState(null)
  const [period, setPeriod] = useState('month')
  const [loading, setLoading] = useState(true)
  const [insights, setInsights] = useState([])

  useEffect(() => {
    loadData()
  }, [period])

  const loadData = async () => {
    try {
      setLoading(true)
      const [trendsRes, summaryRes] = await Promise.all([
        api.getTrends(period),
        api.getSummary(period)
      ])
      setTrends(trendsRes.data)
      setSummary(summaryRes.data)
      generateInsights(trendsRes.data, summaryRes.data)
    } catch (error) {
      console.error('Error loading insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateInsights = (trendsData, summaryData) => {
    const newInsights = []
    const { category_trends, daily_totals } = trendsData
    const { total_income, total_expenses, category_spending, category_budgets } = summaryData

    // Spending trend insight
    if (daily_totals.length > 1) {
      const recent = daily_totals.slice(-7)
      const earlier = daily_totals.slice(0, 7)
      const recentAvg = recent.reduce((sum, d) => sum + d.amount, 0) / recent.length
      const earlierAvg = earlier.reduce((sum, d) => sum + d.amount, 0) / earlier.length
      
      if (recentAvg > earlierAvg * 1.2) {
        newInsights.push({
          type: 'warning',
          icon: TrendingUp,
          title: 'Spending Increasing',
          message: `Your daily spending has increased by ${((recentAvg / earlierAvg - 1) * 100).toFixed(0)}% recently. Consider reviewing your expenses.`
        })
      } else if (recentAvg < earlierAvg * 0.8) {
        newInsights.push({
          type: 'success',
          icon: TrendingDown,
          title: 'Great Job!',
          message: `Your spending has decreased by ${((1 - recentAvg / earlierAvg) * 100).toFixed(0)}%. Keep it up!`
        })
      }
    }

    // Budget insights
    Object.entries(category_spending).forEach(([category, spent]) => {
      const budget = category_budgets[category] || 0
      if (budget > 0) {
        const percentage = (spent / budget) * 100
        if (percentage > 100) {
          newInsights.push({
            type: 'alert',
            icon: AlertCircle,
            title: 'Over Budget',
            message: `You've exceeded your ${category} budget by $${(spent - budget).toFixed(2)}`
          })
        } else if (percentage > 80) {
          newInsights.push({
            type: 'warning',
            icon: AlertCircle,
            title: 'Approaching Limit',
            message: `You've used ${percentage.toFixed(0)}% of your ${category} budget`
          })
        }
      }
    })

    // Top category insight
    if (category_trends.length > 0) {
      const topCategory = category_trends[0]
      newInsights.push({
        type: 'info',
        icon: Lightbulb,
        title: 'Top Spending',
        message: `${topCategory.name} is your biggest expense at $${topCategory.total.toFixed(2)} (${topCategory.count} transactions)`
      })
    }

    // Savings insight
    if (total_income > 0) {
      const savingsRate = ((total_income - total_expenses) / total_income) * 100
      if (savingsRate < 10) {
        newInsights.push({
          type: 'warning',
          icon: Lightbulb,
          title: 'Low Savings Rate',
          message: `You're saving only ${savingsRate.toFixed(1)}% of your income. Aim for at least 20%!`
        })
      } else if (savingsRate >= 20) {
        newInsights.push({
          type: 'success',
          icon: TrendingUp,
          title: 'Excellent Savings!',
          message: `You're saving ${savingsRate.toFixed(1)}% of your income. That's fantastic!`
        })
      }
    }

    setInsights(newInsights)
  }

  if (loading) {
    return <div className="text-center py-8">Loading insights...</div>
  }

  if (!trends || !summary) {
    return <div className="text-center py-8">No data available</div>
  }

  const { daily_totals, category_trends } = trends

  // Prepare chart data
  const lineData = daily_totals.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    amount: parseFloat(d.amount)
  }))

  const barData = category_trends.map(c => ({
    name: c.name,
    amount: parseFloat(c.total),
    transactions: c.count
  }))

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Financial Insights</h2>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {/* Insights Cards */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {insights.map((insight, idx) => {
            const Icon = insight.icon
            const colors = {
              success: 'bg-green-50 border-green-200 text-green-800',
              warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
              alert: 'bg-red-50 border-red-200 text-red-800',
              info: 'bg-blue-50 border-blue-200 text-blue-800'
            }
            return (
              <div
                key={idx}
                className={`p-4 rounded-lg border-l-4 ${colors[insight.type]} animate-slideIn`}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex items-start gap-3">
                  <Icon size={24} className="mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">{insight.title}</h3>
                    <p className="text-sm">{insight.message}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Spending Trend */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Daily Spending Trend</h3>
          {lineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={lineData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#8B5CF6"
                  fillOpacity={1}
                  fill="url(#colorAmount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500">No spending data yet</div>
          )}
        </div>

        {/* Category Comparison */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Category Spending</h3>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                <Bar dataKey="amount" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500">No category data yet</div>
          )}
        </div>
      </div>

      {/* Category Stats */}
      {category_trends.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Category Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {category_trends.slice(0, 6).map((category, idx) => (
              <div
                key={idx}
                className="bg-white p-4 rounded-lg shadow-sm hover-lift animate-fadeIn"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <p className="font-semibold text-gray-800 mb-1">{category.name}</p>
                <p className="text-2xl font-bold text-purple-600">${category.total.toFixed(2)}</p>
                <p className="text-sm text-gray-600">{category.count} transactions</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


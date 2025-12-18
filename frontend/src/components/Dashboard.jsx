/**
 * Dashboard component - shows financial overview with charts and key metrics.
 */
import React, { useState, useEffect } from 'react'
import { api } from '../api'
import { TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function Dashboard({ alerts = [] }) {
  const [summary, setSummary] = useState(null)
  const [overview, setOverview] = useState(null)
  const [period, setPeriod] = useState('month')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSummary()
  }, [period])

  const loadSummary = async () => {
    try {
      setLoading(true)
      const [summaryRes, overviewRes] = await Promise.all([
        api.getSummary(period),
        api.getOverview()
      ])
      setSummary(summaryRes.data)
      setOverview(overviewRes.data)
    } catch (error) {
      console.error('Error loading summary:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (!summary) {
    return <div className="text-center py-8">No data available</div>
  }

  const { total_income, total_expenses, remaining_budget, category_spending, category_budgets } = summary

  // Prepare data for charts
  const pieData = Object.entries(category_spending).map(([name, value]) => ({
    name,
    value: parseFloat(value)
  }))

  const barData = Object.entries(category_spending).map(([name, spent]) => ({
    name,
    spent: parseFloat(spent),
    budget: category_budgets[name] || 0
  }))

  const COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6']

  const percentageUsed = total_income > 0 ? (total_expenses / total_income) * 100 : 0

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Financial Overview</h2>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-xl p-6 text-white shadow-xl hover-lift animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm mb-1">Total Income</p>
              <p className="text-3xl font-bold animate-pulse-slow">${total_income.toFixed(2)}</p>
            </div>
            <TrendingUp size={40} className="opacity-80 animate-pulse-slow" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-400 to-red-600 rounded-xl p-6 text-white shadow-xl hover-lift animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm mb-1">Total Expenses</p>
              <p className="text-3xl font-bold">${total_expenses.toFixed(2)}</p>
            </div>
            <TrendingDown size={40} className="opacity-80" />
          </div>
        </div>

        <div className={`bg-gradient-to-br rounded-xl p-6 text-white shadow-xl hover-lift animate-fadeIn ${
          remaining_budget >= 0 
            ? 'from-blue-400 to-blue-600' 
            : 'from-orange-400 to-orange-600'
        }`} style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm mb-1">Remaining</p>
              <p className="text-3xl font-bold">${remaining_budget.toFixed(2)}</p>
            </div>
            <DollarSign size={40} className="opacity-80" />
          </div>
        </div>
      </div>

      {/* Budget Usage Warning */}
      {percentageUsed > 80 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded animate-slideIn">
          <div className="flex items-center">
            <AlertCircle className="text-yellow-400 mr-2 animate-pulse-slow" size={20} />
            <p className="text-yellow-800">
              You've used {percentageUsed.toFixed(1)}% of your budget. Consider reducing spending!
            </p>
          </div>
        </div>
      )}

      {/* Financial Overview Cards */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl p-4 text-white shadow-xl hover-lift animate-fadeIn">
            <p className="text-emerald-100 text-xs mb-1">Net Worth</p>
            <p className="text-2xl font-bold">${overview.net_worth.toFixed(2)}</p>
          </div>
          <div className="bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl p-4 text-white shadow-xl hover-lift animate-fadeIn" style={{ animationDelay: '0.1s' }}>
            <p className="text-cyan-100 text-xs mb-1">Investments</p>
            <p className="text-2xl font-bold">${overview.total_investments.toFixed(2)}</p>
          </div>
          <div className="bg-gradient-to-br from-violet-400 to-purple-600 rounded-xl p-4 text-white shadow-xl hover-lift animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            <p className="text-violet-100 text-xs mb-1">Savings</p>
            <p className="text-2xl font-bold">${overview.total_savings.toFixed(2)}</p>
          </div>
          <div className="bg-gradient-to-br from-rose-400 to-red-600 rounded-xl p-4 text-white shadow-xl hover-lift animate-fadeIn" style={{ animationDelay: '0.3s' }}>
            <p className="text-rose-100 text-xs mb-1">Debts</p>
            <p className="text-2xl font-bold">${overview.total_debts.toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Spending by Category</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500">No expenses yet</div>
          )}
        </div>

        {/* Bar Chart */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Budget vs Spending</h3>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="budget" fill="#10B981" name="Budget" />
                <Bar dataKey="spent" fill="#EF4444" name="Spent" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500">No data available</div>
          )}
        </div>
      </div>
    </div>
  )
}


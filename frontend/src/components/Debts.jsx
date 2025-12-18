/**
 * Debts component - track and manage debts with payoff progress tracking.
 */
import React, { useState, useEffect } from 'react'
import { api } from '../api'
import { Plus, Trash2, AlertCircle, Calendar, Percent } from 'lucide-react'

export default function Debts({ onUpdate }) {
  const [debts, setDebts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    total_amount: '',
    remaining_amount: '',
    interest_rate: '',
    due_date: '',
    description: ''
  })

  useEffect(() => {
    loadDebts()
  }, [])

  const loadDebts = async () => {
    try {
      setLoading(true)
      const response = await api.getDebts()
      setDebts(response.data)
    } catch (error) {
      console.error('Error loading debts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddDebt = async (e) => {
    e.preventDefault()
    try {
      await api.addDebt({
        name: formData.name,
        total_amount: parseFloat(formData.total_amount),
        remaining_amount: parseFloat(formData.remaining_amount || formData.total_amount),
        interest_rate: parseFloat(formData.interest_rate || 0),
        due_date: formData.due_date || null,
        description: formData.description
      })
      setFormData({ name: '', total_amount: '', remaining_amount: '', interest_rate: '', due_date: '', description: '' })
      setShowForm(false)
      loadDebts()
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Error adding debt:', error)
      alert('Error adding debt. Please try again.')
    }
  }

  const handleUpdateDebt = async (id, newAmount) => {
    try {
      await api.updateDebt(id, { remaining_amount: parseFloat(newAmount) })
      loadDebts()
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Error updating debt:', error)
    }
  }

  const handleDeleteDebt = async (id) => {
    if (window.confirm('Are you sure you want to delete this debt?')) {
      try {
        await api.deleteDebt(id)
        loadDebts()
        if (onUpdate) onUpdate()
      } catch (error) {
        console.error('Error deleting debt:', error)
      }
    }
  }

  const calculateProgress = (remaining, total) => {
    return ((total - remaining) / total) * 100
  }

  const getDaysRemaining = (dueDate) => {
    if (!dueDate) return null
    const today = new Date()
    const due = new Date(dueDate)
    const diff = due - today
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const totalDebt = debts.reduce((sum, debt) => sum + (debt.remaining_amount || 0), 0)
  const totalOriginal = debts.reduce((sum, debt) => sum + (debt.total_amount || 0), 0)
  const paidOff = totalOriginal - totalDebt

  if (loading) {
    return <div className="text-center py-8 animate-pulse">Loading debts...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Debt Tracker</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg hover:from-red-700 hover:to-orange-700 transition-all hover-lift animate-fadeIn"
        >
          <Plus size={20} />
          Add Debt
        </button>
      </div>

      {/* Debt Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-red-400 to-red-600 rounded-xl p-4 text-white shadow-xl hover-lift animate-fadeIn">
          <p className="text-red-100 text-sm mb-1">Total Debt</p>
          <p className="text-2xl font-bold">${totalDebt.toFixed(2)}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl p-4 text-white shadow-xl hover-lift animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          <p className="text-orange-100 text-sm mb-1">Paid Off</p>
          <p className="text-2xl font-bold">${paidOff.toFixed(2)}</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl p-4 text-white shadow-xl hover-lift animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          <p className="text-yellow-100 text-sm mb-1">Progress</p>
          <p className="text-2xl font-bold">{totalOriginal > 0 ? ((paidOff / totalOriginal) * 100).toFixed(1) : 0}%</p>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleAddDebt} className="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-lg mb-6 animate-slideIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Debt Name (e.g., Credit Card, Student Loan)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Total Amount ($)"
              value={formData.total_amount}
              onChange={(e) => setFormData({ ...formData, total_amount: e.target.value, remaining_amount: e.target.value })}
              required
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Remaining Amount ($)"
              value={formData.remaining_amount}
              onChange={(e) => setFormData({ ...formData, remaining_amount: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Interest Rate (%)"
              value={formData.interest_rate}
              onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <input
              type="date"
              placeholder="Due Date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Add Debt
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {debts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <AlertCircle size={64} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 text-lg mb-2">No debts tracked</p>
          <p className="text-gray-500">Add your debts to start tracking your progress!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {debts.map((debt) => {
            const progress = calculateProgress(debt.remaining_amount, debt.total_amount)
            const daysRemaining = getDaysRemaining(debt.due_date)
            const isOverdue = daysRemaining !== null && daysRemaining < 0

            return (
              <div
                key={debt.id}
                className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 shadow-lg hover-lift border border-gray-200 animate-fadeIn"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-gray-800">{debt.name}</h3>
                      {isOverdue && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full animate-pulse">
                          Overdue
                        </span>
                      )}
                    </div>
                    {debt.description && (
                      <p className="text-sm text-gray-600 mb-2">{debt.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <DollarSign size={16} />
                        <span>${debt.remaining_amount.toFixed(2)} / ${debt.total_amount.toFixed(2)}</span>
                      </div>
                      {debt.interest_rate > 0 && (
                        <div className="flex items-center gap-1">
                          <Percent size={16} />
                          <span>{debt.interest_rate}% APR</span>
                        </div>
                      )}
                      {debt.due_date && (
                        <div className="flex items-center gap-1">
                          <Calendar size={16} />
                          <span className={isOverdue ? 'text-red-600 font-semibold' : ''}>
                            {daysRemaining !== null
                              ? daysRemaining > 0
                                ? `${daysRemaining} days left`
                                : `${Math.abs(daysRemaining)} days overdue`
                              : 'No due date'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteDebt(debt.id)}
                    className="text-red-600 hover:text-red-800 transition"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">{progress.toFixed(1)}% Paid Off</span>
                    <span className="text-gray-600">${debt.remaining_amount.toFixed(2)} remaining</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Update Payment */}
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Payment amount"
                    onBlur={(e) => {
                      const payment = parseFloat(e.target.value)
                      if (!isNaN(payment) && payment > 0) {
                        const newAmount = Math.max(0, debt.remaining_amount - payment)
                        handleUpdateDebt(debt.id, newAmount)
                        e.target.value = ''
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const payment = parseFloat(e.target.value)
                        if (!isNaN(payment) && payment > 0) {
                          const newAmount = Math.max(0, debt.remaining_amount - payment)
                          handleUpdateDebt(debt.id, newAmount)
                          e.target.value = ''
                        }
                      }
                    }}
                    className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {progress >= 100 && (
                  <div className="mt-4 p-3 bg-green-100 border border-green-400 rounded-lg text-green-800 text-center font-semibold animate-pulse-slow">
                    🎉 Debt Paid Off! 🎉
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}


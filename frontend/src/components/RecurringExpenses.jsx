/**
 * Recurring expenses component - manage subscriptions and recurring bills.
 */
import React, { useState, useEffect } from 'react'
import { api } from '../api'
import { Plus, Trash2, Repeat, Calendar, DollarSign } from 'lucide-react'

export default function RecurringExpenses({ onUpdate }) {
  const [recurring, setRecurring] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category_id: '',
    frequency: 'monthly',
    next_due_date: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [recurringRes, categoriesRes] = await Promise.all([
        api.getRecurring(),
        api.getCategories()
      ])
      setRecurring(recurringRes.data)
      setCategories(categoriesRes.data)
      if (categoriesRes.data.length > 0 && !formData.category_id) {
        setFormData({ ...formData, category_id: categoriesRes.data[0].id })
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddRecurring = async (e) => {
    e.preventDefault()
    try {
      await api.addRecurring({
        name: formData.name,
        amount: parseFloat(formData.amount),
        category_id: parseInt(formData.category_id),
        frequency: formData.frequency,
        next_due_date: formData.next_due_date
      })
      setFormData({ name: '', amount: '', category_id: categories[0]?.id || '', frequency: 'monthly', next_due_date: '' })
      setShowForm(false)
      loadData()
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Error adding recurring expense:', error)
      alert('Error adding recurring expense. Please try again.')
    }
  }

  const handleDeleteRecurring = async (id) => {
    if (window.confirm('Are you sure you want to remove this recurring expense?')) {
      try {
        await api.deleteRecurring(id)
        loadData()
        if (onUpdate) onUpdate()
      } catch (error) {
        console.error('Error deleting recurring expense:', error)
      }
    }
  }

  const getDaysUntilDue = (dueDate) => {
    if (!dueDate) return null
    const today = new Date()
    const due = new Date(dueDate)
    const diff = due - today
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const totalMonthly = recurring.reduce((sum, item) => {
    if (item.frequency === 'monthly') return sum + item.amount
    if (item.frequency === 'weekly') return sum + (item.amount * 4)
    if (item.frequency === 'yearly') return sum + (item.amount / 12)
    return sum + item.amount
  }, 0)

  if (loading) {
    return <div className="text-center py-8 animate-pulse">Loading recurring expenses...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Recurring Expenses</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all hover-lift animate-fadeIn"
        >
          <Plus size={20} />
          Add Recurring
        </button>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-br from-purple-400 to-pink-600 rounded-xl p-4 text-white shadow-xl mb-6 hover-lift animate-fadeIn">
        <p className="text-purple-100 text-sm mb-1">Estimated Monthly Total</p>
        <p className="text-3xl font-bold">${totalMonthly.toFixed(2)}</p>
        <p className="text-purple-100 text-xs mt-1">Based on all active recurring expenses</p>
      </div>

      {showForm && (
        <form onSubmit={handleAddRecurring} className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg mb-6 animate-slideIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Expense Name (e.g., Netflix, Gym Membership)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Amount ($)"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              required
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <select
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <input
              type="date"
              placeholder="Next Due Date"
              value={formData.next_due_date}
              onChange={(e) => setFormData({ ...formData, next_due_date: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Add Recurring Expense
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

      {recurring.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Repeat size={64} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 text-lg mb-2">No recurring expenses</p>
          <p className="text-gray-500">Add subscriptions and bills to track them automatically!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recurring.map((item) => {
            const daysUntil = getDaysUntilDue(item.next_due_date)
            const isDueSoon = daysUntil !== null && daysUntil <= 7 && daysUntil >= 0

            return (
              <div
                key={item.id}
                className={`bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 shadow-lg hover-lift border ${
                  isDueSoon ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'
                } animate-fadeIn`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: item.category_color || '#8B5CF6' }}
                      />
                      <h3 className="text-xl font-bold text-gray-800">{item.name}</h3>
                      {isDueSoon && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full animate-pulse">
                          Due Soon
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <DollarSign size={16} />
                        <span className="text-lg font-semibold text-gray-800">${item.amount.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Repeat size={16} />
                        <span className="capitalize">{item.frequency}</span>
                      </div>
                      {item.next_due_date && (
                        <div className="flex items-center gap-1">
                          <Calendar size={16} />
                          <span className={isDueSoon ? 'text-yellow-700 font-semibold' : ''}>
                            {daysUntil !== null
                              ? daysUntil === 0
                                ? 'Due today!'
                                : daysUntil < 0
                                ? `${Math.abs(daysUntil)} days overdue`
                                : `${daysUntil} days`
                              : new Date(item.next_due_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {item.category_name && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {item.category_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteRecurring(item.id)}
                    className="text-red-600 hover:text-red-800 transition"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}


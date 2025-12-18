/**
 * Expense tracker component - add, view, and manage expenses with AI categorization.
 */
import React, { useState, useEffect } from 'react'
import { api } from '../api'
import { Plus, Trash2, Calendar } from 'lucide-react'

export default function ExpenseTracker({ onUpdate }) {
  const [expenses, setExpenses] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [period, setPeriod] = useState('month')
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    category_id: '',
    description: ''
  })

  useEffect(() => {
    loadData()
  }, [period])

  const loadData = async () => {
    try {
      setLoading(true)
      const [expensesRes, categoriesRes] = await Promise.all([
        api.getExpenses(period),
        api.getCategories()
      ])
      setExpenses(expensesRes.data)
      setCategories(categoriesRes.data)
      if (categoriesRes.data.length > 0 && !expenseForm.category_id) {
        setExpenseForm({ ...expenseForm, category_id: categoriesRes.data[0].id })
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddExpense = async (e) => {
    e.preventDefault()
    try {
      // AI categorization if description provided
      let categoryId = parseInt(expenseForm.category_id)
      if (expenseForm.description && !categoryId) {
        try {
          const catResponse = await api.categorizeExpense({
            description: expenseForm.description,
            amount: parseFloat(expenseForm.amount)
          })
          const suggestedCategory = categories.find(c => 
            c.name.toLowerCase() === catResponse.data.category.toLowerCase()
          )
          if (suggestedCategory) {
            categoryId = suggestedCategory.id
          }
        } catch (err) {
          console.log('AI categorization failed, using default')
        }
      }
      
      await api.addExpense({
        amount: parseFloat(expenseForm.amount),
        category_id: categoryId || categories[0]?.id,
        description: expenseForm.description
      })
      setExpenseForm({ amount: '', category_id: categories[0]?.id || '', description: '' })
      setShowForm(false)
      loadData()
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Error adding expense:', error)
      alert('Error adding expense. Please try again.')
    }
  }

  const handleDeleteExpense = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await api.deleteExpense(id)
        loadData()
        if (onUpdate) onUpdate()
      } catch (error) {
        console.error('Error deleting expense:', error)
      }
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getCategoryColor = (categoryId) => {
    const category = categories.find(c => c.id === categoryId)
    return category?.color || '#3B82F6'
  }

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId)
    return category?.name || 'Unknown'
  }

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Expense Tracker</h2>
        <div className="flex items-center gap-4">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            <Plus size={20} />
            Add Expense
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleAddExpense} className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="number"
              step="0.01"
              placeholder="Amount"
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
              required
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <select
              value={expenseForm.category_id}
              onChange={(e) => setExpenseForm({ ...expenseForm, category_id: e.target.value })}
              required
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Description (optional)"
              value={expenseForm.description}
              onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Add Expense
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-red-700 mb-2">Total Expenses ({period})</p>
        <p className="text-2xl font-bold text-red-800">${totalExpenses.toFixed(2)}</p>
      </div>

      <div className="space-y-2">
        {expenses.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="mb-2">No expenses recorded yet</p>
            <p className="text-sm">Click "Add Expense" to start tracking!</p>
          </div>
        ) : (
          expenses.map((expense) => (
            <div
              key={expense.id}
              className="flex items-center justify-between bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition"
            >
              <div className="flex items-center gap-4 flex-1">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: getCategoryColor(expense.category_id) }}
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">
                    ${expense.amount.toFixed(2)}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">{getCategoryName(expense.category_id)}</span>
                    {expense.description && (
                      <>
                        <span>•</span>
                        <span>{expense.description}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Calendar size={16} />
                  <span>{formatDate(expense.date_added)}</span>
                </div>
                <button
                  onClick={() => handleDeleteExpense(expense.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}


/**
 * Budget manager component - manage income sources and spending category budgets.
 */
import React, { useState, useEffect } from 'react'
import { api } from '../api'
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react'

export default function BudgetManager({ onUpdate }) {
  const [income, setIncome] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showIncomeForm, setShowIncomeForm] = useState(false)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [incomeForm, setIncomeForm] = useState({ amount: '', source: '', period: 'monthly' })
  const [categoryForm, setCategoryForm] = useState({ name: '', budget_limit: '', color: '#3B82F6' })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [incomeRes, categoriesRes] = await Promise.all([
        api.getIncome(),
        api.getCategories()
      ])
      setIncome(incomeRes.data.income)
      setCategories(categoriesRes.data)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddIncome = async (e) => {
    e.preventDefault()
    try {
      await api.addIncome({
        amount: parseFloat(incomeForm.amount),
        source: incomeForm.source || 'Other',
        period: incomeForm.period
      })
      setIncomeForm({ amount: '', source: '', period: 'monthly' })
      setShowIncomeForm(false)
      loadData()
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Error adding income:', error)
      alert('Error adding income. Please try again.')
    }
  }

  const handleDeleteIncome = async (id) => {
    if (window.confirm('Are you sure you want to delete this income?')) {
      try {
        await api.deleteIncome(id)
        loadData()
        if (onUpdate) onUpdate()
      } catch (error) {
        console.error('Error deleting income:', error)
      }
    }
  }

  const handleAddCategory = async (e) => {
    e.preventDefault()
    try {
      await api.addCategory({
        name: categoryForm.name,
        budget_limit: parseFloat(categoryForm.budget_limit),
        color: categoryForm.color
      })
      setCategoryForm({ name: '', budget_limit: '', color: '#3B82F6' })
      setShowCategoryForm(false)
      loadData()
    } catch (error) {
      console.error('Error adding category:', error)
      alert('Error adding category. It may already exist.')
    }
  }

  const handleUpdateCategory = async (id, budgetLimit) => {
    try {
      await api.updateCategory(id, { budget_limit: budgetLimit })
      setEditingCategory(null)
      loadData()
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Error updating category:', error)
    }
  }

  const totalIncome = income.reduce((sum, item) => sum + item.amount, 0)

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Budget Manager</h2>

      {/* Income Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-700">Income</h3>
          <button
            onClick={() => setShowIncomeForm(!showIncomeForm)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            <Plus size={20} />
            Add Income
          </button>
        </div>

        {showIncomeForm && (
          <form onSubmit={handleAddIncome} className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="number"
                step="0.01"
                placeholder="Amount"
                value={incomeForm.amount}
                onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                required
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="text"
                placeholder="Source (e.g., Allowance, Job)"
                value={incomeForm.source}
                onChange={(e) => setIncomeForm({ ...incomeForm, source: e.target.value })}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <select
                value={incomeForm.period}
                onChange={(e) => setIncomeForm({ ...incomeForm, period: e.target.value })}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowIncomeForm(false)}
                className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-green-700 mb-2">Total Income</p>
          <p className="text-2xl font-bold text-green-800">${totalIncome.toFixed(2)}</p>
        </div>

        <div className="space-y-2">
          {income.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between bg-gray-50 p-4 rounded-lg"
            >
              <div>
                <p className="font-semibold">${item.amount.toFixed(2)}</p>
                <p className="text-sm text-gray-600">{item.source || 'Other'} • {item.period}</p>
              </div>
              <button
                onClick={() => handleDeleteIncome(item.id)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
          {income.length === 0 && (
            <p className="text-gray-500 text-center py-4">No income added yet</p>
          )}
        </div>
      </div>

      {/* Categories Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-700">Spending Categories</h3>
          <button
            onClick={() => setShowCategoryForm(!showCategoryForm)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            <Plus size={20} />
            Add Category
          </button>
        </div>

        {showCategoryForm && (
          <form onSubmit={handleAddCategory} className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Category Name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                required
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Budget Limit"
                value={categoryForm.budget_limit}
                onChange={(e) => setCategoryForm({ ...categoryForm, budget_limit: e.target.value })}
                required
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="color"
                value={categoryForm.color}
                onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                className="h-10 border rounded-lg"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowCategoryForm(false)}
                className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between bg-gray-50 p-4 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <div>
                  <p className="font-semibold">{category.name}</p>
                  {editingCategory === category.id ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="number"
                        step="0.01"
                        defaultValue={category.budget_limit}
                        onBlur={(e) => {
                          const newLimit = parseFloat(e.target.value)
                          if (!isNaN(newLimit) && newLimit !== category.budget_limit) {
                            handleUpdateCategory(category.id, newLimit)
                          } else {
                            setEditingCategory(null)
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const newLimit = parseFloat(e.target.value)
                            if (!isNaN(newLimit)) {
                              handleUpdateCategory(category.id, newLimit)
                            }
                          } else if (e.key === 'Escape') {
                            setEditingCategory(null)
                          }
                        }}
                        autoFocus
                        className="w-24 px-2 py-1 border rounded text-sm"
                      />
                      <button
                        onClick={() => setEditingCategory(null)}
                        className="text-gray-500"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      Budget: ${category.budget_limit.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
              {editingCategory !== category.id && (
                <button
                  onClick={() => setEditingCategory(category.id)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Edit2 size={20} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


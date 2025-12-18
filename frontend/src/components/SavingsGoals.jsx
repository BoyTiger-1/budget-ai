/**
 * Savings goals component - create and track savings goals with progress bars.
 */
import React, { useState, useEffect } from 'react'
import { api } from '../api'
import { Plus, Trash2, Target, TrendingUp, Calendar } from 'lucide-react'

export default function SavingsGoals({ onUpdate }) {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    target_amount: '',
    deadline: '',
    description: ''
  })

  useEffect(() => {
    loadGoals()
  }, [])

  const loadGoals = async () => {
    try {
      setLoading(true)
      const response = await api.getGoals()
      setGoals(response.data)
    } catch (error) {
      console.error('Error loading goals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddGoal = async (e) => {
    e.preventDefault()
    try {
      await api.addGoal({
        name: formData.name,
        target_amount: parseFloat(formData.target_amount),
        deadline: formData.deadline || null,
        description: formData.description
      })
      setFormData({ name: '', target_amount: '', deadline: '', description: '' })
      setShowForm(false)
      loadGoals()
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Error adding goal:', error)
      alert('Error adding goal. Please try again.')
    }
  }

  const handleUpdateProgress = async (goalId, newAmount) => {
    try {
      await api.updateGoal(goalId, { current_amount: parseFloat(newAmount) })
      loadGoals()
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Error updating goal:', error)
    }
  }

  const handleDeleteGoal = async (id) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      try {
        await api.deleteGoal(id)
        loadGoals()
        if (onUpdate) onUpdate()
      } catch (error) {
        console.error('Error deleting goal:', error)
      }
    }
  }

  const calculateProgress = (current, target) => {
    return Math.min((current / target) * 100, 100)
  }

  const getDaysRemaining = (deadline) => {
    if (!deadline) return null
    const today = new Date()
    const deadlineDate = new Date(deadline)
    const diff = deadlineDate - today
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Savings Goals</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all hover-lift"
        >
          <Plus size={20} />
          New Goal
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddGoal} className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg mb-6 animate-slideIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Goal Name (e.g., New Phone)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Target Amount ($)"
              value={formData.target_amount}
              onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
              required
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="date"
              placeholder="Deadline (optional)"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Create Goal
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

      {goals.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Target size={64} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 text-lg mb-2">No savings goals yet</p>
          <p className="text-gray-500">Create your first goal to start tracking your progress!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map((goal) => {
            const progress = calculateProgress(goal.current_amount, goal.target_amount)
            const daysRemaining = getDaysRemaining(goal.deadline)
            const remaining = goal.target_amount - goal.current_amount

            return (
              <div
                key={goal.id}
                className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 shadow-lg hover-lift border border-gray-200 animate-fadeIn"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-1">{goal.name}</h3>
                    {goal.description && (
                      <p className="text-sm text-gray-600 mb-2">{goal.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Target size={16} />
                        <span>${goal.current_amount.toFixed(2)} / ${goal.target_amount.toFixed(2)}</span>
                      </div>
                      {goal.deadline && (
                        <div className="flex items-center gap-1">
                          <Calendar size={16} />
                          <span>
                            {daysRemaining !== null
                              ? daysRemaining > 0
                                ? `${daysRemaining} days left`
                                : 'Deadline passed'
                              : 'No deadline'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="text-red-600 hover:text-red-800 transition"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">{progress.toFixed(1)}% Complete</span>
                    <span className="text-gray-600">${remaining.toFixed(2)} remaining</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Update Progress */}
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Add amount"
                    onBlur={(e) => {
                      const newAmount = parseFloat(e.target.value)
                      if (!isNaN(newAmount) && newAmount >= 0) {
                        handleUpdateProgress(goal.id, goal.current_amount + newAmount)
                        e.target.value = ''
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const newAmount = parseFloat(e.target.value)
                        if (!isNaN(newAmount) && newAmount >= 0) {
                          handleUpdateProgress(goal.id, goal.current_amount + newAmount)
                          e.target.value = ''
                        }
                      }
                    }}
                    className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={() => {
                      const input = document.querySelector(`input[data-goal-id="${goal.id}"]`)
                      if (input) {
                        const newAmount = parseFloat(input.value)
                        if (!isNaN(newAmount) && newAmount >= 0) {
                          handleUpdateProgress(goal.id, goal.current_amount + newAmount)
                          input.value = ''
                        }
                      }
                    }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                  >
                    Add
                  </button>
                </div>

                {progress >= 100 && (
                  <div className="mt-4 p-3 bg-green-100 border border-green-400 rounded-lg text-green-800 text-center font-semibold animate-pulse-slow">
                    🎉 Goal Achieved! 🎉
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


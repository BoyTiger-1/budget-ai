/**
 * Investments component - track investment portfolio with returns and performance.
 */
import React, { useState, useEffect } from 'react'
import { api } from '../api'
import { Plus, Trash2, TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react'

export default function Investments({ onUpdate }) {
  const [investments, setInvestments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'Stock',
    amount: '',
    purchase_date: '',
    current_value: '',
    notes: ''
  })

  useEffect(() => {
    loadInvestments()
  }, [])

  const loadInvestments = async () => {
    try {
      setLoading(true)
      const response = await api.getInvestments()
      setInvestments(response.data)
    } catch (error) {
      console.error('Error loading investments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddInvestment = async (e) => {
    e.preventDefault()
    try {
      await api.addInvestment({
        name: formData.name,
        type: formData.type,
        amount: parseFloat(formData.amount),
        purchase_date: formData.purchase_date || null,
        current_value: parseFloat(formData.current_value || formData.amount),
        notes: formData.notes
      })
      setFormData({ name: '', type: 'Stock', amount: '', purchase_date: '', current_value: '', notes: '' })
      setShowForm(false)
      loadInvestments()
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Error adding investment:', error)
      alert('Error adding investment. Please try again.')
    }
  }

  const handleUpdateValue = async (id, newValue) => {
    try {
      await api.updateInvestment(id, { current_value: parseFloat(newValue) })
      loadInvestments()
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Error updating investment:', error)
    }
  }

  const handleDeleteInvestment = async (id) => {
    if (window.confirm('Are you sure you want to delete this investment?')) {
      try {
        await api.deleteInvestment(id)
        loadInvestments()
        if (onUpdate) onUpdate()
      } catch (error) {
        console.error('Error deleting investment:', error)
      }
    }
  }

  const calculateReturn = (purchase, current) => {
    if (!purchase || purchase === 0) return 0
    return ((current - purchase) / purchase) * 100
  }

  const totalInvested = investments.reduce((sum, inv) => sum + (inv.amount || 0), 0)
  const totalValue = investments.reduce((sum, inv) => sum + (inv.current_value || 0), 0)
  const totalReturn = totalValue - totalInvested
  const totalReturnPercent = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0

  if (loading) {
    return <div className="text-center py-8 animate-pulse">Loading investments...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Investment Portfolio</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all hover-lift animate-fadeIn"
        >
          <Plus size={20} />
          Add Investment
        </button>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl p-4 text-white shadow-xl hover-lift animate-fadeIn">
          <p className="text-blue-100 text-sm mb-1">Total Invested</p>
          <p className="text-2xl font-bold">${totalInvested.toFixed(2)}</p>
        </div>
        <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-xl p-4 text-white shadow-xl hover-lift animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          <p className="text-green-100 text-sm mb-1">Current Value</p>
          <p className="text-2xl font-bold">${totalValue.toFixed(2)}</p>
        </div>
        <div className={`bg-gradient-to-br rounded-xl p-4 text-white shadow-xl hover-lift animate-fadeIn ${
          totalReturn >= 0 ? 'from-emerald-400 to-emerald-600' : 'from-red-400 to-red-600'
        }`} style={{ animationDelay: '0.2s' }}>
          <p className="text-white/80 text-sm mb-1">Total Return</p>
          <p className="text-2xl font-bold">${totalReturn.toFixed(2)}</p>
        </div>
        <div className={`bg-gradient-to-br rounded-xl p-4 text-white shadow-xl hover-lift animate-fadeIn ${
          totalReturnPercent >= 0 ? 'from-purple-400 to-purple-600' : 'from-orange-400 to-orange-600'
        }`} style={{ animationDelay: '0.3s' }}>
          <p className="text-white/80 text-sm mb-1">Return %</p>
          <p className="text-2xl font-bold">{totalReturnPercent.toFixed(2)}%</p>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleAddInvestment} className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg mb-6 animate-slideIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Investment Name (e.g., Apple Stock)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="Stock">Stock</option>
              <option value="Crypto">Cryptocurrency</option>
              <option value="Bond">Bond</option>
              <option value="ETF">ETF</option>
              <option value="Mutual Fund">Mutual Fund</option>
              <option value="Other">Other</option>
            </select>
            <input
              type="number"
              step="0.01"
              placeholder="Purchase Amount ($)"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Current Value ($)"
              value={formData.current_value}
              onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <input
              type="date"
              placeholder="Purchase Date"
              value={formData.purchase_date}
              onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <input
              type="text"
              placeholder="Notes (optional)"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Add Investment
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

      {investments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <TrendingUp size={64} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 text-lg mb-2">No investments yet</p>
          <p className="text-gray-500">Start building your portfolio by adding your first investment!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {investments.map((investment) => {
            const returnPercent = calculateReturn(investment.amount, investment.current_value)
            const isPositive = returnPercent >= 0

            return (
              <div
                key={investment.id}
                className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 shadow-lg hover-lift border border-gray-200 animate-fadeIn"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-gray-800">{investment.name}</h3>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        {investment.type}
                      </span>
                    </div>
                    {investment.notes && (
                      <p className="text-sm text-gray-600 mb-2">{investment.notes}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <DollarSign size={16} />
                        <span>Invested: ${investment.amount.toFixed(2)}</span>
                      </div>
                      {investment.purchase_date && (
                        <div className="flex items-center gap-1">
                          <Calendar size={16} />
                          <span>{new Date(investment.purchase_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteInvestment(investment.id)}
                    className="text-red-600 hover:text-red-800 transition"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Current Value</span>
                    <span className="text-2xl font-bold text-gray-800">
                      ${investment.current_value.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isPositive ? (
                      <TrendingUp className="text-green-600" size={20} />
                    ) : (
                      <TrendingDown className="text-red-600" size={20} />
                    )}
                    <span className={`font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {isPositive ? '+' : ''}{returnPercent.toFixed(2)}%
                    </span>
                    <span className="text-gray-500 text-sm">
                      (${(investment.current_value - investment.amount).toFixed(2)})
                    </span>
                  </div>
                </div>

                {/* Update Value */}
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Update value"
                    onBlur={(e) => {
                      const newValue = parseFloat(e.target.value)
                      if (!isNaN(newValue) && newValue >= 0) {
                        handleUpdateValue(investment.id, newValue)
                        e.target.value = ''
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const newValue = parseFloat(e.target.value)
                        if (!isNaN(newValue) && newValue >= 0) {
                          handleUpdateValue(investment.id, newValue)
                          e.target.value = ''
                        }
                      }
                    }}
                    className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}


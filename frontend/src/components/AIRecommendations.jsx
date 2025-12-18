/**
 * AI recommendations component - shows personalized budget tips and expense predictions.
 */
import React, { useState, useEffect } from 'react'
import { api } from '../api'
import { Lightbulb, TrendingUp, AlertCircle, Sparkles } from 'lucide-react'

export default function AIRecommendations() {
  const [recommendations, setRecommendations] = useState([])
  const [predictions, setPredictions] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecommendations()
    loadPredictions()
  }, [])

  const loadRecommendations = async () => {
    try {
      const response = await api.getBudgetRecommendations()
      setRecommendations(response.data)
    } catch (error) {
      console.error('Error loading recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPredictions = async () => {
    try {
      const response = await api.predictExpenses('month')
      setPredictions(response.data)
    } catch (error) {
      console.error('Error loading predictions:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-8 animate-pulse">Loading AI recommendations...</div>
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="text-purple-600" size={28} />
        <h2 className="text-2xl font-bold text-gray-800">AI Recommendations</h2>
      </div>

      {/* Predictions */}
      {predictions && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-purple-500 p-6 rounded-lg mb-6 animate-slideIn">
          <div className="flex items-start gap-3">
            <TrendingUp className="text-purple-600 mt-1" size={24} />
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">Expense Prediction</h3>
              <p className="text-gray-700">{predictions.message || `Based on your spending patterns, you might spend around $${predictions.predicted?.toFixed(2) || 0} this month.`}</p>
              <p className="text-sm text-gray-600 mt-2">Confidence: <span className="font-semibold capitalize">{predictions.confidence || 'medium'}</span></p>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 ? (
        <div className="space-y-4">
          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 shadow-lg hover-lift border border-gray-200 animate-fadeIn"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  rec.title.includes('Reduce') || rec.title.includes('Pay') 
                    ? 'bg-red-100' 
                    : 'bg-blue-100'
                }`}>
                  {rec.title.includes('Reduce') || rec.title.includes('Pay') ? (
                    <AlertCircle className="text-red-600" size={24} />
                  ) : (
                    <Lightbulb className="text-blue-600" size={24} />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 mb-2">{rec.title}</h3>
                  <p className="text-gray-600">{rec.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Lightbulb size={64} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No recommendations yet</p>
          <p className="text-gray-500 text-sm mt-2">Add more financial data to get personalized recommendations!</p>
        </div>
      )}
    </div>
  )
}


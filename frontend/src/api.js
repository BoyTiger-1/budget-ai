/**
 * API client - handles all HTTP requests to the backend.
 */
import axios from 'axios'

const API_BASE = '/api'

export const api = {
  getIncome: () => axios.get(`${API_BASE}/income`),
  addIncome: (data) => axios.post(`${API_BASE}/income`, data),
  deleteIncome: (id) => axios.delete(`${API_BASE}/income/${id}`),

  getCategories: () => axios.get(`${API_BASE}/categories`),
  addCategory: (data) => axios.post(`${API_BASE}/categories`, data),
  updateCategory: (id, data) => axios.put(`${API_BASE}/categories/${id}`, data),

  getExpenses: (period = 'month') => axios.get(`${API_BASE}/expenses?period=${period}`),
  addExpense: (data) => axios.post(`${API_BASE}/expenses`, data),
  deleteExpense: (id) => axios.delete(`${API_BASE}/expenses/${id}`),

  getSummary: (period = 'month') => axios.get(`${API_BASE}/summary?period=${period}`),

  chat: (message) => axios.post(`${API_BASE}/ai/chat`, { message }),

  getGoals: () => axios.get(`${API_BASE}/goals`),
  addGoal: (data) => axios.post(`${API_BASE}/goals`, data),
  updateGoal: (id, data) => axios.put(`${API_BASE}/goals/${id}`, data),
  deleteGoal: (id) => axios.delete(`${API_BASE}/goals/${id}`),

  getTrends: (period = 'month') => axios.get(`${API_BASE}/trends?period=${period}`),

  getAlerts: () => axios.get(`${API_BASE}/alerts`),

  getInvestments: () => axios.get(`${API_BASE}/investments`),
  addInvestment: (data) => axios.post(`${API_BASE}/investments`, data),
  updateInvestment: (id, data) => axios.put(`${API_BASE}/investments/${id}`, data),
  deleteInvestment: (id) => axios.delete(`${API_BASE}/investments/${id}`),

  getDebts: () => axios.get(`${API_BASE}/debts`),
  addDebt: (data) => axios.post(`${API_BASE}/debts`, data),
  updateDebt: (id, data) => axios.put(`${API_BASE}/debts/${id}`, data),
  deleteDebt: (id) => axios.delete(`${API_BASE}/debts/${id}`),

  getRecurring: () => axios.get(`${API_BASE}/recurring`),
  addRecurring: (data) => axios.post(`${API_BASE}/recurring`, data),
  deleteRecurring: (id) => axios.delete(`${API_BASE}/recurring/${id}`),

  getOverview: () => axios.get(`${API_BASE}/overview`),

  categorizeExpense: (data) => axios.post(`${API_BASE}/ai/categorize`, data),
  getBudgetRecommendations: () => axios.get(`${API_BASE}/ai/budget-recommendations`),
  predictExpenses: (period = 'month') => axios.get(`${API_BASE}/ai/predict-expenses?period=${period}`),

  getMonthlyReport: (month) => axios.get(`${API_BASE}/reports/monthly?month=${month}`),
  getSpendingPatterns: () => axios.get(`${API_BASE}/analysis/patterns`),
  exportData: (type = 'expenses') => axios.get(`${API_BASE}/export?type=${type}`)
}

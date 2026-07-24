import api from './api'

export function runProjection(data) {
  return api.post('/simulator/projection', data).then((res) => res.data)
}

export function runGoalPlanner(data) {
  return api.post('/simulator/goal-planner', data).then((res) => res.data)
}

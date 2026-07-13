import * as aiService from '../services/ai.service.js'
import { success } from '../utils/response.js'

export async function assist(req, res, next) {
  try {
    const { feature, text, projectId } = req.body
    const result = await aiService.assist(feature, text, projectId, req.user.userId)
    return success(res, result)
  } catch (err) {
    next(err)
  }
}

export async function analyze(req, res, next) {
  try {
    const { fieldId, model, startDate, endDate } = req.body
    const result = await aiService.analyzeData(req.body.projectId, fieldId, { model, startDate, endDate })
    return success(res, result)
  } catch (err) {
    next(err)
  }
}

export async function generateReport(req, res, next) {
  try {
    const { template } = req.body
    const result = await aiService.generateReport(req.body.projectId, { template })
    return success(res, result)
  } catch (err) {
    next(err)
  }
}

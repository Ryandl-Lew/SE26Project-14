import * as statisticsService from '../services/statistics.service.js'
import { success } from '../utils/response.js'

export async function getProjectStatistics(req, res, next) {
  try {
    const stats = await statisticsService.getProjectStatistics(req.params.id)
    return success(res, stats)
  } catch (err) {
    next(err)
  }
}

export async function getTimeSeriesData(req, res, next) {
  try {
    const { startDate, endDate } = req.query
    const data = await statisticsService.getTimeSeriesData(req.params.id, req.params.fieldId, { startDate, endDate })
    return success(res, data)
  } catch (err) {
    next(err)
  }
}

export async function getRecordOverview(req, res, next) {
  try {
    const overview = await statisticsService.getRecordOverview(req.params.id)
    return success(res, overview)
  } catch (err) {
    next(err)
  }
}

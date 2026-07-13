import * as recordService from '../services/record.service.js'
import { success } from '../utils/response.js'

export async function listRecords(req, res, next) {
  try {
    const { projectId, status, userId, page, pageSize, keyword, startDate, endDate } = req.query
    const result = await recordService.listRecords({
      projectId,
      status,
      userId,
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? parseInt(pageSize) : 20,
      keyword,
      startDate,
      endDate,
    })
    return success(res, result)
  } catch (err) {
    next(err)
  }
}

export async function createRecord(req, res, next) {
  try {
    const result = await recordService.createRecord({
      ...req.body,
      userId: req.user.userId,
    })
    return success(res, result, '记录创建成功', 201)
  } catch (err) {
    next(err)
  }
}

export async function getRecord(req, res, next) {
  try {
    const record = await recordService.getRecordDetail(req.params.id)
    return success(res, record)
  } catch (err) {
    next(err)
  }
}

export async function updateRecord(req, res, next) {
  try {
    const result = await recordService.updateRecord(req.params.id, req.body)
    return success(res, result, '更新成功')
  } catch (err) {
    next(err)
  }
}

export async function deleteRecord(req, res, next) {
  try {
    await recordService.deleteRecord(req.params.id)
    return success(res, null, '记录已归档')
  } catch (err) {
    next(err)
  }
}

export async function submitForReview(req, res, next) {
  try {
    const result = await recordService.submitForReview(req.params.id)
    return success(res, result, '已提交审核')
  } catch (err) {
    next(err)
  }
}

export async function approveRecord(req, res, next) {
  try {
    const result = await recordService.approveRecord(req.params.id)
    return success(res, result, '审核通过')
  } catch (err) {
    next(err)
  }
}

export async function rejectRecord(req, res, next) {
  try {
    const result = await recordService.rejectRecord(req.params.id, req.body.reason, req.user.userId)
    return success(res, result, '已退回修改')
  } catch (err) {
    next(err)
  }
}

export async function getRecordComments(req, res, next) {
  try {
    const comments = await recordService.getRecordComments(req.params.id)
    return success(res, comments)
  } catch (err) {
    next(err)
  }
}

export async function addComment(req, res, next) {
  try {
    const record = await recordService.getRecordDetail(req.params.id)
    const comment = await recordService.addComment(
      req.params.id,
      record.projectId,
      req.user.userId,
      req.body,
    )
    return success(res, comment, '评论已添加', 201)
  } catch (err) {
    next(err)
  }
}

export async function exportCSV(req, res, next) {
  try {
    const { projectId, startDate, endDate } = req.query
    const csv = await recordService.exportRecordsCSV({ projectId, startDate, endDate })
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename=records_export_${Date.now()}.csv`)
    return res.send(csv)
  } catch (err) {
    next(err)
  }
}

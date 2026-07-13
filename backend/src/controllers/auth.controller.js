import * as authService from '../services/auth.service.js'
import { success } from '../utils/response.js'

export async function register(req, res, next) {
  try {
    const result = await authService.register(req.body)
    return success(res, result, '注册成功', 201)
  } catch (err) {
    next(err)
  }
}

export async function login(req, res, next) {
  try {
    const result = await authService.login(req.body)
    return success(res, result, '登录成功')
  } catch (err) {
    next(err)
  }
}

export async function getMe(req, res, next) {
  try {
    const result = await authService.getProfile(req.user.userId)
    return success(res, result)
  } catch (err) {
    next(err)
  }
}

export async function updateProfile(req, res, next) {
  try {
    const result = await authService.updateProfile(req.user.userId, req.body)
    return success(res, result, '更新成功')
  } catch (err) {
    next(err)
  }
}

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import config from '../config/index.js'
import { AppError } from '../utils/AppError.js'

const prisma = new PrismaClient()

/**
 * 用户注册
 */
export async function register({ username, email, password, name }) {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
  })
  if (existing) {
    const field = existing.username === username ? '用户名' : '邮箱'
    throw new AppError(`${field}已被使用`, 409, 'DUPLICATE')
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { username, email, password: hashedPassword, name },
    select: { id: true, username: true, email: true, name: true, avatarUrl: true, createdAt: true },
  })

  return { user }
}

/**
 * 用户登录
 */
export async function login({ username, password }) {
  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) {
    throw new AppError('用户名或密码错误', 401, 'INVALID_CREDENTIALS')
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    throw new AppError('用户名或密码错误', 401, 'INVALID_CREDENTIALS')
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username },
    config.jwtSecret,
    { expiresIn: config.jwtExpire },
  )

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      avatarText: user.name?.charAt(0),
      avatarUrl: user.avatarUrl,
    },
    token,
  }
}

/**
 * 获取当前用户信息
 */
export async function getProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, email: true, name: true, avatarUrl: true, createdAt: true, updatedAt: true },
  })
  if (!user) {
    throw new AppError('用户不存在', 404, 'NOT_FOUND')
  }
  user.avatarText = user.name?.charAt(0)
  return { user }
}

/**
 * 更新用户信息
 */
export async function updateProfile(userId, data) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
    },
    select: { id: true, username: true, email: true, name: true, avatarUrl: true, updatedAt: true },
  })
  user.avatarText = user.name?.charAt(0)
  return { user }
}

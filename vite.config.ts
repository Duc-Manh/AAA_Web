import react from '@vitejs/plugin-react'
import bcrypt from 'bcryptjs'
import mysql from 'mysql2/promise'
import type { Plugin } from 'vite'
import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'

const mysqlConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '12345678',
  database: process.env.DB_NAME || '3ahome',
  port: Number(process.env.DB_PORT) || 3306,
}

function mysqlSimuPlugin(): Plugin {
  return {
    name: 'mysql-simu-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) return next()
        const url = new URL(req.url, 'http://localhost')

        if (url.pathname === '/api/simu') {
          if (req.method === 'POST') {
            let body = ''
            req.on('data', (chunk) => {
              body += chunk
            })
            req.on('end', async () => {
              try {
                const { full_name, email, phone } = JSON.parse(body || '{}')
                if (!full_name || !email || !phone) {
                  res.statusCode = 400
                  res.setHeader('Content-Type', 'application/json; charset=utf-8')
                  res.end(JSON.stringify({ error: 'Vui lòng điền đầy đủ thông tin' }))
                  return
                }

                const connection = await mysql.createConnection(mysqlConfig)

                try {
                  // Check existing record with matching full_name, email, phone
                  const [existingRows] = await connection.execute(
                    'SELECT * FROM simu WHERE full_name = ? AND email = ? AND phone = ? LIMIT 1',
                    [full_name.trim(), email.trim(), phone.trim()]
                  )
                  const existingList = existingRows as any[]
                  const existing = existingList[0]

                  if (existing) {
                    // Update count + 1 and timestamp
                    await connection.execute(
                      'UPDATE simu SET count = count + 1, time = NOW() WHERE id = ?',
                      [existing.id]
                    )

                    const [updatedRows] = await connection.execute(
                      'SELECT * FROM simu WHERE id = ?',
                      [existing.id]
                    )
                    const updated = (updatedRows as any[])[0]

                    res.setHeader('Content-Type', 'application/json; charset=utf-8')
                    res.end(
                      JSON.stringify({
                        success: true,
                        isReturning: true,
                        message: 'Chào mừng bạn quay trở lại',
                        record: updated,
                      })
                    )
                  } else {
                    // Insert new record
                    const [insertRes] = await connection.execute(
                      'INSERT INTO simu (time, full_name, email, phone, count) VALUES (NOW(), ?, ?, ?, 1)',
                      [full_name.trim(), email.trim(), phone.trim()]
                    )
                    const insertId = (insertRes as any).insertId

                    const [newRows] = await connection.execute(
                      'SELECT * FROM simu WHERE id = ?',
                      [insertId]
                    )
                    const newRecord = (newRows as any[])[0]

                    res.setHeader('Content-Type', 'application/json; charset=utf-8')
                    res.end(
                      JSON.stringify({
                        success: true,
                        isReturning: false,
                        message: 'Đăng ký phòng mô phỏng thành công',
                        record: newRecord,
                      })
                    )
                  }
                } finally {
                  await connection.end()
                }
              } catch (err: any) {
                console.error('[MySQL Error]:', err)
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json; charset=utf-8')
                res.end(JSON.stringify({ error: err.message || 'Lỗi máy chủ MySQL' }))
              }
            })
            return
          }

          if (req.method === 'GET') {
            try {
              const connection = await mysql.createConnection(mysqlConfig)
              try {
                const [rows] = await connection.execute(
                  'SELECT * FROM simu ORDER BY id DESC'
                )
                res.setHeader('Content-Type', 'application/json; charset=utf-8')
                res.end(JSON.stringify({ success: true, data: rows }))
              } finally {
                await connection.end()
              }
            } catch (err: any) {
              console.error('[MySQL Error]:', err)
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ error: err.message || 'Lỗi máy chủ MySQL' }))
            }
            return
          }
        }

        if (url.pathname === '/api/login/create' && req.method === 'POST') {
          let body = ''
          req.on('data', (chunk) => {
            body += chunk
          })
          req.on('end', async () => {
            try {
              const { full_name, room, position, gmail, password, phone, authen, state } = JSON.parse(body || '{}')
              if (!full_name || !gmail || !password) {
                res.statusCode = 400
                res.setHeader('Content-Type', 'application/json; charset=utf-8')
                res.end(JSON.stringify({ success: false, message: 'Vui lòng điền Họ tên, Gmail và Mật khẩu.' }))
                return
              }

              const hashedPassword = await bcrypt.hash(password, 10)
              const connection = await mysql.createConnection(mysqlConfig)
              try {
                const [insertRes] = await connection.execute(
                  'INSERT INTO login (time, full_name, room, position, gmail, password, phone, authen, state) VALUES (NOW(), ?, ?, ?, ?, ?, ?, ?, ?)',
                  [
                    full_name.trim(),
                    room?.trim() || null,
                    position?.trim() || null,
                    gmail.trim(),
                    hashedPassword,
                    phone?.trim() || null,
                    Number(authen) || 2,
                    state || 'active'
                  ]
                )
                const insertId = (insertRes as any).insertId
                const [newRows] = await connection.execute(
                  'SELECT id, time, full_name, room, position, gmail, password, phone, authen, state FROM login WHERE id = ?',
                  [insertId]
                )
                res.setHeader('Content-Type', 'application/json; charset=utf-8')
                res.end(
                  JSON.stringify({
                    success: true,
                    message: 'Thêm tài khoản thành công',
                    record: (newRows as any[])[0]
                  })
                )
              } finally {
                await connection.end()
              }
            } catch (err: any) {
              console.error('[MySQL Create Login Account Error]:', err)
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(
                JSON.stringify({
                  success: false,
                  message: err.message || 'Lỗi thêm tài khoản vào cơ sở dữ liệu'
                })
              )
            }
          })
          return
        }

        if (url.pathname === '/api/login' && req.method === 'POST') {
          let body = ''
          req.on('data', (chunk) => {
            body += chunk
          })
          req.on('end', async () => {
            try {
              const { gmail, password } = JSON.parse(body || '{}')
              if (!gmail || !password) {
                res.statusCode = 400
                res.setHeader('Content-Type', 'application/json; charset=utf-8')
                res.end(JSON.stringify({ success: false, message: 'Vui lòng điền đầy đủ Gmail và Mật khẩu.' }))
                return
              }

              const connection = await mysql.createConnection(mysqlConfig)
              try {
                const [rows] = await connection.execute(
                  'SELECT id, time, full_name, room, position, gmail, password, phone, authen, state FROM login WHERE gmail = ? LIMIT 1',
                  [gmail.trim()]
                )
                const list = rows as any[]
                if (list.length === 0) {
                  res.statusCode = 401
                  res.setHeader('Content-Type', 'application/json; charset=utf-8')
                  res.end(JSON.stringify({ success: false, message: 'Gmail hoặc Mật khẩu không chính xác.' }))
                  return
                }

                const user = list[0]
                if (user.state && user.state.toLowerCase() === 'inactive') {
                  res.statusCode = 403
                  res.setHeader('Content-Type', 'application/json; charset=utf-8')
                  res.end(JSON.stringify({ success: false, message: 'Tài khoản của bạn đang bị khóa.' }))
                  return
                }

                let isMatch = false
                if (user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))) {
                  isMatch = await bcrypt.compare(password, user.password)
                } else {
                  isMatch = (password === user.password)
                  if (isMatch) {
                    const upgradedHash = await bcrypt.hash(password, 10)
                    await connection.execute('UPDATE login SET password = ? WHERE id = ?', [upgradedHash, user.id])
                  }
                }

                if (!isMatch) {
                  res.statusCode = 401
                  res.setHeader('Content-Type', 'application/json; charset=utf-8')
                  res.end(JSON.stringify({ success: false, message: 'Gmail hoặc Mật khẩu không chính xác.' }))
                  return
                }

                try {
                  await connection.execute('UPDATE login SET last_online = NOW() WHERE id = ?', [user.id])
                  await connection.execute(
                    'INSERT INTO user_activity_logs (login_id, action_type, module, created_at) VALUES (?, "LOGIN", "overview", NOW())',
                    [user.id]
                  )
                } catch {
                  // ignore
                }

                res.setHeader('Content-Type', 'application/json; charset=utf-8')
                res.end(
                  JSON.stringify({
                    success: true,
                    message: 'Đăng nhập thành công',
                    user: {
                      id: user.id,
                      full_name: user.full_name,
                      room: user.room,
                      position: user.position,
                      gmail: user.gmail,
                      phone: user.phone,
                      authen: Number(user.authen),
                      state: user.state,
                    },
                  })
                )
              } finally {
                await connection.end()
              }
            } catch (err: any) {
              console.error('[MySQL Login Error]:', err)
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ success: false, message: err.message || 'Lỗi kết nối máy chủ MySQL' }))
            }
          })
          return
        }

        // API ghi nhận hoạt động (ping & truy cập danh mục)
        if (url.pathname === '/api/track-activity' && req.method === 'POST') {
          let body = ''
          req.on('data', (chunk) => {
            body += chunk
          })
          req.on('end', async () => {
            try {
              const { loginId, gmail, actionType = 'PING', module = 'overview' } = JSON.parse(body || '{}')
              if (!loginId && !gmail) {
                res.statusCode = 400
                res.setHeader('Content-Type', 'application/json; charset=utf-8')
                res.end(JSON.stringify({ success: false, message: 'Thiếu loginId hoặc gmail' }))
                return
              }
              const connection = await mysql.createConnection(mysqlConfig)
              try {
                let targetId = loginId
                if (!targetId && gmail) {
                  const [rows]: any = await connection.execute('SELECT id FROM login WHERE gmail = ? LIMIT 1', [String(gmail).trim()])
                  if (rows.length > 0) targetId = rows[0].id
                }

                if (targetId) {
                  await connection.execute('UPDATE login SET last_online = NOW() WHERE id = ?', [targetId])
                  await connection.execute(
                    'INSERT INTO user_activity_logs (login_id, action_type, module, created_at) VALUES (?, ?, ?, NOW())',
                    [targetId, actionType, module]
                  )
                }
                res.setHeader('Content-Type', 'application/json; charset=utf-8')
                res.end(JSON.stringify({ success: true }))
              } finally {
                await connection.end()
              }
            } catch (err: any) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ success: false, message: err.message }))
            }
          })
          return
        }

        // API thống kê toàn diện hoạt động nhân sự
        if (url.pathname === '/api/user-stats' && req.method === 'GET') {
          try {
            const connection = await mysql.createConnection(mysqlConfig)
            try {
              await connection.execute(`
                CREATE TABLE IF NOT EXISTS user_activity_logs (
                  id INT AUTO_INCREMENT PRIMARY KEY,
                  login_id INT NOT NULL,
                  action_type VARCHAR(50) NOT NULL,
                  module VARCHAR(50) NOT NULL,
                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                  INDEX idx_login_act (login_id, action_type, module, created_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
              `)

              const [users]: any = await connection.execute(`
                SELECT id, time, full_name, room, position, gmail, phone, authen, state, last_online,
                       CASE
                         WHEN last_online IS NOT NULL AND TIMESTAMPDIFF(SECOND, last_online, NOW()) <= 300 THEN 1
                         ELSE 0
                       END AS is_online_db
                FROM login
                ORDER BY id ASC
              `)
              const [logs]: any = await connection.execute(
                'SELECT login_id, action_type, module, created_at FROM user_activity_logs ORDER BY created_at DESC'
              )

              const now = new Date()

              const MODULE_KEYS = [
                { key: 'overview', name: 'Tổng quan' },
                { key: 'projects', name: 'Dự án triển khai' },
                { key: 'news', name: 'Tin tức truyền thông' },
                { key: 'supplies', name: 'Vật tư thiết bị' },
                { key: 'customers', name: 'Khách hàng' },
                { key: 'finance', name: 'Tài chính kế toán' },
                { key: 'tasks', name: 'Quản lý công việc' }
              ]

              const stats = users.map((u: any) => {
                const userLogs = logs.filter((l: any) => Number(l.login_id) === Number(u.id))
                const isOnline = Boolean(Number(u.is_online_db) === 1)

                const loginLogs = userLogs.filter((l: any) => l.action_type === 'LOGIN')
                const todayCount = loginLogs.filter((l: any) => new Date(l.created_at).toDateString() === now.toDateString()).length

                const startOfWeek = new Date(now)
                const day = startOfWeek.getDay() || 7
                startOfWeek.setDate(startOfWeek.getDate() - day + 1)
                startOfWeek.setHours(0, 0, 0, 0)
                const weekCount = loginLogs.filter((l: any) => new Date(l.created_at) >= startOfWeek).length

                const monthCount = loginLogs.filter((l: any) => {
                  const d = new Date(l.created_at)
                  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
                }).length

                const yearCount = loginLogs.filter((l: any) => {
                  const d = new Date(l.created_at)
                  return d.getFullYear() === now.getFullYear()
                }).length

                const modulesData: Record<string, any> = {}
                let totalModuleVisits = 0

                MODULE_KEYS.forEach(({ key, name }) => {
                  const modLogs = userLogs.filter((l: any) => l.action_type === 'VISIT_PAGE' && l.module === key)
                  const count = modLogs.length
                  totalModuleVisits += count
                  const timestamps = modLogs.map((l: any) => {
                    const d = new Date(l.created_at)
                    if (!isNaN(d.getTime())) {
                      const hh = String(d.getHours()).padStart(2, '0')
                      const mm = String(d.getMinutes()).padStart(2, '0')
                      const ss = String(d.getSeconds()).padStart(2, '0')
                      const dd = String(d.getDate()).padStart(2, '0')
                      const MM = String(d.getMonth() + 1).padStart(2, '0')
                      const yyyy = d.getFullYear()
                      return `${hh}:${mm}:${ss} ${dd}/${MM}/${yyyy}`
                    }
                    return String(l.created_at)
                  })

                  modulesData[key] = {
                    module_name: name,
                    count,
                    last_visited: timestamps.length > 0 ? timestamps[0] : null,
                    timestamps: timestamps.slice(0, 20)
                  }
                })

                const detailJson = {
                  user_id: u.id,
                  full_name: u.full_name,
                  gmail: u.gmail,
                  room: u.room || 'Chưa cập nhật',
                  position: u.position || 'Nhân viên',
                  role: Number(u.authen) === 1 ? 'Quản trị viên' : 'Nhân sự',
                  is_online: isOnline,
                  last_online: u.last_online ? new Date(u.last_online).toISOString().replace('T', ' ').substring(0, 19) : null,
                  online_statistics: {
                    today: Math.max(todayCount, isOnline ? 1 : 0),
                    this_week: Math.max(weekCount, isOnline ? 1 : 0),
                    this_month: Math.max(monthCount, isOnline ? 1 : 0),
                    this_year: Math.max(yearCount, isOnline ? 1 : 0)
                  },
                  total_module_visits: totalModuleVisits,
                  modules: modulesData
                }

                return {
                  ...u,
                  is_online: isOnline,
                  online_stats: detailJson.online_statistics,
                  modules: modulesData,
                  total_module_visits: totalModuleVisits,
                  raw_json: detailJson
                }
              })

              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({
                success: true,
                data: stats,
                summary: {
                  total_users: users.length,
                  online_now: stats.filter((s: any) => s.is_online).length
                }
              }))
            } finally {
              await connection.end()
            }
          } catch (err: any) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ success: false, message: err.message }))
          }
          return
        }

        if (url.pathname === '/api/login' && req.method === 'GET') {
          try {
            const connection = await mysql.createConnection(mysqlConfig)
            try {
              const [rows] = await connection.execute(
                'SELECT id, time, full_name, room, position, gmail, password, phone, authen, state FROM login ORDER BY id ASC'
              )
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ success: true, data: rows }))
            } finally {
              await connection.end()
            }
          } catch (err: any) {
            console.error('[MySQL Get Login Accounts Error]:', err)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ success: false, message: err.message || 'Lỗi truy vấn danh sách tài khoản' }))
          }
          return
        }

        if (url.pathname === '/api/login/reset-password' && req.method === 'POST') {
          let body = ''
          req.on('data', (chunk) => {
            body += chunk
          })
          req.on('end', async () => {
            try {
              const { id, password } = JSON.parse(body || '{}')
              if (!id) {
                res.statusCode = 400
                res.setHeader('Content-Type', 'application/json; charset=utf-8')
                res.end(JSON.stringify({ success: false, message: 'Thiếu ID tài khoản' }))
                return
              }
              const newPassword = password || '3AHome@2026'
              const hashedPassword = await bcrypt.hash(newPassword, 10)
              const connection = await mysql.createConnection(mysqlConfig)
              try {
                await connection.execute('UPDATE login SET password = ? WHERE id = ?', [hashedPassword, id])
                res.setHeader('Content-Type', 'application/json; charset=utf-8')
                res.end(JSON.stringify({ success: true, message: `Đã đặt lại mật khẩu về "${newPassword}" thành công!` }))
              } finally {
                await connection.end()
              }
            } catch (err: any) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ success: false, message: err.message || 'Lỗi reset mật khẩu' }))
            }
          })
          return
        }

        if (url.pathname.startsWith('/api/login') && (req.method === 'PUT' || (req.method === 'POST' && url.pathname.includes('/update')))) {
          let body = ''
          req.on('data', (chunk) => {
            body += chunk
          })
          req.on('end', async () => {
            try {
              const id = url.searchParams.get('id') || url.pathname.split('/').filter(Boolean)[2]
              const { full_name, room, position, gmail, password, phone, authen, state } = JSON.parse(body || '{}')
              const connection = await mysql.createConnection(mysqlConfig)
              try {
                if (password && password.trim()) {
                  let hashedPassword = password.trim()
                  if (!hashedPassword.startsWith('$2a$') && !hashedPassword.startsWith('$2b$')) {
                    hashedPassword = await bcrypt.hash(hashedPassword, 10)
                  }
                  await connection.execute(
                    'UPDATE login SET full_name = ?, room = ?, position = ?, gmail = ?, password = ?, phone = ?, authen = ?, state = ? WHERE id = ?',
                    [full_name, room, position, gmail, hashedPassword, phone, authen, state, id]
                  )
                } else {
                  await connection.execute(
                    'UPDATE login SET full_name = ?, room = ?, position = ?, gmail = ?, phone = ?, authen = ?, state = ? WHERE id = ?',
                    [full_name, room, position, gmail, phone, authen, state, id]
                  )
                }
                res.setHeader('Content-Type', 'application/json; charset=utf-8')
                res.end(JSON.stringify({ success: true, message: 'Đã cập nhật tài khoản thành công' }))
              } finally {
                await connection.end()
              }
            } catch (err: any) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ success: false, message: err.message || 'Lỗi cập nhật tài khoản' }))
            }
          })
          return
        }

        if (url.pathname.startsWith('/api/login') && (req.method === 'DELETE' || (req.method === 'POST' && url.pathname.includes('/delete')))) {
          const id = url.searchParams.get('id') || url.pathname.split('/').filter(Boolean)[2]
          try {
            const connection = await mysql.createConnection(mysqlConfig)
            try {
              await connection.execute('DELETE FROM login WHERE id = ?', [id])
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ success: true, message: 'Đã xóa tài khoản thành công' }))
            } finally {
              await connection.end()
            }
          } catch (err: any) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ success: false, message: err.message || 'Lỗi xóa tài khoản' }))
          }
          return
        }

        if (url.pathname === '/api/visit') {
          const connection = await mysql.createConnection(mysqlConfig)
          try {
            await connection.execute(`
              CREATE TABLE IF NOT EXISTS site_visits (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                session_id VARCHAR(100) NOT NULL,
                ip_address VARCHAR(100) DEFAULT NULL,
                user_agent TEXT DEFAULT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_active DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_session (session_id),
                INDEX idx_created (created_at),
                INDEX idx_active (last_active)
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `)

            if (req.method === 'POST') {
              let body = ''
              req.on('data', (chunk) => {
                body += chunk
              })
              req.on('end', async () => {
                try {
                  const { sessionId } = JSON.parse(body || '{}')
                  const cleanSessionId = (sessionId && String(sessionId).trim()) || 'anonymous_session'
                  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || null
                  const userAgent = (req.headers['user-agent'] as string) || null

                  const [existingRows] = await connection.execute(
                    'SELECT id FROM site_visits WHERE session_id = ? AND DATE(created_at) = CURDATE() LIMIT 1',
                    [cleanSessionId]
                  )
                  const existingList = existingRows as any[]
                  if (existingList.length > 0) {
                    await connection.execute('UPDATE site_visits SET last_active = NOW() WHERE id = ?', [existingList[0].id])
                  } else {
                    await connection.execute(
                      'INSERT INTO site_visits (session_id, ip_address, user_agent, created_at, last_active) VALUES (?, ?, ?, NOW(), NOW())',
                      [cleanSessionId, clientIp, userAgent]
                    )
                  }

                  const [statsRows] = await connection.execute(`
                    SELECT
                      (SELECT COUNT(DISTINCT session_id) FROM site_visits WHERE last_active >= NOW() - INTERVAL 5 MINUTE) AS online,
                      (SELECT COUNT(DISTINCT session_id) FROM site_visits WHERE DATE(created_at) = CURDATE()) AS today,
                      (SELECT COUNT(DISTINCT session_id) FROM site_visits WHERE YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())) AS month,
                      (SELECT COUNT(DISTINCT session_id) FROM site_visits WHERE YEAR(created_at) = YEAR(CURDATE())) AS year,
                      (SELECT COUNT(DISTINCT session_id) FROM site_visits) AS total,
                      (SELECT COALESCE(SUM(count), 0) FROM simu) AS simu_visits,
                      (SELECT COUNT(*) FROM simu) AS simu_users
                  `)
                  const stats = (statsRows as any[])[0] || {}
                  res.setHeader('Content-Type', 'application/json; charset=utf-8')
                  res.end(JSON.stringify({
                    success: true,
                    stats: {
                      online: Math.max(1, Number(stats.online || 1)),
                      today: Number(stats.today || 1),
                      month: Number(stats.month || 1),
                      year: Number(stats.year || 1),
                      total: Number(stats.total || 1),
                      simu: Number(stats.simu_visits || stats.simu_users || 0),
                      simuUsers: Number(stats.simu_users || 0)
                    }
                  }))
                } catch (err: any) {
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json; charset=utf-8')
                  res.end(JSON.stringify({ success: false, message: err.message || 'Lỗi xử lý visit' }))
                } finally {
                  await connection.end()
                }
              })
              return
            } else {
              // GET
              const [statsRows] = await connection.execute(`
                SELECT
                  (SELECT COUNT(DISTINCT session_id) FROM site_visits WHERE last_active >= NOW() - INTERVAL 5 MINUTE) AS online,
                  (SELECT COUNT(DISTINCT session_id) FROM site_visits WHERE DATE(created_at) = CURDATE()) AS today,
                  (SELECT COUNT(DISTINCT session_id) FROM site_visits WHERE YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())) AS month,
                  (SELECT COUNT(DISTINCT session_id) FROM site_visits WHERE YEAR(created_at) = YEAR(CURDATE())) AS year,
                  (SELECT COUNT(DISTINCT session_id) FROM site_visits) AS total,
                  (SELECT COALESCE(SUM(count), 0) FROM simu) AS simu_visits,
                  (SELECT COUNT(*) FROM simu) AS simu_users
              `)
              const stats = (statsRows as any[])[0] || {}
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({
                success: true,
                stats: {
                  online: Math.max(1, Number(stats.online || 1)),
                  today: Number(stats.today || 1),
                  month: Number(stats.month || 1),
                  year: Number(stats.year || 1),
                  total: Number(stats.total || 1),
                  simu: Number(stats.simu_visits || stats.simu_users || 0),
                  simuUsers: Number(stats.simu_users || 0)
                }
              }))
              await connection.end()
              return
            }
          } catch (err: any) {
            await connection.end()
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ success: false, message: err.message || 'Lỗi server visit' }))
            return
          }
        }

        if (url.pathname === '/api/consult') {
          const connection = await mysql.createConnection(mysqlConfig)
          try {
            await connection.execute(`
              CREATE TABLE IF NOT EXISTS consult (
                id INT AUTO_INCREMENT PRIMARY KEY,
                time DATETIME DEFAULT CURRENT_TIMESTAMP,
                full_name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(50) NOT NULL,
                type VARCHAR(100) NOT NULL,
                content TEXT DEFAULT NULL,
                status INT NOT NULL DEFAULT 1
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `)

            if (req.method === 'POST') {
              let body = ''
              req.on('data', (chunk) => {
                body += chunk
              })
              req.on('end', async () => {
                try {
                  const { full_name, email, phone, type, content } = JSON.parse(body || '{}')
                  if (!full_name || !email || !phone) {
                    res.statusCode = 400
                    res.setHeader('Content-Type', 'application/json; charset=utf-8')
                    res.end(JSON.stringify({ success: false, message: 'Vui lòng điền đầy đủ thông tin.' }))
                    return
                  }

                  const [result] = await connection.execute(
                    'INSERT INTO consult (time, full_name, email, phone, type, content, status) VALUES (NOW(), ?, ?, ?, ?, ?, 1)',
                    [full_name.trim(), email.trim(), phone.trim(), (type || 'Tư vấn giải pháp').trim(), content ? content.trim() : null]
                  )

                  res.setHeader('Content-Type', 'application/json; charset=utf-8')
                  res.end(JSON.stringify({
                    success: true,
                    message: 'Gửi yêu cầu tư vấn thành công',
                    id: (result as any).insertId
                  }))
                } catch (err: any) {
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json; charset=utf-8')
                  res.end(JSON.stringify({ success: false, message: err.message || 'Lỗi lưu thông tin tư vấn' }))
                } finally {
                  await connection.end()
                }
              })
              return
            } else {
              // GET
              const [rows] = await connection.execute('SELECT * FROM consult ORDER BY id DESC')
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ success: true, data: rows }))
              await connection.end()
              return
            }
          } catch (err: any) {
            await connection.end()
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ success: false, message: err.message || 'Lỗi server consult' }))
            return
          }
        }

        // Phục vụ ảnh từ /uploads/ và /AAA_Backend/uploads/
        if (url.pathname.startsWith('/uploads/') || url.pathname.startsWith('/AAA_Backend/uploads/')) {
          const relPath = url.pathname.startsWith('/AAA_Backend/uploads/')
            ? url.pathname.replace(/^\/AAA_Backend/, '').slice(1)
            : url.pathname.slice(1)
          const uploadsFile = path.resolve(__dirname, '../AAA_Backend', relPath)
          if (fs.existsSync(uploadsFile)) {
            const ext = path.extname(uploadsFile).toLowerCase()
            const contentType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg'
            res.setHeader('Content-Type', contentType)
            fs.createReadStream(uploadsFile).pipe(res)
            return
          }
        }

        // API quản lý tin tức: /api/news
        if (url.pathname === '/api/news' || url.pathname.startsWith('/api/news/')) {
          const connection = await mysql.createConnection(mysqlConfig)
          try {
            await connection.execute(`
              CREATE TABLE IF NOT EXISTS news (
                id INT AUTO_INCREMENT PRIMARY KEY,
                time DATETIME DEFAULT CURRENT_TIMESTAMP,
                topic VARCHAR(100) NOT NULL,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                image VARCHAR(255) DEFAULT NULL,
                author VARCHAR(255) NOT NULL,
                status INT NOT NULL DEFAULT 1
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `)

            // 1. GET /api/news
            if (url.pathname === '/api/news' && req.method === 'GET') {
              const [rows] = await connection.execute('SELECT * FROM news ORDER BY id DESC')
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ success: true, data: rows }))
              await connection.end()
              return
            }

            // 2. POST /api/news
            if (url.pathname === '/api/news' && req.method === 'POST') {
              let body = ''
              req.on('data', (chunk) => { body += chunk })
              req.on('end', async () => {
                try {
                  const { topic, title, content, author, imageBase64, imageFileName } = JSON.parse(body || '{}')
                  if (!topic || !title || !content) {
                    res.statusCode = 400
                    res.setHeader('Content-Type', 'application/json; charset=utf-8')
                    res.end(JSON.stringify({ success: false, message: 'Vui lòng điền đủ Chủ đề, Tiêu đề và Nội dung' }))
                    return
                  }

                  let imageDbPath = ''
                  if (imageBase64) {
                    let filename = imageFileName
                    if (!filename) {
                      const now = new Date()
                      const dd = String(now.getDate()).padStart(2, '0')
                      const mm = String(now.getMonth() + 1).padStart(2, '0')
                      const yyyy = now.getFullYear()
                      const codeimg = Math.random().toString(36).substring(2, 8).toUpperCase()
                      filename = `[${dd}-${mm}-${yyyy}][${codeimg}].jpg`
                    }

                    const uploadsDir = path.resolve(__dirname, '../AAA_Backend/uploads/news')
                    if (!fs.existsSync(uploadsDir)) {
                      fs.mkdirSync(uploadsDir, { recursive: true })
                    }
                    const filePath = path.join(uploadsDir, filename)
                    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')
                    await fs.promises.writeFile(filePath, Buffer.from(base64Data, 'base64'))
                    imageDbPath = `\\AAA_Backend\\uploads\\news\\${filename}`
                  }

                  const [result]: any = await connection.execute(
                    'INSERT INTO news (time, topic, title, content, image, author, status) VALUES (NOW(), ?, ?, ?, ?, ?, 1)',
                    [topic.trim(), title.trim(), content.trim(), imageDbPath || null, (author || 'Quản trị viên').trim()]
                  )

                  res.setHeader('Content-Type', 'application/json; charset=utf-8')
                  res.end(JSON.stringify({ success: true, message: 'Tạo bài đăng thành công', id: result.insertId, image: imageDbPath }))
                } catch (err: any) {
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json; charset=utf-8')
                  res.end(JSON.stringify({ success: false, message: err.message || 'Lỗi lưu bài đăng' }))
                } finally {
                  await connection.end()
                }
              })
              return
            }

            // 3. PUT /api/news/:id (Sửa)
            if (url.pathname.startsWith('/api/news/') && req.method === 'PUT') {
              const id = url.pathname.split('/')[3]
              let body = ''
              req.on('data', (chunk) => { body += chunk })
              req.on('end', async () => {
                try {
                  const { topic, title, content, author, status, imageBase64, imageFileName } = JSON.parse(body || '{}')
                  let imageDbPath: string | undefined = undefined
                  if (imageBase64 && typeof imageBase64 === 'string' && imageBase64.startsWith('data:image')) {
                    let filename = imageFileName
                    if (!filename) {
                      const now = new Date()
                      const dd = String(now.getDate()).padStart(2, '0')
                      const mm = String(now.getMonth() + 1).padStart(2, '0')
                      const yyyy = now.getFullYear()
                      const codeimg = Math.random().toString(36).substring(2, 8).toUpperCase()
                      filename = `[${dd}-${mm}-${yyyy}][${codeimg}].jpg`
                    }

                    const uploadsDir = path.resolve(__dirname, '../AAA_Backend/uploads/news')
                    if (!fs.existsSync(uploadsDir)) {
                      fs.mkdirSync(uploadsDir, { recursive: true })
                    }

                    const filePath = path.join(uploadsDir, filename)
                    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')
                    await fs.promises.writeFile(filePath, Buffer.from(base64Data, 'base64'))
                    imageDbPath = `\\AAA_Backend\\uploads\\news\\${filename}`
                  }

                  if (imageDbPath !== undefined) {
                    await connection.execute(
                      'UPDATE news SET topic = ?, title = ?, content = ?, author = ?, status = ?, image = ? WHERE id = ?',
                      [(topic || '').trim(), (title || '').trim(), (content || '').trim(), (author || 'Quản trị viên').trim(), Number(status) || 1, imageDbPath, id]
                    )
                  } else {
                    await connection.execute(
                      'UPDATE news SET topic = ?, title = ?, content = ?, author = ?, status = ? WHERE id = ?',
                      [(topic || '').trim(), (title || '').trim(), (content || '').trim(), (author || 'Quản trị viên').trim(), Number(status) || 1, id]
                    )
                  }
                  res.setHeader('Content-Type', 'application/json; charset=utf-8')
                  res.end(JSON.stringify({ success: true, message: 'Cập nhật thành công' }))
                } catch (err: any) {
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json; charset=utf-8')
                  res.end(JSON.stringify({ success: false, message: err.message || 'Lỗi cập nhật' }))
                } finally {
                  await connection.end()
                }
              })
              return
            }

            // 4. PATCH /api/news/:id/hide (Ẩn bài)
            if (url.pathname.includes('/hide') && (req.method === 'PATCH' || req.method === 'POST')) {
              const parts = url.pathname.split('/')
              const id = parts[3]
              await connection.execute('UPDATE news SET status = 3 WHERE id = ?', [id])
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ success: true, message: 'Đã ẩn bài viết' }))
              await connection.end()
              return
            }

            // 5. DELETE /api/news/:id (Xoá hàng và file ảnh)
            if (url.pathname.startsWith('/api/news/') && req.method === 'DELETE') {
              const id = url.pathname.split('/')[3]
              const [rows]: any = await connection.execute('SELECT image FROM news WHERE id = ?', [id])
              if (rows && rows.length > 0 && rows[0].image) {
                const imgPath = rows[0].image
                const filename = path.basename(imgPath)
                const physicalPath = path.resolve(__dirname, '../AAA_Backend/uploads/news', filename)
                if (fs.existsSync(physicalPath)) {
                  try {
                    await fs.promises.unlink(physicalPath)
                  } catch {
                    // ignore
                  }
                }
              }
              await connection.execute('DELETE FROM news WHERE id = ?', [id])
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ success: true, message: 'Đã xoá bài viết và hình ảnh' }))
              await connection.end()
              return
            }
          } catch (err: any) {
            await connection.end()
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ success: false, message: err.message || 'Lỗi server news' }))
            return
          }
        }

        // API quản lý dự án: /api/projects
        if (url.pathname === '/api/projects' || url.pathname.startsWith('/api/projects/')) {
          const connection = await mysql.createConnection(mysqlConfig)
          try {
            await connection.execute(`
              CREATE TABLE IF NOT EXISTS project (
                id INT AUTO_INCREMENT PRIMARY KEY,
                time DATETIME DEFAULT CURRENT_TIMESTAMP,
                type VARCHAR(255) NOT NULL,
                title VARCHAR(500) NOT NULL,
                content TEXT NOT NULL,
                place VARCHAR(255) NOT NULL,
                year VARCHAR(50) DEFAULT NULL,
                start VARCHAR(50) DEFAULT NULL,
                image VARCHAR(500) DEFAULT NULL,
                status INT NOT NULL DEFAULT 1
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `)

            // 1. GET /api/projects
            if (url.pathname === '/api/projects' && req.method === 'GET') {
              const [rows] = await connection.execute('SELECT * FROM project ORDER BY id DESC')
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ success: true, data: rows }))
              await connection.end()
              return
            }

            // 2. POST /api/projects
            if (url.pathname === '/api/projects' && req.method === 'POST') {
              let body = ''
              req.on('data', (chunk) => { body += chunk })
              req.on('end', async () => {
                try {
                  const { type, title, content, place, start, year, imageBase64, imageFileName } = JSON.parse(body || '{}')
                  if (!type || !title || !content || !place) {
                    res.statusCode = 400
                    res.setHeader('Content-Type', 'application/json; charset=utf-8')
                    res.end(JSON.stringify({ success: false, message: 'Vui lòng điền đầy đủ các thông tin dự án' }))
                    return
                  }

                  const projectYear = (start || year || new Date().getFullYear().toString()).trim()
                  let imageDbPath = ''
                  if (imageBase64) {
                    let filename = imageFileName
                    if (!filename) {
                      const now = new Date()
                      const dd = String(now.getDate()).padStart(2, '0')
                      const mm = String(now.getMonth() + 1).padStart(2, '0')
                      const yy = String(now.getFullYear()).slice(-2)
                      const codeimg = Math.random().toString(36).substring(2, 8).toUpperCase()
                      filename = `proj[${dd}-${mm}-${yy}][${codeimg}].jpg`
                    }

                    const uploadsDir = path.resolve(__dirname, '../AAA_Backend/uploads/project')
                    if (!fs.existsSync(uploadsDir)) {
                      fs.mkdirSync(uploadsDir, { recursive: true })
                    }
                    const filePath = path.join(uploadsDir, filename)
                    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')
                    await fs.promises.writeFile(filePath, Buffer.from(base64Data, 'base64'))
                    imageDbPath = `/AAA_Backend/uploads/project/${filename}`
                  }

                  const [result]: any = await connection.execute(
                    'INSERT INTO project (time, type, title, content, place, year, start, image, status) VALUES (NOW(), ?, ?, ?, ?, ?, ?, ?, 1)',
                    [
                      type.trim(),
                      title.trim(),
                      content.trim(),
                      place.trim(),
                      projectYear,
                      projectYear,
                      imageDbPath || null
                    ]
                  )

                  res.setHeader('Content-Type', 'application/json; charset=utf-8')
                  res.end(JSON.stringify({ success: true, message: 'Tạo dự án thành công', id: result.insertId, image: imageDbPath }))
                  await connection.end()
                } catch (saveErr: any) {
                  await connection.end()
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json; charset=utf-8')
                  res.end(JSON.stringify({ success: false, message: saveErr.message || 'Lỗi lưu dự án' }))
                }
              })
              return
            }

            // 3. PUT /api/projects/:id
            if (url.pathname.startsWith('/api/projects/') && req.method === 'PUT') {
              const id = url.pathname.split('/')[3]
              let body = ''
              req.on('data', (chunk) => { body += chunk })
              req.on('end', async () => {
                try {
                  const { type, title, content, place, start, year, status } = JSON.parse(body || '{}')
                  const projectYear = (start || year || '').trim()
                  await connection.execute(
                    'UPDATE project SET type = ?, title = ?, content = ?, place = ?, start = ?, year = ?, status = ? WHERE id = ?',
                    [
                      (type || '').trim(),
                      (title || '').trim(),
                      (content || '').trim(),
                      (place || '').trim(),
                      projectYear,
                      projectYear,
                      Number(status) || 1,
                      id
                    ]
                  )
                  res.setHeader('Content-Type', 'application/json; charset=utf-8')
                  res.end(JSON.stringify({ success: true, message: 'Cập nhật dự án thành công' }))
                  await connection.end()
                } catch (updateErr: any) {
                  await connection.end()
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json; charset=utf-8')
                  res.end(JSON.stringify({ success: false, message: updateErr.message || 'Lỗi cập nhật dự án' }))
                }
              })
              return
            }

            // 4. PATCH /api/projects/:id/status hoặc /hide
            if (url.pathname.startsWith('/api/projects/') && req.method === 'PATCH') {
              const parts = url.pathname.split('/')
              const id = parts[3]
              const subAction = parts[4]
              if (subAction === 'hide') {
                await connection.execute('UPDATE project SET status = 3 WHERE id = ?', [id])
                res.setHeader('Content-Type', 'application/json; charset=utf-8')
                res.end(JSON.stringify({ success: true, message: 'Đã ẩn dự án' }))
                await connection.end()
                return
              }
              let body = ''
              req.on('data', (chunk) => { body += chunk })
              req.on('end', async () => {
                try {
                  const { status } = JSON.parse(body || '{}')
                  await connection.execute('UPDATE project SET status = ? WHERE id = ?', [Number(status) || 1, id])
                  res.setHeader('Content-Type', 'application/json; charset=utf-8')
                  res.end(JSON.stringify({ success: true, message: 'Đã cập nhật trạng thái' }))
                  await connection.end()
                } catch (patchErr: any) {
                  await connection.end()
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json; charset=utf-8')
                  res.end(JSON.stringify({ success: false, message: patchErr.message }))
                }
              })
              return
            }

            // 5. DELETE /api/projects/:id (Xoá dự án và file ảnh)
            if (url.pathname.startsWith('/api/projects/') && req.method === 'DELETE') {
              const id = url.pathname.split('/')[3]
              const [rows]: any = await connection.execute('SELECT image FROM project WHERE id = ?', [id])
              if (rows && rows.length > 0 && rows[0].image) {
                const imgPath = rows[0].image
                const filename = path.basename(imgPath)
                const physicalPath = path.resolve(__dirname, '../AAA_Backend/uploads/project', filename)
                if (fs.existsSync(physicalPath)) {
                  try {
                    await fs.promises.unlink(physicalPath)
                  } catch {
                    // ignore
                  }
                }
              }
              await connection.execute('DELETE FROM project WHERE id = ?', [id])
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ success: true, message: 'Đã xoá dự án và hình ảnh' }))
              await connection.end()
              return
            }
          } catch (err: any) {
            await connection.end()
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ success: false, message: err.message || 'Lỗi server projects' }))
            return
          }
        }

        // API quản lý thiết bị: /api/device
        if (url.pathname === '/api/device' || url.pathname.startsWith('/api/device/')) {
          const connection = await mysql.createConnection(mysqlConfig)
          try {
            await connection.execute(`
              CREATE TABLE IF NOT EXISTS device (
                id INT AUTO_INCREMENT PRIMARY KEY,
                time DATETIME DEFAULT CURRENT_TIMESTAMP,
                brand VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                image VARCHAR(500) DEFAULT NULL,
                status INT NOT NULL DEFAULT 1
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `)

            // 1. GET /api/device
            if (url.pathname === '/api/device' && req.method === 'GET') {
              const [rows] = await connection.execute('SELECT * FROM device ORDER BY id DESC')
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ success: true, data: rows }))
              await connection.end()
              return
            }

            // 2. POST /api/device
            if (url.pathname === '/api/device' && req.method === 'POST') {
              let body = ''
              req.on('data', (chunk) => {
                body += chunk
              })
              req.on('end', async () => {
                try {
                  const { brand, name, imageBase64, imageFileName } = JSON.parse(body || '{}')
                  if (!brand || !name) {
                    res.statusCode = 400
                    res.setHeader('Content-Type', 'application/json; charset=utf-8')
                    res.end(JSON.stringify({ success: false, message: 'Vui lòng nhập đầy đủ Hãng sản xuất và Tên thiết bị' }))
                    return
                  }

                  let imageDbPath = ''
                  if (imageBase64) {
                    let filename = imageFileName
                    if (!filename) {
                      const now = new Date()
                      const dd = String(now.getDate()).padStart(2, '0')
                      const mm = String(now.getMonth() + 1).padStart(2, '0')
                      const yy = String(now.getFullYear()).slice(-2)
                      const codeimg = Math.random().toString(36).substring(2, 8).toUpperCase()
                      filename = `device[${dd}-${mm}-${yy}][${codeimg}].jpg`
                    }

                    // Lưu vào uploads/device
                    const uploadsDeviceDir = path.resolve(__dirname, '../AAA_Backend/uploads/device')
                    if (!fs.existsSync(uploadsDeviceDir)) {
                      fs.mkdirSync(uploadsDeviceDir, { recursive: true })
                    }
                    const filePath = path.join(uploadsDeviceDir, filename)
                    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')
                    await fs.promises.writeFile(filePath, Buffer.from(base64Data, 'base64'))

                    // Đồng thời lưu vào uploads/news để tương thích đường dẫn
                    const uploadsNewsDir = path.resolve(__dirname, '../AAA_Backend/uploads/news')
                    if (!fs.existsSync(uploadsNewsDir)) {
                      fs.mkdirSync(uploadsNewsDir, { recursive: true })
                    }
                    try {
                      await fs.promises.copyFile(filePath, path.join(uploadsNewsDir, filename))
                    } catch {
                      // ignore
                    }

                    imageDbPath = `/AAA_Backend/uploads/device/${filename}`
                  }

                  const [result]: any = await connection.execute(
                    'INSERT INTO device (time, brand, name, image, status) VALUES (NOW(), ?, ?, ?, 1)',
                    [brand.trim(), name.trim(), imageDbPath || null]
                  )

                  res.setHeader('Content-Type', 'application/json; charset=utf-8')
                  res.end(
                    JSON.stringify({
                      success: true,
                      message: 'Đăng thiết bị thành công',
                      id: result.insertId,
                      image: imageDbPath,
                    })
                  )
                  await connection.end()
                } catch (postErr: any) {
                  await connection.end()
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json; charset=utf-8')
                  res.end(JSON.stringify({ success: false, message: postErr.message }))
                }
              })
              return
            }

            // 3. PUT /api/device/:id (Sửa)
            if (url.pathname.startsWith('/api/device/') && req.method === 'PUT') {
              const id = url.pathname.split('/')[3]
              let body = ''
              req.on('data', (chunk) => {
                body += chunk
              })
              req.on('end', async () => {
                try {
                  const { brand, name, status, imageBase64, imageFileName } = JSON.parse(body || '{}')
                  if (!brand || !name) {
                    res.statusCode = 400
                    res.setHeader('Content-Type', 'application/json; charset=utf-8')
                    res.end(JSON.stringify({ success: false, message: 'Vui lòng nhập đầy đủ Hãng sản xuất và Tên thiết bị' }))
                    return
                  }

                  let imageDbPath = undefined
                  if (imageBase64 && typeof imageBase64 === 'string' && imageBase64.startsWith('data:image')) {
                    const filename = imageFileName || `device[${Date.now()}].jpg`
                    const uploadsDeviceDir = path.resolve(__dirname, '../AAA_Backend/uploads/device')
                    if (!fs.existsSync(uploadsDeviceDir)) {
                      fs.mkdirSync(uploadsDeviceDir, { recursive: true })
                    }
                    const filePath = path.join(uploadsDeviceDir, filename)
                    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')
                    await fs.promises.writeFile(filePath, Buffer.from(base64Data, 'base64'))

                    const uploadsNewsDir = path.resolve(__dirname, '../AAA_Backend/uploads/news')
                    if (!fs.existsSync(uploadsNewsDir)) {
                      fs.mkdirSync(uploadsNewsDir, { recursive: true })
                    }
                    try {
                      await fs.promises.copyFile(filePath, path.join(uploadsNewsDir, filename))
                    } catch {
                      // ignore
                    }

                    imageDbPath = `\\AAA_Backend\\uploads\\news\\${filename}`
                  }

                  if (imageDbPath !== undefined) {
                    await connection.execute(
                      'UPDATE device SET brand = ?, name = ?, status = ?, image = ? WHERE id = ?',
                      [brand.trim(), name.trim(), Number(status) || 1, imageDbPath, id]
                    )
                  } else {
                    await connection.execute(
                      'UPDATE device SET brand = ?, name = ?, status = ? WHERE id = ?',
                      [brand.trim(), name.trim(), Number(status) || 1, id]
                    )
                  }

                  res.setHeader('Content-Type', 'application/json; charset=utf-8')
                  res.end(JSON.stringify({ success: true, message: 'Cập nhật thiết bị thành công' }))
                  await connection.end()
                } catch (putErr: any) {
                  await connection.end()
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json; charset=utf-8')
                  res.end(JSON.stringify({ success: false, message: putErr.message }))
                }
              })
              return
            }

            // 4. PATCH /api/device/:id/hide (Ẩn thiết bị)
            if (url.pathname.match(/\/api\/device\/\d+\/hide/) && req.method === 'PATCH') {
              const id = url.pathname.split('/')[3]
              await connection.execute('UPDATE device SET status = 2 WHERE id = ?', [id])
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ success: true, message: 'Đã ẩn thiết bị' }))
              await connection.end()
              return
            }

            // 5. PATCH /api/device/:id/status (Đổi trạng thái)
            if (url.pathname.match(/\/api\/device\/\d+\/status/) && req.method === 'PATCH') {
              const id = url.pathname.split('/')[3]
              let body = ''
              req.on('data', (chunk) => {
                body += chunk
              })
              req.on('end', async () => {
                try {
                  const { status } = JSON.parse(body || '{}')
                  await connection.execute('UPDATE device SET status = ? WHERE id = ?', [Number(status) || 1, id])
                  res.setHeader('Content-Type', 'application/json; charset=utf-8')
                  res.end(JSON.stringify({ success: true, message: 'Đã cập nhật trạng thái thiết bị' }))
                  await connection.end()
                } catch (patchErr: any) {
                  await connection.end()
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json; charset=utf-8')
                  res.end(JSON.stringify({ success: false, message: patchErr.message }))
                }
              })
              return
            }

            // 6. DELETE /api/device/:id (Xoá thiết bị và file ảnh)
            if (url.pathname.startsWith('/api/device/') && req.method === 'DELETE') {
              const id = url.pathname.split('/')[3]
              const [rows]: any = await connection.execute('SELECT image FROM device WHERE id = ?', [id])
              if (rows && rows.length > 0 && rows[0].image) {
                const imgPath = rows[0].image
                const filename = path.basename(imgPath)
                const deviceFile = path.resolve(__dirname, '../AAA_Backend/uploads/device', filename)
                if (fs.existsSync(deviceFile)) {
                  try {
                    await fs.promises.unlink(deviceFile)
                  } catch {
                    // ignore
                  }
                }
                const newsFile = path.resolve(__dirname, '../AAA_Backend/uploads/news', filename)
                if (fs.existsSync(newsFile)) {
                  try {
                    await fs.promises.unlink(newsFile)
                  } catch {
                    // ignore
                  }
                }
              }
              await connection.execute('DELETE FROM device WHERE id = ?', [id])
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ success: true, message: 'Đã xoá thiết bị và hình ảnh' }))
              await connection.end()
              return
            }
          } catch (err: any) {
            await connection.end()
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ success: false, message: err.message || 'Lỗi server device' }))
            return
          }
        }

        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), mysqlSimuPlugin()],
})

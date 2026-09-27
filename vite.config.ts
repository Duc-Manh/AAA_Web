import react from '@vitejs/plugin-react'
import mysql from 'mysql2/promise'
import type { Plugin } from 'vite'
import { defineConfig } from 'vite'

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

        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), mysqlSimuPlugin()],
})

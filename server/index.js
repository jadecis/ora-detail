import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import express from 'express'

const app = express()
const PORT = process.env.PORT || 3001
const DATA_DIR = path.join(process.cwd(), 'data')
const USERS_PATH = path.join(DATA_DIR, 'users.json')
const PRODUCTS_PATH = path.join(DATA_DIR, 'products.json')
const SERVICES_PATH = path.join(DATA_DIR, 'services.json')
const ORDER_HISTORY_PATH = path.join(DATA_DIR, 'order-history.json')
const SERVICE_BOOKINGS_PATH = path.join(DATA_DIR, 'service-bookings.json')
const PRODUCTS_SEED_PATH = path.join(process.cwd(), 'src', 'products.json')
const SERVICES_SEED_PATH = path.join(process.cwd(), 'public', 'ora-services.json')

app.use(express.json())

const ensureDataDir = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

const ensureJsonArrayFile = (filePath, fallback = '[]') => {
  ensureDataDir()
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, fallback, 'utf-8')
  }
}

const ensureJsonObjectFile = (filePath, fallback = '{}') => {
  ensureDataDir()
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, fallback, 'utf-8')
  }
}

const readJsonArray = (filePath) => {
  ensureJsonArrayFile(filePath)
  const raw = fs.readFileSync(filePath, 'utf-8')
  try {
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

const writeJsonArray = (filePath, data) => {
  ensureJsonArrayFile(filePath)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

const readJsonObject = (filePath) => {
  ensureJsonObjectFile(filePath)
  const raw = fs.readFileSync(filePath, 'utf-8')
  try {
    const data = JSON.parse(raw)
    return data && typeof data === 'object' && !Array.isArray(data) ? data : {}
  } catch {
    return {}
  }
}

const writeJsonObject = (filePath, data) => {
  ensureJsonObjectFile(filePath)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

const ensureProductsFile = () => {
  ensureDataDir()
  if (fs.existsSync(PRODUCTS_PATH)) return

  let fallback = '[]'
  if (fs.existsSync(PRODUCTS_SEED_PATH)) {
    fallback = fs.readFileSync(PRODUCTS_SEED_PATH, 'utf-8')
  }
  fs.writeFileSync(PRODUCTS_PATH, fallback, 'utf-8')
}

const ensureServicesFile = () => {
  ensureDataDir()
  if (fs.existsSync(SERVICES_PATH)) return

  let fallback = '[]'
  if (fs.existsSync(SERVICES_SEED_PATH)) {
    fallback = fs.readFileSync(SERVICES_SEED_PATH, 'utf-8')
  }
  fs.writeFileSync(SERVICES_PATH, fallback, 'utf-8')
}

const readUsers = () => readJsonArray(USERS_PATH)
const writeUsers = (users) => writeJsonArray(USERS_PATH, users)

const readProducts = () => {
  ensureProductsFile()
  return readJsonArray(PRODUCTS_PATH)
}

const writeProducts = (products) => {
  ensureProductsFile()
  writeJsonArray(PRODUCTS_PATH, products)
}

const readServices = () => {
  ensureServicesFile()
  return readJsonArray(SERVICES_PATH)
}

const writeServices = (services) => {
  ensureServicesFile()
  writeJsonArray(SERVICES_PATH, services)
}

const readOrderHistoryByUser = () => readJsonObject(ORDER_HISTORY_PATH)
const writeOrderHistoryByUser = (history) => writeJsonObject(ORDER_HISTORY_PATH, history)

const readServiceBookingsByUser = () => readJsonObject(SERVICE_BOOKINGS_PATH)
const writeServiceBookingsByUser = (bookings) => writeJsonObject(SERVICE_BOOKINGS_PATH, bookings)

const ensureAdminUser = () => {
  const users = readUsers()
  const existing = users.find((u) => u.login === 'admin' || u.email === 'admin@ora.local')
  if (existing) {
    const updated = {
      ...existing,
      name: existing.name || 'Administrator',
      email: existing.email || 'admin@ora.local',
      login: 'admin',
      role: 'admin',
    }
    const index = users.findIndex((u) => u.id === existing.id)
    users[index] = updated
    writeUsers(users)
    return
  }

  users.push({
    id: randomUUID(),
    name: 'Administrator',
    login: 'admin',
    email: 'admin@ora.local',
    phone: '+70000000000',
    password: 'admin',
    role: 'admin',
    createdAt: new Date().toISOString(),
  })
  writeUsers(users)
}

const safeUser = (user) => {
  const { password: _pw, ...rest } = user
  return rest
}

const normalizeId = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const isPositiveInteger = (value) => /^\d+$/.test(String(value ?? '').trim())

const requireAdmin = (req, res) => {
  const actor = req.header('x-user-email') || req.body?.actorEmail
  if (!actor) {
    res.status(401).json({ ok: false, message: 'Unauthorized.' })
    return null
  }

  const users = readUsers()
  const user = users.find((u) => u.email === actor || u.login === actor)
  if (!user || user.role !== 'admin') {
    res.status(403).json({ ok: false, message: 'Admin access required.' })
    return null
  }

  return user
}

const requireUser = (req, res) => {
  const identity = String(req.header('x-user-email') || req.body?.userIdentity || '').trim()
  if (!identity) {
    res.status(401).json({ ok: false, message: 'Unauthorized.' })
    return null
  }

  const users = readUsers()
  const user = users.find((u) => u.email === identity || u.login === identity)
  if (!user) {
    res.status(401).json({ ok: false, message: 'User not found.' })
    return null
  }

  return user
}

ensureAdminUser()
ensureProductsFile()
ensureServicesFile()
ensureJsonObjectFile(ORDER_HISTORY_PATH)
ensureJsonObjectFile(SERVICE_BOOKINGS_PATH)

app.get('/api/health', (req, res) => {
  res.json({ ok: true })
})

app.post('/api/register', (req, res) => {
  const { name, email, phone, password } = req.body || {}
  if (!name || !email || !phone || !password) {
    return res.status(400).json({ ok: false, message: 'Missing fields.' })
  }

  const users = readUsers()
  const exists = users.some((u) => u.email === email)
  if (exists) {
    return res.status(409).json({ ok: false, message: 'Email already exists.' })
  }

  const user = {
    id: randomUUID(),
    name,
    email,
    phone,
    password,
    role: 'user',
    createdAt: new Date().toISOString(),
  }
  users.push(user)
  writeUsers(users)

  return res.json({ ok: true, user: safeUser(user) })
})

app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {}
  const identifier = String(email || '').trim()
  if (!identifier || !password) {
    return res.status(400).json({ ok: false, message: 'Missing fields.' })
  }

  const users = readUsers()
  const user = users.find(
    (u) => (u.email === identifier || u.login === identifier) && u.password === password,
  )
  if (!user) {
    return res.status(401).json({ ok: false, message: 'User not found.' })
  }

  return res.json({ ok: true, user: safeUser(user) })
})

app.put('/api/profile', (req, res) => {
  const { email, name, phone, password } = req.body || {}
  if (!email) {
    return res.status(400).json({ ok: false, message: 'Missing email.' })
  }

  const users = readUsers()
  const index = users.findIndex((u) => u.email === email)
  if (index === -1) {
    return res.status(404).json({ ok: false, message: 'User not found.' })
  }

  const updated = {
    ...users[index],
    name: name ?? users[index].name,
    phone: phone ?? users[index].phone,
  }
  if (password) {
    updated.password = password
  }

  users[index] = updated
  writeUsers(users)

  return res.json({ ok: true, user: safeUser(updated) })
})

app.get('/api/products', (req, res) => {
  res.json({ ok: true, items: readProducts() })
})

app.post('/api/products', (req, res) => {
  const admin = requireAdmin(req, res)
  if (!admin) return

  const { id, folder, title, category, price } = req.body || {}
  if (!title || !category || !price) {
    return res.status(400).json({ ok: false, message: 'Missing required fields.' })
  }
  if (!isPositiveInteger(price)) {
    return res.status(400).json({ ok: false, message: 'Price must be a positive number.' })
  }

  const products = readProducts()
  const baseId = normalizeId(id || title) || randomUUID().slice(0, 8)
  let finalId = baseId
  let seq = 2
  while (products.some((p) => p.id === finalId)) {
    finalId = `${baseId}-${seq}`
    seq += 1
  }

  const item = {
    id: finalId,
    folder: String(folder || '').trim(),
    title: String(title).trim(),
    category: String(category).trim(),
    price: `${Number.parseInt(String(price), 10)} ₽`,
  }

  products.push(item)
  writeProducts(products)
  res.json({ ok: true, item })
})

app.delete('/api/products/:id', (req, res) => {
  const admin = requireAdmin(req, res)
  if (!admin) return

  const { id } = req.params
  const products = readProducts()
  const next = products.filter((item) => item.id !== id)

  if (next.length === products.length) {
    return res.status(404).json({ ok: false, message: 'Product not found.' })
  }

  writeProducts(next)
  res.json({ ok: true })
})

app.get('/api/services', (req, res) => {
  res.json({ ok: true, items: readServices() })
})

app.post('/api/services', (req, res) => {
  const admin = requireAdmin(req, res)
  if (!admin) return

  const { id, title, description, details, price, duration } = req.body || {}
  if (!title || !description || !price || !duration) {
    return res.status(400).json({ ok: false, message: 'Missing required fields.' })
  }
  if (!isPositiveInteger(price)) {
    return res.status(400).json({ ok: false, message: 'Price must be a positive number.' })
  }
  if (!isPositiveInteger(duration)) {
    return res.status(400).json({ ok: false, message: 'Duration must be a positive number (minutes).' })
  }

  const services = readServices()
  const baseId = normalizeId(id || title) || randomUUID().slice(0, 8)
  let finalId = baseId
  let seq = 2
  while (services.some((s) => s.id === finalId)) {
    finalId = `${baseId}-${seq}`
    seq += 1
  }

  const item = {
    id: finalId,
    title: String(title).trim(),
    description: String(description).trim(),
    details: String(details || '').trim(),
    price: `${Number.parseInt(String(price), 10)} ₽`,
    duration: `${Number.parseInt(String(duration), 10)} мин`,
  }

  services.push(item)
  writeServices(services)
  res.json({ ok: true, item })
})

app.delete('/api/services/:id', (req, res) => {
  const admin = requireAdmin(req, res)
  if (!admin) return

  const { id } = req.params
  const services = readServices()
  const next = services.filter((item) => item.id !== id)

  if (next.length === services.length) {
    return res.status(404).json({ ok: false, message: 'Service not found.' })
  }

  writeServices(next)
  res.json({ ok: true })
})

app.get('/api/orders', (req, res) => {
  const user = requireUser(req, res)
  if (!user) return

  const key = user.email || user.login
  const historyByUser = readOrderHistoryByUser()
  const items = Array.isArray(historyByUser[key]) ? historyByUser[key] : []
  res.json({ ok: true, items })
})

app.post('/api/orders', (req, res) => {
  const user = requireUser(req, res)
  if (!user) return

  const rawOrder = req.body?.order
  if (!rawOrder || !Array.isArray(rawOrder.items) || rawOrder.items.length === 0) {
    return res.status(400).json({ ok: false, message: 'Invalid order payload.' })
  }

  const order = {
    id: rawOrder.id || `ord-${Date.now()}`,
    createdAt: rawOrder.createdAt || new Date().toISOString(),
    total: rawOrder.total || '',
    items: rawOrder.items.map((item) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      price: item.price,
      folder: item.folder || '',
      qty: item.qty || 1,
    })),
  }

  const key = user.email || user.login
  const historyByUser = readOrderHistoryByUser()
  const current = Array.isArray(historyByUser[key]) ? historyByUser[key] : []
  historyByUser[key] = [order, ...current]
  writeOrderHistoryByUser(historyByUser)

  res.json({ ok: true, order })
})

app.get('/api/bookings', (req, res) => {
  const user = requireUser(req, res)
  if (!user) return

  const key = user.email || user.login
  const bookingsByUser = readServiceBookingsByUser()
  const items = Array.isArray(bookingsByUser[key]) ? bookingsByUser[key] : []
  res.json({ ok: true, items })
})

app.post('/api/bookings', (req, res) => {
  const user = requireUser(req, res)
  if (!user) return

  const booking = req.body?.booking
  if (!booking || !booking.serviceId || !booking.appointmentDate || !booking.appointmentTime) {
    return res.status(400).json({ ok: false, message: 'Invalid booking payload.' })
  }

  const key = user.email || user.login
  const bookingsByUser = readServiceBookingsByUser()
  const current = Array.isArray(bookingsByUser[key]) ? bookingsByUser[key] : []
  const item = {
    id: booking.id || `rec_${Date.now().toString(36)}`,
    serviceId: booking.serviceId,
    serviceTitle: booking.serviceTitle || '',
    servicePrice: booking.servicePrice || '',
    serviceDuration: booking.serviceDuration || '',
    name: booking.name || user.name || '',
    phone: booking.phone || user.phone || '',
    comment: booking.comment || '',
    appointmentDate: booking.appointmentDate,
    appointmentTime: booking.appointmentTime,
    status: booking.status || 'active',
    createdAt: booking.createdAt || new Date().toISOString(),
  }
  bookingsByUser[key] = [item, ...current]
  writeServiceBookingsByUser(bookingsByUser)

  res.json({ ok: true, booking: item })
})

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API server running on http://localhost:${PORT}`)
})

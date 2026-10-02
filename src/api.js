import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'
const http = axios.create({ baseURL: BASE_URL })

http.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

http.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const authApi = {
  login:  (data) => http.post('/auth/login', data),
  logout: ()     => http.post('/auth/logout'),
  me:     ()     => http.get('/auth/me'),
}

export const dashApi = {
  get: () => http.get('/dashboard'),
}

export const profileApi = {
  me:   ()   => http.get('/student-profile/me'),
  get:  (id) => http.get(`/student-profile/${id}`),
}

export const recordsApi = {
  list:   (tableId)       => http.get(`/tables/${tableId}/records`),
  get:    (tableId, id)   => http.get(`/tables/${tableId}/records/${id}`),
  create: (tableId, data) => http.post(`/tables/${tableId}/records`, { data }),
}

export const tablesApi = {
  list: () => http.get('/tables'),
}

// ── New modules ───────────────────────────────────────────────────────────────

export const eventsApi = {
  list: ()        => http.get('/tables/events/records'),
  get:  (id)      => http.get(`/tables/events/records/${id}`),
  media:(id)      => http.get(`/tables/events/records/${id}/details/event_media`),
}

export const homeworkApi = {
  list: ()        => http.get('/tables/homework/records'),
  get:  (id)      => http.get(`/tables/homework/records/${id}`),
}

export const youtubeApi = {
  list: ()        => http.get('/tables/youtube_videos/records'),
}

export const remarksApi = {
  list:   ()      => http.get('/tables/remarks/records'),
  create: (data)  => http.post('/tables/remarks/records', { data }),
}

export const whatsappApi = {
  recipients:     (type)   => http.get('/whatsapp/recipients', { params: { type } }),
  templates:      ()       => http.get('/whatsapp/templates'),
  config:         ()       => http.get('/whatsapp/config'),
  send:           (data)   => http.post('/whatsapp/send-message', data),
  contactSchool:  (msg)    => http.post('/whatsapp/contact-school', { message: msg }),
  myLogs:         ()       => http.get('/whatsapp/my-logs'),
  received:       ()       => http.get('/whatsapp/received'),
}

export const busApi = {  myBus:          ()       => http.get('/bus-tracking/my-bus'),
  busLocation:    (busId)  => http.get(`/bus-tracking/buses/${busId}`),
  updateLocation: (data)   => http.post('/bus-tracking/location', data),
  stopSharing:    ()       => http.post('/bus-tracking/stop'),
}

export const chatApi = {  allowedUsers:  ()                  => http.get('/chat/allowed-users'),
  conversations: ()                  => http.get('/chat/conversations'),
  unread:        ()                  => http.get('/chat/unread'),
  getOrCreate:   (userId)            => http.get(`/chat/with/${userId}`),
  messages:      (convId, since)     => http.get(`/chat/conversations/${convId}/messages`, { params: since ? { since } : {} }),
  send:          (convId, message)   => http.post(`/chat/conversations/${convId}/messages`, { message }),
}

export default http

export const razorpayApi = {
  pendingFees:   (studentId) => http.get(`/razorpay/pending-fees/${studentId}`),
  createOrder:   (data)      => http.post('/razorpay/create-order', data),
  verifyPayment: (data)      => http.post('/razorpay/verify-payment', data),
}

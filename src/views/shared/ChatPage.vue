<template>
  <app-layout title="Messages" header-gradient="linear-gradient(135deg,#0f766e,#14b8a6)">
    <template #header-right>
      <button class="new-chat-btn" @click="openNewChatModal">✏️</button>
    </template>

    <div class="chat-layout">

      <!-- Conversation list -->
      <div v-if="!activeConv" class="conv-list">
        <div v-if="loadingConvs" class="center-loader"><div class="spinner"></div></div>

        <div v-else-if="!conversations.length" class="empty-state">
          <div class="empty-icon">💬</div>
          <div class="empty-text">No conversations yet</div>
          <button class="start-btn" @click="openNewChatModal">Start a Chat</button>
        </div>

        <div v-for="conv in conversations" :key="conv.id" class="conv-item" @click="openConversation(conv)">
          <div class="conv-avatar">{{ initials(conv.other_user?.name) }}</div>
          <div class="conv-info">
            <div class="conv-name">{{ conv.other_user?.name }}</div>
            <div class="conv-role">{{ conv.other_user?.role }}</div>
            <div class="conv-preview">{{ conv.last_message || 'No messages yet' }}</div>
          </div>
          <div class="conv-right">
            <div class="conv-time">{{ formatTime(conv.last_message_at) }}</div>
            <span v-if="conv.unread_count > 0" class="badge">{{ conv.unread_count }}</span>
          </div>
        </div>
      </div>

      <!-- Active conversation -->
      <div v-else class="chat-view">
        <div class="chat-topbar">
          <button class="back-btn" @click="activeConv = null">← Back</button>
          <div class="chat-topbar-info">
            <div class="conv-avatar small">{{ initials(activeConv.other_user?.name) }}</div>
            <div>
              <div class="chat-name">{{ activeConv.other_user?.name }}</div>
              <div class="chat-role">{{ activeConv.other_user?.role }}</div>
            </div>
          </div>
        </div>

        <div class="messages-area" ref="messagesEl">
          <div v-if="loadingMsgs" class="center-loader"><div class="spinner"></div></div>
          <template v-else>
            <div v-for="msg in messages" :key="msg.id"
              class="message" :class="msg.sender_id === myId ? 'mine' : 'theirs'">
              <div class="bubble">{{ msg.message }}</div>
              <div class="msg-time">{{ formatTime(msg.created_at) }}</div>
            </div>
          </template>
        </div>

        <div class="input-bar">
          <input v-model="newMessage" placeholder="Type a message…" @keyup.enter="sendMessage" />
          <button class="send-btn" :disabled="!newMessage.trim() || sending" @click="sendMessage">➤</button>
        </div>
      </div>

    </div>

    <!-- New chat modal -->
    <div v-if="showNewChat" class="modal-overlay" @click.self="showNewChat = false">
      <div class="modal-sheet">
        <div class="modal-handle"></div>
        <div class="modal-title">New Chat</div>
        <div v-if="loadingUsers" class="center-loader"><div class="spinner"></div></div>
        <div v-else-if="!allowedUsers.length" class="empty-state">
          <div class="empty-text">No users available</div>
        </div>
        <div v-for="u in allowedUsers" :key="u.id" class="user-item" @click="startChat(u)">
          <div class="conv-avatar">{{ initials(u.name) }}</div>
          <div>
            <div class="conv-name">{{ u.name }}</div>
            <div class="conv-role">{{ u.role }}</div>
          </div>
        </div>
        <button class="close-btn" @click="showNewChat = false">Cancel</button>
      </div>
    </div>

  </app-layout>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import AppLayout from '../../components/AppLayout.vue'
import { chatApi } from '../../api'
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()
const myId = auth.user?.id

const conversations = ref([])
const activeConv    = ref(null)
const messages      = ref([])
const newMessage    = ref('')
const allowedUsers  = ref([])
const showNewChat   = ref(false)
const loadingConvs  = ref(false)
const loadingMsgs   = ref(false)
const loadingUsers  = ref(false)
const sending       = ref(false)
const messagesEl    = ref(null)
let pollTimer       = null
let lastMsgId       = null

onMounted(async () => {
  await loadConversations()
  pollTimer = setInterval(poll, 4000)
})
onUnmounted(() => clearInterval(pollTimer))

async function loadConversations() {
  loadingConvs.value = true
  try { conversations.value = (await chatApi.conversations()).data }
  catch { /* */ } finally { loadingConvs.value = false }
}

async function openConversation(conv) {
  activeConv.value  = conv
  messages.value    = []
  lastMsgId         = null
  loadingMsgs.value = true
  try {
    messages.value = (await chatApi.messages(conv.id)).data
    lastMsgId = messages.value.at(-1)?.id ?? null
    conv.unread_count = 0
    await scrollBottom()
  } catch { /* */ } finally { loadingMsgs.value = false }
}

async function sendMessage() {
  if (!newMessage.value.trim() || !activeConv.value || sending.value) return
  sending.value = true
  try {
    const res = await chatApi.send(activeConv.value.id, newMessage.value.trim())
    messages.value.push(res.data)
    lastMsgId = res.data.id
    newMessage.value = ''
    const c = conversations.value.find(c => c.id === activeConv.value.id)
    if (c) c.last_message = res.data.message
    await scrollBottom()
  } catch { /* */ } finally { sending.value = false }
}

async function poll() {
  const res = await chatApi.conversations().catch(() => null)
  if (res) conversations.value = res.data
  if (activeConv.value) {
    const msgRes = await chatApi.messages(activeConv.value.id, lastMsgId).catch(() => null)
    if (msgRes?.data?.length) {
      messages.value.push(...msgRes.data)
      lastMsgId = messages.value.at(-1)?.id
      await scrollBottom()
    }
  }
}

async function openNewChatModal() {
  showNewChat.value  = true
  loadingUsers.value = true
  try { allowedUsers.value = (await chatApi.allowedUsers()).data }
  catch { /* */ } finally { loadingUsers.value = false }
}

async function startChat(user) {
  showNewChat.value = false
  try {
    const res  = await chatApi.getOrCreate(user.id)
    const conv = res.data
    if (!conv.other_user) conv.other_user = { id: user.id, name: user.name, role: user.role }
    const existing = conversations.value.find(c => c.id === conv.id)
    if (!existing) conversations.value.unshift(conv)
    await openConversation(existing || conv)
  } catch (e) {
    alert(e?.response?.data?.message || 'Could not start chat.')
  }
}

async function scrollBottom() {
  await nextTick()
  if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
}

function initials(name) {
  return (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function formatTime(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.chat-layout { display:flex;flex-direction:column;height:calc(100vh - 80px) }
.new-chat-btn { background:rgba(255,255,255,.2);border:none;border-radius:50%;width:36px;height:36px;font-size:16px;cursor:pointer;color:#fff }

.center-loader { display:flex;justify-content:center;padding:60px }
.spinner { width:36px;height:36px;border:3px solid #e2e8f0;border-top-color:#14b8a6;border-radius:50%;animation:spin 1s linear infinite }
@keyframes spin { to { transform:rotate(360deg) } }

/* Conv list */
.conv-list { flex:1;overflow-y:auto }
.empty-state { text-align:center;padding:60px 20px }
.empty-icon  { font-size:48px;margin-bottom:12px }
.empty-text  { color:#94a3b8;font-size:15px;margin-bottom:16px }
.start-btn   { padding:12px 28px;background:#14b8a6;color:#fff;border:none;border-radius:14px;font-size:14px;font-weight:700;cursor:pointer }

.conv-item { display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid #f1f5f9;cursor:pointer }
.conv-item:active { background:#f0fdfa }
.conv-avatar { width:44px;height:44px;border-radius:50%;background:#14b8a6;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;flex-shrink:0 }
.conv-avatar.small { width:36px;height:36px;font-size:13px }
.conv-info { flex:1;min-width:0 }
.conv-name    { font-size:15px;font-weight:700;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis }
.conv-role    { font-size:11px;color:#64748b;text-transform:capitalize;margin-bottom:2px }
.conv-preview { font-size:13px;color:#94a3b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis }
.conv-right   { display:flex;flex-direction:column;align-items:flex-end;gap:6px }
.conv-time    { font-size:11px;color:#94a3b8 }
.badge { background:#ef4444;color:#fff;border-radius:999px;padding:2px 7px;font-size:11px;font-weight:700 }

/* Chat view */
.chat-view { display:flex;flex-direction:column;flex:1;overflow:hidden }
.chat-topbar { display:flex;align-items:center;gap:12px;padding:12px 16px;background:#fff;border-bottom:1px solid #e2e8f0 }
.back-btn { background:none;border:none;font-size:15px;color:#14b8a6;font-weight:700;cursor:pointer;padding:0 }
.chat-topbar-info { display:flex;align-items:center;gap:10px }
.chat-name { font-size:15px;font-weight:700;color:#1e293b }
.chat-role { font-size:11px;color:#64748b;text-transform:capitalize }

.messages-area { flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:8px;background:#f0fdfa }
.message { display:flex;flex-direction:column;max-width:72% }
.message.mine   { align-self:flex-end;align-items:flex-end }
.message.theirs { align-self:flex-start;align-items:flex-start }
.bubble { padding:10px 14px;border-radius:18px;font-size:14px;line-height:1.4;word-break:break-word }
.mine .bubble   { background:#14b8a6;color:#fff;border-bottom-right-radius:4px }
.theirs .bubble { background:#fff;color:#1e293b;border:1px solid #e2e8f0;border-bottom-left-radius:4px }
.msg-time { font-size:10px;color:#94a3b8;margin-top:2px }

.input-bar { display:flex;gap:8px;padding:12px 16px;background:#fff;border-top:1px solid #e2e8f0 }
.input-bar input { flex:1;padding:12px 16px;border:1.5px solid #e2e8f0;border-radius:24px;font-size:14px;outline:none }
.input-bar input:focus { border-color:#14b8a6 }
.send-btn { width:44px;height:44px;border-radius:50%;background:#14b8a6;color:#fff;border:none;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center }
.send-btn:disabled { opacity:.5 }

/* Modal */
.modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:200;display:flex;align-items:flex-end }
.modal-sheet { background:#fff;border-radius:24px 24px 0 0;padding:16px 20px 40px;width:100%;max-height:80vh;overflow-y:auto }
.modal-handle { width:40px;height:4px;background:#e2e8f0;border-radius:4px;margin:0 auto 14px }
.modal-title { font-size:17px;font-weight:700;color:#1e293b;margin-bottom:14px }
.user-item { display:flex;align-items:center;gap:12px;padding:12px;border-radius:12px;cursor:pointer;border:1px solid #e2e8f0;margin-bottom:8px }
.user-item:active { background:#f0fdfa }
.close-btn { width:100%;padding:14px;background:#64748b;color:#fff;border:none;border-radius:14px;font-size:15px;font-weight:700;cursor:pointer;margin-top:8px }
</style>

import axios from 'axios'
import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
const api = axios.create({
  baseURL: API_URL,
  headers: { Accept: 'application/json' },
})

const tokenKey = 'blog_token'
const userKey = 'blog_user'

const getStoredToken = () => localStorage.getItem(tokenKey)
const getStoredUser = () => {
  const raw = localStorage.getItem(userKey)
  return raw ? JSON.parse(raw) : null
}

const saveToken = (token) => {
  if (token) {
    localStorage.setItem(tokenKey, token)
    api.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    localStorage.removeItem(tokenKey)
    delete api.defaults.headers.common.Authorization
  }
}

const saveUser = (user) => {
  if (user) {
    localStorage.setItem(userKey, JSON.stringify(user))
  } else {
    localStorage.removeItem(userKey)
  }
}

function App() {
  const [user, setUser] = useState(getStoredUser())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getStoredToken()
    if (!token) {
      setLoading(false)
      return
    }

    saveToken(token)
    api
      .get('/auth/me')
      .then((response) => {
        const currentUser = response.data.user
        setUser(currentUser)
        saveUser(currentUser)
      })
      .catch(() => {
        setUser(null)
        saveUser(null)
        saveToken(null)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-700">Loading...</div>
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={setUser} />} />
        <Route path="/register" element={<RegisterPage onLogin={setUser} />} />
        <Route
          path="/blog"
          element={
            <ProtectedRoute user={user}>
              <BlogPage user={user} setUser={setUser} />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to={user ? '/blog' : '/login'} replace />} />
        <Route path="*" element={<Navigate to={user ? '/blog' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  )
}

function ProtectedRoute({ user, children }) {
  if (!user) return <Navigate to="/login" replace />
  return children
}

function RegisterPage({ onLogin }) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await api.post('/auth/register', {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      })

      const { token, user } = response.data
      saveToken(token)
      saveUser(user)
      onLogin(user)
      navigate('/blog')
    } catch (err) {
      const backendErrors = err.response?.data?.errors
      const message = backendErrors
        ? Object.values(backendErrors).flat().join(' ')
        : err.response?.data?.message || 'Registration failed.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
        <p className="text-center text-sm font-semibold uppercase tracking-[0.25em] text-indigo-600">Blog App</p>
        <h1 className="mt-3 text-center text-3xl font-bold text-slate-900">Create account</h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Full name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Confirm password</label>
            <input
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <button type="button" onClick={() => navigate('/login')} className="font-semibold text-indigo-600 hover:text-indigo-500">
            Login
          </button>
        </div>
      </div>
    </div>
  )
}

function LoginPage({ onLogin }) {
  const navigate = useNavigate()
  const demoAccounts = {
    admin: { email: 'admin@example.com', password: 'Admin123!' },
    user: { email: 'user@example.com', password: 'User123!' },
  }

  const [role, setRole] = useState('admin')
  const [email, setEmail] = useState(demoAccounts.admin.email)
  const [password, setPassword] = useState(demoAccounts.admin.password)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const selected = demoAccounts[role]
    setEmail(selected.email)
    setPassword(selected.password)
  }, [role])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await api.post('/auth/login', { email, password })
      const { token, user } = response.data
      saveToken(token)
      saveUser(user)
      onLogin(user)
      navigate('/blog')
    } catch (err) {
      setError(err.response?.data?.message || 'The provided credentials are incorrect.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
        <p className="text-center text-sm font-semibold uppercase tracking-[0.25em] text-indigo-600">Blog App</p>
        <h1 className="mt-3 text-center text-3xl font-bold text-slate-900">Login</h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Select role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
            >
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Please wait...' : `Login as ${role === 'admin' ? 'Admin' : 'User'}`}
          </button>
        </form>

        <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-700">Demo accounts</p>
          <p>Admin: admin@example.com / Admin123!</p>
          <p>User: user@example.com / User123!</p>
        </div>

        <div className="mt-4 text-center text-sm text-slate-600">
          New here?{' '}
          <button type="button" onClick={() => navigate('/register')} className="font-semibold text-indigo-600 hover:text-indigo-500">
            Create an account
          </button>
        </div>
      </div>
    </div>
  )
}

function BlogPage({ user, setUser }) {
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [categories, setCategories] = useState([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const [postsResponse, categoriesResponse] = await Promise.all([
        api.get('/posts'),
        api.get('/categories'),
      ])

      setPosts(postsResponse.data)
      setCategories(categoriesResponse.data)

      if (categoriesResponse.data.length > 0 && !categoryId) {
        setCategoryId(String(categoriesResponse.data[0].id))
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.error(error)
    } finally {
      saveToken(null)
      saveUser(null)
      setUser(null)
      navigate('/login')
    }
  }

  const handleCreate = async (event) => {
    event.preventDefault()

    if (!title.trim() || !content.trim()) return

    try {
      await api.post('/posts', {
        title,
        content,
        category_id: Number(categoryId),
      })
      setTitle('')
      setContent('')
      loadData()
    } catch (error) {
      console.error(error)
    }
  }

  const handleDelete = async (postId) => {
    const confirmDelete = window.confirm('Delete this post?')
    if (!confirmDelete) return

    try {
      await api.delete(`/posts/${postId}`)
      loadData()
    } catch (error) {
      console.error(error)
    }
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-700">Loading posts...</div>
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <header className="bg-white shadow-sm ring-1 ring-slate-200">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Simple Blog</h1>
            <p className="text-sm text-slate-500">Welcome, {user?.name}</p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-4">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Blog posts</h2>
            </div>

            {posts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-slate-600">
                No posts yet.
              </div>
            ) : (
              posts.map((post) => {
                const canDelete = user?.id === post.user_id || user?.roles?.includes('admin')

                return (
                  <article key={post.id} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">{post.category?.name}</p>
                        <h3 className="mt-2 text-2xl font-bold text-slate-900">{post.title}</h3>
                        <p className="mt-1 text-sm text-slate-500">By {post.user?.name}</p>
                      </div>

                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDelete(post.id)}
                          className="rounded-md border border-red-200 px-2.5 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      )}
                    </div>

                    <p className="mt-4 whitespace-pre-line text-slate-700">{post.content}</p>
                  </article>
                )
              })
            )}
          </section>

          <aside className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-bold text-slate-900">Create post</h2>

            <form onSubmit={handleCreate} className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                  placeholder="Post title"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Post</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows="6"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                  placeholder="Write something..."
                />
              </div>

              <button type="submit" className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-500">
                Publish post
              </button>
            </form>
          </aside>
        </div>
      </main>
    </div>
  )
}

export default App

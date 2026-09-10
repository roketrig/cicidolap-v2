// src/pages/Register.jsx
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth } from '../firebase'
import { authErrorMessage } from '../utils'

function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (name.trim().length < 2) {
      setError('Lütfen adını yaz (en az 2 karakter).')
      return
    }
    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor!')
      return
    }
    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır!')
      return
    }

    setLoading(true)

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(cred.user, { displayName: name.trim() })
      // Profil adının uygulama genelinde görünmesi için tam yenileme yap
      // (onAuthStateChanged zaten adsız kullanıcıyla tetiklenmişti).
      window.location.replace('/')
    } catch (err) {
      console.error('Kayıt hatası:', err)
      setError(authErrorMessage(err))
      setLoading(false)
    }
  }

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="card shadow-lg p-4" style={{ maxWidth: '400px', width: '100%' }}>
        <h2 className="text-center fw-bold text-pink-600 mb-4">👗 Kayıt Ol</h2>

        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
            <button type="button" className="btn-close" onClick={() => setError('')}></button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Adın</label>
            <input
              type="text"
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Ayşe"
              autoComplete="given-name"
              required
            />
            <small className="text-muted">İlanlarında ve mesajlarda bu isim görünür.</small>
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">E-posta</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Şifre</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength="6"
            />
            <small className="text-muted">En az 6 karakter olmalıdır.</small>
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Şifreyi Tekrarla</label>
            <input
              type="password"
              className="form-control"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-pink w-100 py-2 rounded-pill"
            disabled={loading}
          >
            {loading ? 'Kaydediliyor...' : 'Kayıt Ol'}
          </button>
        </form>

        <p className="text-center text-muted mt-3">
          Zaten hesabın var mı? <Link to="/login" className="text-pink-600 fw-bold">Giriş Yap</Link>
        </p>
      </div>
    </div>
  )
}

export default Register

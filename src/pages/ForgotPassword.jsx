// src/pages/ForgotPassword.jsx
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../firebase'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      await sendPasswordResetEmail(auth, email)
      setSuccess('✅ Sıfırlama linki e-postana gönderildi! Gelen kutunu (ve spam klasörünü) kontrol et.')
    } catch (err) {
      // Firebase, güvenlik gereği "bu e-posta kayıtlı değil" gibi bir bilgi
      // vermez; hatayı olduğu gibi gösteriyoruz.
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="card shadow-lg p-4" style={{ maxWidth: '400px', width: '100%' }}>
        <h2 className="text-center fw-bold text-pink-600 mb-2">🔑 Şifremi Unuttum</h2>
        <p className="text-muted text-center small mb-4">
          Kayıtlı e-posta adresini gir, sana bir şifre sıfırlama linki gönderelim.
        </p>

        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
            <button type="button" className="btn-close" onClick={() => setError('')}></button>
          </div>
        )}

        {success && (
          <div className="alert alert-success alert-dismissible fade show" role="alert">
            {success}
            <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold">E-posta</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-pink w-100 py-2 rounded-pill"
            disabled={loading}
          >
            {loading ? 'Gönderiliyor...' : 'Sıfırlama Linki Gönder'}
          </button>
        </form>

        <p className="text-center text-muted mt-3">
          <Link to="/login" className="text-pink-600 fw-bold">← Girişe dön</Link>
        </p>
      </div>
    </div>
  )
}

export default ForgotPassword

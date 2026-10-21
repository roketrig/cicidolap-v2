// src/components/ReportModal.jsx
//
// İlan / kullanıcı / konuşma şikayeti. Mağaza politikaları (Play UGC, App
// Store 1.2) gereği her kullanıcı üretimi içeriğin yanında bulunuyor.
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { REPORT_REASONS, submitReport } from '../safety'

export default function ReportModal({ open, onClose, user, type, targetId, targetOwnerId, title, evidence }) {
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  const close = () => {
    setReason('')
    setDetails('')
    setDone(false)
    setError('')
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!reason) {
      setError('Lütfen bir sebep seç.')
      return
    }
    setSending(true)
    setError('')
    try {
      await submitReport({ reporter: user, type, targetId, targetOwnerId, reason, details, evidence })
      setDone(true)
    } catch (err) {
      console.error('Şikayet gönderilemedi:', err)
      setError('Şikayet gönderilemedi. Lütfen tekrar dene.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="cd-modal-backdrop" onClick={close} role="presentation">
      <div
        className="cd-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Şikayet et'}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="d-flex justify-content-between align-items-start mb-3">
          <h2 className="h5 fw-bold mb-0">🚩 {title || 'Şikayet et'}</h2>
          <button type="button" className="btn-close" onClick={close} aria-label="Kapat"></button>
        </div>

        {!user ? (
          <>
            <p className="text-muted">Şikayet göndermek için giriş yapmalısın.</p>
            <Link to="/login" className="btn btn-pink rounded-pill px-4" onClick={close}>Giriş Yap</Link>
          </>
        ) : done ? (
          <>
            <div className="alert alert-success">
              ✅ Şikayetin bize ulaştı. Ekibimiz inceleyip gerekli işlemi yapacak. Teşekkürler!
            </div>
            <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={close}>
              Kapat
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="d-flex flex-column gap-2 mb-3">
              {REPORT_REASONS.map((r) => (
                <label key={r.id} className={`contact-pref-option ${reason === r.id ? 'is-active' : ''}`}>
                  <input
                    type="radio"
                    name="reportReason"
                    value={r.id}
                    checked={reason === r.id}
                    onChange={() => setReason(r.id)}
                  />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>
            <textarea
              className="form-control mb-3"
              rows="3"
              maxLength={1000}
              placeholder="Eklemek istediğin bir detay var mı? (isteğe bağlı)"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
            {error && <div className="alert alert-danger py-2 small">{error}</div>}
            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-pink rounded-pill px-4" disabled={sending}>
                {sending ? 'Gönderiliyor...' : 'Şikayeti Gönder'}
              </button>
              <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={close}>
                Vazgeç
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

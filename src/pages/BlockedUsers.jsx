// src/pages/BlockedUsers.jsx
//
// Engellenen kullanıcılar listesi + engeli kaldırma.
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSafety } from '../context/SafetyContext'

function BlockedUsers({ user }) {
  const { blocked, unblock } = useSafety()
  const [busyId, setBusyId] = useState(null)

  if (!user) {
    return (
      <div className="container text-center py-5">
        <div className="display-1 mb-3">🔒</div>
        <h2>Giriş Yapmalısın</h2>
        <Link to="/login" className="btn btn-pink rounded-pill px-4 mt-2">Giriş Yap</Link>
      </div>
    )
  }

  const handleUnblock = async (id) => {
    setBusyId(id)
    try {
      await unblock(id)
    } catch (err) {
      console.error('Engel kaldırılamadı:', err)
      alert('Engel kaldırılamadı. Lütfen tekrar dene.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="container py-4" style={{ maxWidth: '640px' }}>
      <h1 className="fw-bold text-pink-600 mb-1">Engellediklerim</h1>
      <p className="text-muted">
        Engellediğin kişilerin ilanları sana gösterilmez ve sana mesaj gönderemezler.
      </p>

      {blocked.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <div className="display-4 mb-2">🙂</div>
          Kimseyi engellemedin.
        </div>
      ) : (
        <ul className="list-group shadow-sm">
          {blocked.map((b) => (
            <li key={b.blockedId} className="list-group-item d-flex justify-content-between align-items-center">
              <span className="fw-semibold">{b.blockedName || 'Kullanıcı'}</span>
              <button
                className="btn btn-outline-secondary btn-sm rounded-pill"
                disabled={busyId === b.blockedId}
                onClick={() => handleUnblock(b.blockedId)}
              >
                Engeli kaldır
              </button>
            </li>
          ))}
        </ul>
      )}

      <Link to="/profile" className="btn btn-outline-secondary rounded-pill px-4 mt-4">← Profilim</Link>
    </div>
  )
}

export default BlockedUsers

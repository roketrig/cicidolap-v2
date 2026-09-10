// src/pages/NotFound.jsx
import React from 'react'
import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div className="container text-center py-5">
      <div className="display-1 mb-3">🧸💭</div>
      <h1 className="fw-bold text-pink-600">404</h1>
      <h3 className="mb-3">Bu sayfa dolapta yok</h3>
      <p className="text-muted">Aradığın sayfa taşınmış ya da hiç var olmamış olabilir.</p>
      <Link to="/" className="btn btn-pink rounded-pill px-4 mt-2">🏠 Ana Sayfaya Dön</Link>
    </div>
  )
}

export default NotFound

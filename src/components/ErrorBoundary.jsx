// src/components/ErrorBoundary.jsx
//
// Bir sayfada beklenmeyen bir JS hatası olursa tüm uygulama beyaz ekrana
// düşmesin diye. Hatayı yakalar, kullanıcıya anlaşılır bir ekran gösterir.
import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('Yakalanan hata:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container text-center py-5">
          <div className="display-1 mb-3">🧸💔</div>
          <h2 className="fw-bold">Bir şeyler ters gitti</h2>
          <p className="text-muted">Sayfayı yenilemeyi dene. Sorun sürerse biraz sonra tekrar gel.</p>
          <button
            className="btn btn-pink rounded-pill px-4 mt-2"
            onClick={() => window.location.assign('/')}
          >
            Ana Sayfaya Dön
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary

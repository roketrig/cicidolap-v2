// src/pages/DeleteAccount.jsx
//
// Google Play, hesap açılabilen uygulamalardan hem UYGULAMA İÇİNDEN hem de
// UYGULAMAYI YÜKLEMEDEN/GİRİŞ YAPMADAN erişilebilen bir hesap silme yolu
// bekliyor (bkz. android/RELEASE.md madde 3). Bu sayfa ikisini de karşılıyor:
// giriş yapmışsa doğrudan silme formu, yapmamışsa giriş linki + destek
// e-postasıyla talep bırakma açıklaması gösteriyor. URL sabit ve halka
// açık: /hesap-sil — Play Console'a bu link girilecek.
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { auth } from '../firebase'
import { deleteMyAccount } from '../account'
import { authErrorMessage } from '../utils'

function DeleteAccount({ user }) {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState('form') // 'form' | 'done'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!confirmed) {
      setError('Devam etmek için kutucuğu işaretlemelisin.')
      return
    }
    setLoading(true)
    try {
      await deleteMyAccount(auth.currentUser, password)
      setStep('done')
      setTimeout(() => navigate('/'), 4000)
    } catch (err) {
      console.error('Hesap silme hatası:', err)
      setError(authErrorMessage(err))
      setLoading(false)
    }
  }

  if (step === 'done') {
    return (
      <div className="container text-center py-5">
        <div className="display-1 mb-3">👋</div>
        <h2>Hesabın silindi</h2>
        <p className="text-muted">
          İlanların, favorilerin ve hesabın kalıcı olarak silindi. Seni
          ağırladığımız için teşekkürler.
        </p>
        <Link to="/" className="btn btn-pink rounded-pill px-4 mt-2">Ana Sayfaya Dön</Link>
      </div>
    )
  }

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-6">
          <div className="card shadow-lg border-0 rounded-4 p-4">
            <h1 className="fw-bold text-pink-600 mb-1">Hesabımı Sil</h1>
            <p className="text-muted">
              Bu sayfa Google Play politikaları gereği, uygulamayı
              yüklemeden ya da giriş yapmadan da açılabiliyor.
            </p>

            {!user ? (
              <>
                <div className="alert alert-secondary">
                  Hesabını silmek için önce <strong>giriş yapmalısın</strong> —
                  bu, hesabın gerçekten sana ait olduğunu doğrulamak için gerekli.
                </div>
                <Link to="/login" className="btn btn-pink rounded-pill px-4 mb-3">
                  Giriş Yap ve Devam Et
                </Link>
                <hr />
                <h2 className="h6 fw-bold">Giriş yapamıyorsan</h2>
                <p className="text-muted small mb-0">
                  Şifreni unuttuysan <Link to="/forgot-password">şifreni sıfırlayabilirsin</Link>.
                  Hesabına hiç erişemiyorsan, hesabınla ilişkili e-posta
                  adresinden <strong>info@cicidolap.com.tr</strong> adresine
                  yazarak silme talebinde bulunabilirsin — kimliğini
                  doğruladıktan sonra en geç 7 iş günü içinde hesabın ve
                  verilerin elle silinir.
                </p>
              </>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="alert alert-danger">
                  <strong>⚠️ Bu işlem geri alınamaz.</strong>
                  <ul className="mb-0 mt-2 small">
                    <li>Tüm ilanların (fotoğrafları dahil) kalıcı olarak silinir</li>
                    <li>Favorilerin silinir</li>
                    <li>Hesabına (<strong>{user.email}</strong>) bir daha giriş yapamazsın</li>
                    <li>Mevcut konuşma geçmişin, karşı taraftaki kopyasıyla birlikte
                      kalır (bkz. <Link to="/gizlilik">Gizlilik Politikası</Link>) — mesaj
                      içeriğini kendin silemezsin, bunun için bize yazabilirsin.</li>
                  </ul>
                </div>

                {error && (
                  <div className="alert alert-warning alert-dismissible fade show">
                    {error}
                    <button type="button" className="btn-close" onClick={() => setError('')}></button>
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label fw-semibold">Şifreni doğrula</label>
                  <input
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>

                <div className="form-check mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="confirmDelete"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                  />
                  <label className="form-check-label small" htmlFor="confirmDelete">
                    Anladım, hesabım ve tüm ilanlarım kalıcı olarak silinecek.
                  </label>
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-danger rounded-pill px-4"
                    disabled={loading}
                  >
                    {loading ? 'Siliniyor...' : '🗑️ Hesabımı Kalıcı Olarak Sil'}
                  </button>
                  <Link to="/profile" className="btn btn-outline-secondary rounded-pill px-4">
                    Vazgeç
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeleteAccount

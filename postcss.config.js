// Proje artık Tailwind kullanmıyor (bkz. src/tailwind.css ve
// package.json'daki not) — stiller Bootstrap + src/index.css'teki özel
// sınıflarla sağlanıyor. postcss'i sadece tarayıcı önekleri (autoprefixer)
// için kullanıyoruz; "tailwindcss" ve "@tailwindcss/postcss" farklı büyük
// sürümlerdeydi (v3 / v4) ve zaten hiç import edilmeyen bir CSS dosyasını
// işliyordu.
export default {
  plugins: {
    autoprefixer: {}
  }
}

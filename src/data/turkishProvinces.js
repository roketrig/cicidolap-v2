// src/data/turkishProvinces.js
//
// Türkiye'nin 81 ilinin alfabetik listesi. İlçe/mahalle seviyesinde tam ve
// güncel bir veri seti (900'den fazla ilçe) internetten hatasız şekilde bu
// dosyaya taşınamayacağı için (küçük yazım hataları / eksik ilçe riski),
// bilinçli olarak sadece il seviyesinde sabit bir liste kullanıyoruz.
// İlçe/semt bilgisi kullanıcıdan serbest metin olarak alınmaya devam ediyor
// (bkz. AddProduct.jsx, EditProduct.jsx) — arama/filtreleme il bazında
// çalışıyor, bu çoğu ikinci el pazar yerinde zaten yeterli bir granülerlik.
export const TURKISH_PROVINCES = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Aksaray', 'Amasya',
  'Ankara', 'Antalya', 'Ardahan', 'Artvin', 'Aydın', 'Balıkesir', 'Bartın',
  'Batman', 'Bayburt', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur',
  'Bursa', 'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır',
  'Düzce', 'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir',
  'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari', 'Hatay', 'Iğdır',
  'Isparta', 'İstanbul', 'İzmir', 'Kahramanmaraş', 'Karabük', 'Karaman',
  'Kars', 'Kastamonu', 'Kayseri', 'Kilis', 'Kırıkkale', 'Kırklareli',
  'Kırşehir', 'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Mardin',
  'Mersin', 'Muğla', 'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Osmaniye', 'Rize',
  'Sakarya', 'Samsun', 'Siirt', 'Sinop', 'Sivas', 'Şanlıurfa', 'Şırnak',
  'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Uşak', 'Van', 'Yalova',
  'Yozgat', 'Zonguldak'
]

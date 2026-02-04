import { useState } from 'react'

interface Restaurant {
  name: string;
  address: string;
  rating: number;
  ratingCount: number;
  googleMapsUrl: string;
}

// ジャンルの選択肢（表示名とAPI値のマッピング）
const GENRE_OPTIONS = [
  { label: 'レストラン', value: 'restaurant' },
  { label: 'ラーメン', value: 'ramen_restaurant' },
  { label: 'カフェ', value: 'cafe' },
  { label: '居酒屋', value: 'izakaya' },
  { label: '寿司', value: 'sushi_restaurant' },
  { label: '焼肉', value: 'yakiniku_restaurant' },
  { label: 'イタリアン', value: 'italian_restaurant' },
  { label: '中華', value: 'chinese_restaurant' },
  { label: 'ファストフード', value: 'fast_food_restaurant' },
];

function App() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 検索条件の状態管理
  const [radius, setRadius] = useState(1000);
  const [minRating, setMinRating] = useState(3.5);
  const [genre, setGenre] = useState('restaurant');
  const [openNow, setOpenNow] = useState(true);
  const [count, setCount] = useState(1);

  // 検索場所の状態管理
  const [searchMode, setSearchMode] = useState<'current' | 'manual'>('current');
  const [manualAddress, setManualAddress] = useState('');

  const fetchRandomRestaurant = async () => {
    setLoading(true);
    setError(null);
    setRestaurants([]);

    try {
      let latitude: number;
      let longitude: number;

      // 検索モードによって緯度経度の取得方法を分岐
      if (searchMode === 'current') {
        // Case A: 現在地から取得
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } else {
        // Case B: エリア指定（Geocoding APIを使用）
        if (!manualAddress.trim()) {
          throw new Error('地名または住所を入力してください');
        }

        const baseUrl = import.meta.env.VITE_API_URL || 'https://localhost:5001';
        const geocodeParams = new URLSearchParams({
          address: manualAddress,
        });

        const geocodeResponse = await fetch(`${baseUrl}/api/geocoding?${geocodeParams}`);
        
        if (!geocodeResponse.ok) {
          const errorData = await geocodeResponse.json().catch(() => null);
          throw new Error(errorData?.message || '指定された場所が見つかりませんでした');
        }

        const locationData = await geocodeResponse.json();
        latitude = locationData.latitude;
        longitude = locationData.longitude;
      }

      // 取得した緯度経度で飲食店を検索
      const baseUrl = import.meta.env.VITE_API_URL || 'https://localhost:5001';
      const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        radius: radius.toString(),
        minRating: minRating.toString(),
        genre: genre,
        openNow: openNow.toString(),
        count: count.toString(),
      });

      const response = await fetch(`${baseUrl}/api/restaurant/random?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'APIからの取得に失敗しました');
      }
      
      const data = await response.json();
      setRestaurants(data);
    } catch (err) {
      if (err instanceof GeolocationPositionError) {
        setError('位置情報の取得を許可してください');
      } else {
        setError(err instanceof Error ? err.message : 'お店が見つからなかったか、通信エラーです');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f5f5f5', 
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', color: '#333', marginBottom: '30px' }}>
          🍴 近くの店ガチャ
        </h1>

        {/* 検索条件設定エリア */}
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '24px'
        }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', color: '#555' }}>
            検索条件
          </h2>

          {/* 検索場所モード選択 */}
          <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
            <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', color: '#666' }}>
              検索場所
            </label>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="searchMode"
                  value="current"
                  checked={searchMode === 'current'}
                  onChange={(e) => setSearchMode(e.target.value as 'current' | 'manual')}
                  style={{ marginRight: '6px', cursor: 'pointer' }}
                />
                <span style={{ color: '#555' }}>📍 現在地</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="searchMode"
                  value="manual"
                  checked={searchMode === 'manual'}
                  onChange={(e) => setSearchMode(e.target.value as 'current' | 'manual')}
                  style={{ marginRight: '6px', cursor: 'pointer' }}
                />
                <span style={{ color: '#555' }}>🗺️ エリア指定</span>
              </label>
            </div>
            
            {/* エリア指定モードの時のみ表示される入力欄 */}
            {searchMode === 'manual' && (
              <div style={{ marginTop: '12px' }}>
                <input
                  type="text"
                  placeholder="例: 新宿駅、渋谷、東京タワー"
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '1rem',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            )}
          </div>

          {/* 距離スライダー */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#666' }}>
              距離: {radius}m
            </label>
            <input
              type="range"
              min="500"
              max="5000"
              step="100"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#999' }}>
              <span>500m</span>
              <span>5000m</span>
            </div>
          </div>

          {/* 最低評価ドロップダウン */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#666' }}>
              最低評価: ⭐ {minRating}
            </label>
            <select
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '1rem',
                borderRadius: '6px',
                border: '1px solid #ddd',
                cursor: 'pointer'
              }}
            >
              <option value="1.0">⭐ 1.0以上</option>
              <option value="1.5">⭐ 1.5以上</option>
              <option value="2.0">⭐ 2.0以上</option>
              <option value="2.5">⭐ 2.5以上</option>
              <option value="3.0">⭐ 3.0以上</option>
              <option value="3.5">⭐ 3.5以上</option>
              <option value="4.0">⭐ 4.0以上</option>
              <option value="4.5">⭐ 4.5以上</option>
              <option value="5.0">⭐ 5.0（最高評価のみ）</option>
            </select>
          </div>

          {/* ジャンルドロップダウン */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#666' }}>
              ジャンル
            </label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '1rem',
                borderRadius: '6px',
                border: '1px solid #ddd',
                cursor: 'pointer'
              }}
            >
              {GENRE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* 営業中チェックボックス */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={openNow}
                onChange={(e) => setOpenNow(e.target.checked)}
                style={{ marginRight: '8px', cursor: 'pointer', width: '18px', height: '18px' }}
              />
              <span style={{ fontWeight: '600', color: '#666' }}>営業中のお店のみ表示</span>
            </label>
          </div>

          {/* 提案数ドロップダウン */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#666' }}>
              提案数: {count}件
            </label>
            <select
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '1rem',
                borderRadius: '6px',
                border: '1px solid #ddd',
                cursor: 'pointer'
              }}
            >
              <option value="1">1件</option>
              <option value="3">3件</option>
              <option value="5">5件</option>
            </select>
          </div>

          {/* 検索ボタン */}
          <button
            onClick={fetchRandomRestaurant}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '1.1rem',
              fontWeight: '600',
              color: 'white',
              backgroundColor: loading ? '#999' : '#4CAF50',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.3s',
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = '#45a049';
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = '#4CAF50';
            }}
          >
            {loading ? '🔍 探索中...' : '🎲 お店を探す'}
          </button>
        </div>

        {/* エラー表示 */}
        {error && (
          <div style={{
            backgroundColor: '#ffebee',
            color: '#c62828',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #ef9a9a'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* 結果表示エリア */}
        {restaurants.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: count === 1 ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {restaurants.map((restaurant, index) => (
              <div 
                key={index}
                style={{
                  backgroundColor: 'white',
                  padding: '24px',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  textAlign: 'center',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <h2 style={{ 
                  fontSize: '1.4rem', 
                  marginBottom: '12px', 
                  color: '#333',
                  borderBottom: '2px solid #4CAF50',
                  paddingBottom: '8px'
                }}>
                  {restaurant.name}
                </h2>
                
                <div style={{ 
                  fontSize: '1.1rem', 
                  marginBottom: '10px',
                  color: '#FF9800',
                  fontWeight: '600'
                }}>
                  ⭐ {restaurant.rating.toFixed(1)} 
                  <span style={{ fontSize: '0.85rem', color: '#999', marginLeft: '6px' }}>
                    ({restaurant.ratingCount}件)
                  </span>
                </div>
                
                <p style={{ 
                  fontSize: '0.9rem', 
                  color: '#666', 
                  marginBottom: '16px',
                  lineHeight: '1.5',
                  minHeight: '40px'
                }}>
                  📍 {restaurant.address}
                </p>
                
                <a 
                  href={restaurant.googleMapsUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  style={{
                    display: 'inline-block',
                    padding: '10px 20px',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    color: 'white',
                    backgroundColor: '#1976D2',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    transition: 'background-color 0.3s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1565C0'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1976D2'}
                >
                  🗺️ マップ
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
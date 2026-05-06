import React, { useState, useEffect, useRef } from 'react';
import { authApi, dietApi } from './api';
import Chart from 'chart.js/auto';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [dietInfo, setDietInfo] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [activeView, setActiveView] = useState('home');
  const [selectedMenuIdx, setSelectedMenuIdx] = useState(0);
  const [selectedHistory, setSelectedHistory] = useState<any>(null);
  
  // UI States
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoginView, setIsLoginView] = useState(true);
  const [error, setError] = useState('');
  
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const weightChart = useRef<Chart | null>(null);

  // Forms
  const [profileForm, setProfileForm] = useState({
    age: '' as any, 
    gender: 'male', 
    height: '' as any, 
    weight: '' as any, 
    activity_level: 'medium', 
    goal: 'maintain'
  });
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', password: '' });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    fetchDiet();
  }, [profileForm.age, profileForm.gender, profileForm.height, profileForm.weight, profileForm.activity_level, profileForm.goal]);

  const checkAuth = async () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const response = await authApi.getMe();
        setCurrentUser(response.data);
        setIsLoggedIn(true);
        if (response.data.height) {
          setProfileForm(prev => ({
            ...prev,
            age: response.data.age || prev.age,
            gender: response.data.gender || prev.gender,
            height: response.data.height || prev.height,
            weight: response.data.weight || prev.weight,
            activity_level: response.data.activity_level || prev.activity_level,
            goal: response.data.goal || prev.goal,
          }));
        }
        fetchHistory();
      } catch (err) {
        localStorage.removeItem('access_token');
        setIsLoggedIn(false);
      }
    }
    fetchDiet();
  };

  const fetchDiet = async () => {
    if (!profileForm.age || !profileForm.height || !profileForm.weight) return;
    try {
      const response = await dietApi.getRecommendation(profileForm);
      setDietInfo(response.data);
      setSelectedMenuIdx(0);
    } catch (err) { console.error('식단 로드 실패'); }
  };

  const fetchHistory = async () => {
    try {
      const response = await dietApi.getHistory();
      const data = response.data;
      setHistory(data);
      if (data.length > 0) {
        setSelectedHistory(data[0]);
      }
    } catch (err) { console.error('히스토리 로드 실패'); }
  };

  const saveRecord = async () => {
    if (!dietInfo?.calculation?.target_calories) {
      alert('신체 정보를 먼저 입력해주세요.');
      return;
    }
    
    try {
      const dataToSave = {
        age: Number(profileForm.age),
        height: Number(profileForm.height),
        weight: Number(profileForm.weight),
        gender: profileForm.gender,
        activity_level: profileForm.activity_level,
        goal: profileForm.goal,
        target_calories: Number(dietInfo.calculation.target_calories)
      };

      await authApi.updateMe(dataToSave);
      await dietApi.saveRecord(dataToSave);
      alert('오늘의 정보가 성공적으로 기록되었습니다!');
      await fetchHistory();
    } catch (err: any) { 
      console.error('저장 실패:', err.response?.data || err.message);
      alert('저장 중 오류가 발생했습니다.'); 
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await authApi.login(loginForm);
      localStorage.setItem('access_token', response.data.access_token);
      setShowAuthModal(false);
      await checkAuth();
      setError('');
    } catch (err) { setError('로그인 실패: 정보를 확인하세요.'); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authApi.register(registerForm);
      alert('가입 성공! 로그인해주세요.');
      setIsLoginView(true);
      setError('');
    } catch (err) { setError('가입 실패: 이미 있는 아이디입니다.'); }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setIsLoggedIn(false);
    setCurrentUser(null);
    setHistory([]);
    setSelectedHistory(null);
    setActiveView('home');
  };

  useEffect(() => {
    if (activeView === 'history' && history.length > 0) {
      renderChart();
    }
  }, [activeView, history]);

  const renderChart = () => {
    if (!chartRef.current) return;
    if (weightChart.current) weightChart.current.destroy();
    
    const labels = history.slice().reverse().map(h => new Date(h.date).toLocaleDateString());
    const weights = history.slice().reverse().map(h => h.weight);

    weightChart.current = new Chart(chartRef.current, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: '체중(kg)',
          data: weights,
          borderColor: '#00c853',
          backgroundColor: 'rgba(0, 200, 83, 0.1)',
          fill: true, tension: 0.4, borderWidth: 3
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  };

  const getLabel = (type: string, value: string) => {
    if (type === 'activity') {
      const map: any = { low: '사무직(적음)', medium: '보통', high: '활발(운동)' };
      return map[value] || value;
    }
    if (type === 'goal') {
      const map: any = { loss: '체중 감량', maintain: '체중 유지', gain: '체중 증량' };
      return map[value] || value;
    }
    return value;
  };

  return (
    <div className="app-wrapper">
      <div className="app-container">
        <header className="main-header">
          <h1>AI 식단 추천</h1>
          <div className="auth-box">
            {isLoggedIn ? (
              <div className="user-info">
                <span><strong>{currentUser?.username}</strong>님</span>
                <button onClick={handleLogout} className="logout-btn">로그아웃</button>
              </div>
            ) : (
              <button onClick={() => setShowAuthModal(true)} className="btn-login">로그인 / 가입</button>
            )}
          </div>
        </header>

        {isLoggedIn && (
          <nav className="main-nav">
            <button className={activeView === 'home' ? 'active' : ''} onClick={() => setActiveView('home')}>칼로리 분석</button>
            <button className={activeView === 'history' ? 'active' : ''} onClick={() => setActiveView('history')}>나의 기록</button>
          </nav>
        )}

        <main className="content">
          {activeView === 'home' ? (
            <div className="fade-in">
              <section className="card profile-card">
                <h3 className="card-title">신체 정보 및 목표 설정</h3>
                <div className="input-grid">
                  <div className="field">
                    <label>나이</label>
                    <input type="number" value={profileForm.age || ''} onChange={e => setProfileForm({...profileForm, age: Number(e.target.value)})} />
                  </div>
                  <div className="field">
                    <label>성별</label>
                    <select value={profileForm.gender} onChange={e => setProfileForm({...profileForm, gender: e.target.value})}>
                      <option value="male">남성</option>
                      <option value="female">여성</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>키 (cm)</label>
                    <input type="number" value={profileForm.height || ''} onChange={e => setProfileForm({...profileForm, height: Number(e.target.value)})} />
                  </div>
                  <div className="field">
                    <label>몸무게 (kg)</label>
                    <input type="number" value={profileForm.weight || ''} onChange={e => setProfileForm({...profileForm, weight: Number(e.target.value)})} />
                  </div>
                  <div className="field">
                    <label>활동량</label>
                    <select value={profileForm.activity_level} onChange={e => setProfileForm({...profileForm, activity_level: e.target.value})}>
                      <option value="low">사무직 (적음)</option>
                      <option value="medium">보통</option>
                      <option value="high">활발 (매일 운동)</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>체중 목표</label>
                    <select value={profileForm.goal} onChange={e => setProfileForm({...profileForm, goal: e.target.value})}>
                      <option value="loss">체중 감량</option>
                      <option value="maintain">체중 유지</option>
                      <option value="gain">체중 증량</option>
                    </select>
                  </div>
                </div>
                <div className="action-area">
                  {isLoggedIn ? (
                    <button onClick={saveRecord} className="btn-primary-big">오늘의 정보 기록 및 저장</button>
                  ) : (
                    <p className="login-notice-card">* 로그인을 하면 기록을 저장할 수 있습니다.</p>
                  )}
                </div>
              </section>

              {dietInfo?.calculation && (
                <div className="results-area">
                  <section className="card result-card">
                    <h3 className="card-title">📊 분석 리포트</h3>
                    <div className="stats-row">
                      <div className="stat-item"><span>기초대사량</span><strong>{dietInfo.calculation.bmr}</strong></div>
                      <div className="stat-item"><span>활동대사량</span><strong>{dietInfo.calculation.tdee}</strong></div>
                      <div className="stat-item highlight"><span>권장 섭취량</span><strong>{dietInfo.calculation.target_calories}</strong></div>
                    </div>
                    <div className="fixed-reason-box"><p>{dietInfo.calculation.calculation_reason}</p></div>
                    
                    <div className="evidence-inline-box">
                      <p><strong>영양학적 산출 근거</strong></p>
                      <p>• <strong>출처:</strong> {dietInfo.calculation.evidence.source}</p>
                      <p>• {dietInfo.calculation.evidence.description}</p>
                      <p className="formula-line-text">공식: {dietInfo.calculation.evidence.formula}</p>
                    </div>
                  </section>

                  <section className="card diet-card">
                    <div className="diet-header">
                      <h3 className="card-title">🥗 추천 식단 가이드</h3>
                      <button onClick={fetchDiet} className="btn-refresh-pill">🔄 새로운 식단 추천</button>
                    </div>
                    <div className="diet-tabs">
                      {dietInfo.recommendation.options.map((opt: any, idx: number) => (
                        <button key={idx} className={selectedMenuIdx === idx ? 'active' : ''} onClick={() => setSelectedMenuIdx(idx)}>추천 {idx + 1}</button>
                      ))}
                    </div>
                    {dietInfo.recommendation.options[selectedMenuIdx] && (
                      <div className="diet-content">
                        <div className="summary-bar-black">
                          <span>식단 총합: <strong>{dietInfo.recommendation.options[selectedMenuIdx].total_info.cal}</strong> kcal</span>
                          <div className="macros-pills">
                            <span className="c">탄 {dietInfo.recommendation.options[selectedMenuIdx].total_info.car}g</span>
                            <span className="p">단 {dietInfo.recommendation.options[selectedMenuIdx].total_info.pro}g</span>
                            <span className="f">지 {dietInfo.recommendation.options[selectedMenuIdx].total_info.fat}g</span>
                          </div>
                        </div>
                        <div className="meals-stack">
                          {Object.entries(dietInfo.recommendation.options[selectedMenuIdx].meals).map(([time, foods]: any) => (
                            <div key={time} className="meal-block">
                              <h4 className="meal-label">{time}</h4>
                              <div className="food-list">
                                {foods.map((f: any) => (
                                  <div key={f.name} className="food-row-ui">
                                    <div className="f-main"><span>{f.name}</span><span className="f-cal-ui">{f.cal} kcal</span></div>
                                    <div className="f-sub">탄 {f.car}g · 단 {f.pro}g · 지 {f.fat}g</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </section>
                </div>
              )}
            </div>
          ) : (
            <div className="fade-in">
              <section className="card chart-section">
                <h3 className="card-title">📈 체중 변화 추이</h3>
                <div className="chart-box-fixed"><canvas ref={chartRef}></canvas></div>
              </section>
              
              <div className="vertical-history">
                {selectedHistory && (
                  <section className="card history-detail-top fade-in">
                    <div className="detail-header-flex">
                      <h3 className="card-title">🔍 상세 기록 정보 ({new Date(selectedHistory.date).toLocaleDateString()})</h3>
                    </div>
                    <div className="full-info-grid">
                      <div className="info-item"><span>나이</span><strong>{selectedHistory.age || '-'}세</strong></div>
                      <div className="info-item"><span>키</span><strong>{selectedHistory.height || '-'}cm</strong></div>
                      <div className="info-item"><span>현재 체중</span><strong>{selectedHistory.weight}kg</strong></div>
                      <div className="info-item"><span>활동량</span><strong>{getLabel('activity', selectedHistory.activity_level)}</strong></div>
                      <div className="info-item"><span>목표</span><strong>{getLabel('goal', selectedHistory.goal)}</strong></div>
                      <div className="info-item highlight"><span>권장 칼로리</span><strong>{selectedHistory.target_calories}kcal</strong></div>
                    </div>
                  </section>
                )}

                <section className="card log-section">
                  <div className="log-header"><h3>📝 기록 리스트</h3></div>
                  {history.length === 0 ? (
                    <div className="empty-state">
                      <p>아직 저장된 기록이 없습니다.</p>
                      <span>분석 리포트에서 오늘의 정보를 기록해보세요!</span>
                    </div>
                  ) : (
                    <div className="log-table-v2">
                      {history.map(item => (
                        <div 
                          key={item.id} 
                          className={`log-row-classic ${selectedHistory?.id === item.id ? 'active' : ''}`}
                          onClick={() => setSelectedHistory(item)}
                        >
                          <div className="row-left">
                            <span className="date-tag">{new Date(item.date).toLocaleDateString()}</span>
                            <span className="weight-val"><strong>{item.weight}</strong>kg</span>
                          </div>
                          <div className="row-right">
                            <span className="cal-val"><strong>{item.target_calories}</strong>kcal</span>
                            <span className="arrow">›</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}
        </main>

        {showAuthModal && (
          <div className="modal-dim" onClick={() => setShowAuthModal(false)}>
            <div className="modal card" onClick={e => e.stopPropagation()}>
              <div className="auth-tabs">
                <button className={isLoginView ? 'active' : ''} onClick={() => setIsLoginView(true)}>로그인</button>
                <button className={!isLoginView ? 'active' : ''} onClick={() => setIsLoginView(false)}>회원가입</button>
              </div>
              {isLoginView ? (
                <form onSubmit={handleLogin} className="auth-form-v">
                  <input placeholder="아이디" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} required />
                  <input type="password" placeholder="비밀번호" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} required />
                  <button className="btn-primary-big mt-15">로그인</button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="auth-form-v">
                  <input placeholder="아이디" value={registerForm.username} onChange={e => setRegisterForm({...registerForm, username: e.target.value})} required />
                  <input type="password" placeholder="비밀번호" value={registerForm.password} onChange={e => setRegisterForm({...registerForm, password: e.target.value})} required />
                  <button className="btn-primary-big mt-15">가입 완료</button>
                </form>
              )}
              {error && <p className="error-text-red">{error}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

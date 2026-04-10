import React, { useState, useEffect } from "react";

// ─────────────────────────────
// 1. 피토리 앱 기본 데이터 설정
// ─────────────────────────────
const DEFAULT_CATS = [
  { id: "video", label: "영상", icon: "▶", color: "#FF6B35", bg: "#FFF0EB" },
  { id: "landing", label: "랜딩페이지", icon: "⬡", color: "#3B82F6", bg: "#EFF6FF" },
  { id: "domain", label: "도메인", icon: "◉", color: "#10B981", bg: "#ECFDF5" },
  { id: "bizplan", label: "사업계획서", icon: "◻", color: "#8B5CF6", bg: "#F5F3FF" },
  { id: "proto", label: "프로토타입", icon: "◈", color: "#F59E0B", bg: "#FFFBEB" },
  { id: "grant", label: "지원사업", icon: "★", color: "#EF4444", bg: "#FEF2F2" },
  { id: "team", label: "팀빌딩", icon: "◎", color: "#06B6D4", bg: "#ECFEFF" },
  { id: "other", label: "기타", icon: "◆", color: "#6B7280", bg: "#F9FAFB" },
];

const SK = { E: "fitory-v5-entries" };

// 끊겼던 SEED 데이터 완성
const SEED_E = [
  { id: "s1", date: "2026-03-01", category: "domain", title: "fitory.kr 도메인 구매", desc: "가비아 등록", url: "https://fitory.kr", fileName: "", fileData: null },
  { id: "s2", date: "2026-03-08", category: "bizplan", title: "예창패 사업계획서 1차 초안", desc: "여성 특화 트랙", url: "", fileName: "", fileData: null },
  { id: "s3", date: "2026-03-20", category: "proto", title: "React 모바일 시뮬레이터", desc: "대여+구매 통합", url: "", fileName: "", fileData: null },
  { id: "s4", date: "2026-04-01", category: "landing", title: "랜딩페이지 1차 배포", desc: "고객 반응 테스트 시작", url: "", fileName: "", fileData: null }
];

const fmtDate = (d) => {
  if (!d) return "";
  return new Date(`${d}T00:00:00`).toLocaleDateString();
};

// ─────────────────────────────
// 2. IndexedDB 설정 (로컬 파일 저장용)
// ─────────────────────────────
const DB_NAME = "fitory-db";
const STORE_NAME = "store";

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function sGet(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(key);

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function sSet(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put(value, key);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ─────────────────────────────
// 3. 메인 App 컴포넌트
// ─────────────────────────────
export default function App() {
  const [entries, setEntries] = useState([]);
  
  // 입력 폼 상태
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("other");
  const [desc, setDesc] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  // 초기 데이터 로드
  useEffect(() => {
    (async () => {
      const data = await sGet(SK.E);
      if (!data || data.length === 0) {
        // DB가 비어있으면 초기 시드 데이터 삽입
        await sSet(SK.E, SEED_E);
        setEntries(SEED_E);
      } else {
        setEntries(data);
      }
    })();
  }, []);

  // 새 기록 추가 및 파일 업로드 처리
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return alert("제목을 입력해주세요!");

    const newEntry = {
      id: `entry-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      category: category,
      title: title,
      desc: desc,
      // 파일이 있으면 Blob과 이름 저장
      fileName: selectedFile ? selectedFile.name : "",
      fileType: selectedFile ? selectedFile.type : "",
      fileData: selectedFile ? selectedFile : null, 
    };

    const updatedEntries = [newEntry, ...entries];
    setEntries(updatedEntries);
    await sSet(SK.E, updatedEntries); // IndexedDB에 통째로 저장 (Blob 포함)

    // 폼 초기화
    setTitle("");
    setDesc("");
    setSelectedFile(null);
    document.getElementById("fileInput").value = "";
  };

  // 파일 다운로드 핸들러
  const downloadFile = (entry) => {
    if (!entry.fileData) return;
    const url = URL.createObjectURL(entry.fileData);
    const a = document.createElement("a");
    a.href = url;
    a.download = entry.fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 카테고리 정보 찾기
  const getCatInfo = (catId) => DEFAULT_CATS.find(c => c.id === catId) || DEFAULT_CATS[7];

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 20, fontFamily: "sans-serif" }}>
      <h1 style={{ borderBottom: "2px solid #eee", paddingBottom: 10 }}>🚀 Fitory Workspace</h1>

      {/* 입력 폼 */}
      <form onSubmit={handleSubmit} style={{ background: "#f9f9f9", padding: 20, borderRadius: 10, marginBottom: 30 }}>
        <h3>새로운 기록 추가</h3>
        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: 8 }}>
            {DEFAULT_CATS.map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
            ))}
          </select>
          <input 
            type="text" 
            placeholder="기록 제목 (예: 사업계획서 제출)" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            style={{ flex: 1, padding: 8 }}
          />
        </div>
        <input 
          type="text" 
          placeholder="간단한 설명..." 
          value={desc} 
          onChange={(e) => setDesc(e.target.value)} 
          style={{ width: "100%", padding: 8, marginBottom: 10, boxSizing: "border-box" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <input 
            id="fileInput"
            type="file" 
            onChange={(e) => setSelectedFile(e.target.files[0])} 
          />
          <button type="submit" style={{ padding: "10px 20px", background: "#3B82F6", color: "white", border: "none", borderRadius: 5, cursor: "pointer" }}>
            기록 저장하기
          </button>
        </div>
      </form>

      {/* 타임라인 목록 */}
      <div>
        <h2>📈 나의 발자취 ({entries.length}개)</h2>
        {entries.map((entry) => {
          const catInfo = getCatInfo(entry.category);
          return (
            <div key={entry.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 15, marginBottom: 15, display: "flex", gap: 15 }}>
              
              {/* 카테고리 아이콘 */}
              <div style={{ width: 50, height: 50, borderRadius: "50%", background: catInfo.bg, color: catInfo.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
                {catInfo.icon}
              </div>

              {/* 내용 */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: "#666" }}>{fmtDate(entry.date)}</div>
                <h3 style={{ margin: "5px 0" }}>{entry.title}</h3>
                <p style={{ margin: 0, color: "#444", fontSize: 14 }}>{entry.desc}</p>
                
                {/* 첨부파일 영역 */}
                {entry.fileData && (
                  <div style={{ marginTop: 15, padding: 10, background: "#f1f5f9", borderRadius: 5, display: "inline-block" }}>
                    <div style={{ fontSize: 12, marginBottom: 5 }}>📁 {entry.fileName}</div>
                    
                    {/* 이미지 파일이면 미리보기 보여주기 */}
                    {entry.fileType && entry.fileType.startsWith("image/") && (
                      <div style={{ marginBottom: 10 }}>
                        <img 
                          src={URL.createObjectURL(entry.fileData)} 
                          alt="preview" 
                          style={{ maxWidth: 200, borderRadius: 5, border: "1px solid #ccc" }} 
                        />
                      </div>
                    )}
                    
                    <button onClick={() => downloadFile(entry)} style={{ fontSize: 12, padding: "5px 10px", cursor: "pointer" }}>
                      ⬇ 다운로드
                    </button>
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}

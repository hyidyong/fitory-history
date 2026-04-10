<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fitory Workspace</title>
  
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body>
  <div id="root"></div>

  <script type="text/babel">
    const { useState, useEffect } = React;

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

    const SEED_E = [
      { id: "s1", date: "2026-03-01", category: "domain", title: "fitory.kr 도메인 구매", desc: "가비아 등록", fileName: "", fileData: null },
      { id: "s2", date: "2026-03-08", category: "bizplan", title: "예창패 사업계획서 1차 초안", desc: "여성 특화 트랙", fileName: "", fileData: null }
    ];

    const fmtDate = (d) => {
      if (!d) return "";
      return new Date(`${d}T00:00:00`).toLocaleDateString();
    };

    const DB_NAME = "fitory-db";
    const STORE_NAME = "store";

    function openDB() {
      return new Promise((resolve, reject) => {
        try {
          if (!window.indexedDB) {
            console.warn("이 브라우저에서는 IndexedDB를 지원하지 않습니다.");
            return reject("No IndexedDB");
          }
          const req = window.indexedDB.open(DB_NAME, 1);
          req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
              db.createObjectStore(STORE_NAME);
            }
          };
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        } catch (err) {
          reject(err);
        }
      });
    }

    async function sGet(key) {
      try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, "readonly");
          const store = tx.objectStore(STORE_NAME);
          const req = store.get(key);
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });
      } catch (err) {
        console.error("데이터 로드 실패 (브라우저 보안 문제일 수 있음):", err);
        return null;
      }
    }

    async function sSet(key, value) {
      try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, "readwrite");
          const store = tx.objectStore(STORE_NAME);
          store.put(value, key);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      } catch (err) {
        console.error("데이터 저장 실패:", err);
      }
    }

    const getSafeObjectURL = (data) => {
      if (!data) return "";
      try {
        return URL.createObjectURL(data);
      } catch (e) {
        return "";
      }
    };

    function App() {
      const [entries, setEntries] = useState([]);
      const [title, setTitle] = useState("");
      const [category, setCategory] = useState("other");
      const [desc, setDesc] = useState("");
      const [selectedFile, setSelectedFile] = useState(null);

      useEffect(() => {
        (async () => {
          try {
            const data = await sGet(SK.E);
            if (!data || data.length === 0) {
              setEntries(SEED_E);
            } else {
              setEntries(data);
            }
          } catch (e) {
            console.error("DB 접근 불가. 임시 데이터로 렌더링합니다.");
            setEntries(SEED_E);
          }
        })();
      }, []);

      const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) return alert("제목을 입력해주세요!");

        const newEntry = {
          id: `entry-${Date.now()}`,
          date: new Date().toISOString().slice(0, 10),
          category: category,
          title: title,
          desc: desc,
          fileName: selectedFile ? selectedFile.name : "",
          fileType: selectedFile ? selectedFile.type : "",
          fileData: selectedFile ? selectedFile : null, 
        };

        const updatedEntries = [newEntry, ...entries];
        setEntries(updatedEntries);
        await sSet(SK.E, updatedEntries); 

        setTitle("");
        setDesc("");
        setSelectedFile(null);
        const fileInput = document.getElementById("fileInput");
        if (fileInput) fileInput.value = "";
      };

      const downloadFile = (entry) => {
        if (!entry.fileData) return;
        try {
          const url = getSafeObjectURL(entry.fileData);
          if (!url) return alert("손상된 파일입니다.");
          const a = document.createElement("a");
          a.href = url;
          a.download = entry.fileName;
          a.click();
          URL.revokeObjectURL(url);
        } catch (e) {
          alert("파일을 다운로드할 수 없습니다.");
        }
      };

      const getCatInfo = (catId) => DEFAULT_CATS.find(c => c.id === catId) || DEFAULT_CATS[7];

      return (
        <div style={{ maxWidth: 800, margin: "0 auto", padding: 20, fontFamily: "sans-serif" }}>
          <h1 style={{ borderBottom: "2px solid #eee", paddingBottom: 10 }}>🚀 Fitory Workspace</h1>

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

          <div>
            <h2>📈 나의 발자취 ({entries.length}개)</h2>
            {entries.map((entry) => {
              const catInfo = getCatInfo(entry.category);
              const isImage = entry.fileType && typeof entry.fileType === "string" && entry.fileType.startsWith("image/");
              
              return (
                <div key={entry.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 15, marginBottom: 15, display: "flex", gap: 15 }}>
                  <div style={{ width: 50, height: 50, borderRadius: "50%", background: catInfo.bg, color: catInfo.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
                    {catInfo.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: "#666" }}>{fmtDate(entry.date)}</div>
                    <h3 style={{ margin: "5px 0" }}>{entry.title}</h3>
                    <p style={{ margin: 0, color: "#444", fontSize: 14 }}>{entry.desc}</p>
                    
                    {entry.fileData && (
                      <div style={{ marginTop: 15, padding: 10, background: "#f1f5f9", borderRadius: 5, display: "inline-block" }}>
                        <div style={{ fontSize: 12, marginBottom: 5 }}>📁 {entry.fileName}</div>
                        {isImage && getSafeObjectURL(entry.fileData) && (
                          <div style={{ marginBottom: 10 }}>
                            <img src={getSafeObjectURL(entry.fileData)} alt="preview" style={{ maxWidth: 200, borderRadius: 5, border: "1px solid #ccc" }} />
                          </div>
                        )}
                        <button onClick={() => downloadFile(entry)} style={{ fontSize: 12, padding: "5px 10px", cursor: "pointer", background: "white", border: "1px solid #ccc", borderRadius: 4 }}>
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

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<App />);
  </script>
</body>
</html>

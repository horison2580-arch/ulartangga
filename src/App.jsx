import { useRef, useState, useMemo } from 'react'

const LADDERS = { 4: 25, 13: 46, 27: 53, 33: 49, 50: 69, 62: 81, 74: 92 }
const SNAKES = { 97: 78, 89: 51, 66: 45, 54: 36, 43: 18, 31: 9 }
const STARS = [8, 17, 24, 38, 47, 58, 68, 77, 85, 94]
const EMOJIS = ['🦁', '🐼', '🐸', '🦊']
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a
const shuffle = (a) => [...a].sort(() => Math.random() - 0.5)
const pick1 = (a) => a[rnd(0, a.length - 1)]
const xy = (n) => { const r = Math.floor((n - 1) / 10), c = (n - 1) % 10; return { col: r % 2 ? 9 - c : c, row: 9 - r } }
const ctr = (n) => { const { col, row } = xy(n); return [col * 10 + 5, row * 10 + 5] }

function beep(f = 600, d = 0.15) {
  try {
    const a = new (window.AudioContext || window.webkitAudioContext)()
    const o = a.createOscillator(), g = a.createGain()
    o.frequency.value = f; g.gain.value = 0.08
    o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + d)
  } catch { /* audio tidak tersedia */ }
}
function say(t) {
  try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = 'id-ID'; speechSynthesis.speak(u) } catch { /* tidak didukung */ }
}
const opts = (ans, spread) => {
  const s = new Set([ans])
  while (s.size < 3) { const v = ans + rnd(-spread, spread); if (v >= 0) s.add(v) }
  return shuffle([...s])
}
const WORDS = [['KUCING', '🐱'], ['BUNGA', '🌸'], ['APEL', '🍎'], ['BUKU', '📚'], ['IKAN', '🐟'], ['SEPEDA', '🚲'], ['PISANG', '🍌'], ['BULAN', '🌙'], ['RUMAH', '🏠'], ['BOLA', '⚽']]
const ITEMS = ['🍎', '⭐', '🐟', '🎈', '🍌', '🐥', '🌸', '🚗']

function makeQ(g) {
  const t = rnd(0, 3)
  if (t === 0) {
    const ops = g === 3 ? ['+', '-', '×'] : ['+', '-']
    const op = pick1(ops), max = [0, 10, 40, 99][g]
    let a = op === '×' ? rnd(2, 9) : rnd(1, max), b = op === '×' ? rnd(2, 9) : rnd(1, max)
    if (op === '-' && b > a) [a, b] = [b, a]
    const ans = op === '+' ? a + b : op === '-' ? a - b : a * b
    const w = op === '+' ? 'tambah' : op === '-' ? 'kurang' : 'kali'
    return { type: 'math', title: 'Hitung yuk!', text: `${a} ${op} ${b} = ?`, say: `${a} ${w} ${b} sama dengan berapa?`, options: opts(ans, g + 2), ans, show: ans }
  }
  if (t === 1) {
    const n = rnd(2, [0, 8, 12, 15][g])
    return { type: 'count', title: 'Ada berapa gambarnya?', emoji: pick1(ITEMS), say: 'Ada berapa gambarnya?', options: opts(n, 2), ans: n, show: n }
  }
  if (t === 2) {
    const max = [0, 20, 100, 999][g]
    const nums = []
    while (nums.length < 4) { const v = rnd(1, max); if (!nums.includes(v)) nums.push(v) }
    const sorted = [...nums].sort((a, b) => a - b)
    return { type: 'order', title: 'Urutkan dari yang terkecil!', say: 'Sentuh angka dari yang terkecil sampai terbesar', nums, sorted, show: sorted.join(' → ') }
  }
  const [w, e] = pick1(WORDS), idx = rnd(0, w.length - 1), letter = w[idx]
  const L = 'ABCDEGHIKLMNPRSTU'.split('')
  const s = new Set([letter])
  while (s.size < 3) s.add(pick1(L))
  return { type: 'word', title: 'Huruf apa yang hilang?', emoji: e, shown: w.split('').map((c, i) => (i === idx ? '_' : c)).join(' '), say: 'Huruf apa yang hilang?', options: shuffle([...s]), ans: letter, show: w }
}

function Quiz({ g, onDone }) {
  const q = useMemo(() => makeQ(g), [g])
  const [res, setRes] = useState(null)
  const [sel, setSel] = useState([])
  const finish = (ok) => {
    if (res !== null) return
    setRes(ok); beep(ok ? 880 : 200, 0.3); say(ok ? 'Hebat! Benar!' : 'Belum tepat. Semangat!')
    setTimeout(() => onDone(ok), 2200)
  }
  const tap = (x) => {
    if (res !== null || sel.includes(x)) return
    if (x !== q.sorted[sel.length]) return finish(false)
    const s = [...sel, x]; setSel(s); beep(600 + s.length * 100, 0.08)
    if (s.length === 4) finish(true)
  }
  return (
    <div className="modal"><div className="card">
      <h2>⭐ {q.title} <button className="sp" onClick={() => say(q.say)}>🔊</button></h2>
      {q.type === 'math' && <div className="q">{q.text}</div>}
      {q.type === 'count' && <div className="q em">{Array.from({ length: q.ans }, (_, i) => <span key={i}>{q.emoji}</span>)}</div>}
      {q.type === 'word' && <div className="q">{q.emoji} {q.shown}</div>}
      <div className="opts">
        {q.type === 'order'
          ? q.nums.map((x) => <button key={x} className={'o' + (sel.includes(x) ? ' on' : '')} onClick={() => tap(x)}>{x}</button>)
          : q.options.map((o) => <button key={o} className="o" onClick={() => finish(o === q.ans)}>{o}</button>)}
      </div>
      {res !== null && <div className={res ? 'ok' : 'no'}>{res ? '🎉 Benar! Hebat!' : `😅 Jawabannya: ${q.show}`}</div>}
    </div></div>
  )
}

export default function App() {
  const [stage, setStage] = useState('setup')
  const [n, setN] = useState(2)
  const [names, setNames] = useState(['Pemain 1', 'Pemain 2', 'Pemain 3', 'Pemain 4'])
  const [g, setG] = useState(1)
  const [players, setPlayers] = useState([])
  const [turn, setTurn] = useState(0)
  const [dice, setDice] = useState(0)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [quiz, setQuiz] = useState(null)
  const [winner, setWinner] = useState(null)
  const ps = useRef([])

  const upd = (i, pos) => { ps.current = ps.current.map((p, j) => (j === i ? { ...p, pos } : p)); setPlayers(ps.current) }
  const start = () => {
    ps.current = names.slice(0, n).map((x, i) => ({ name: x.trim() || `Pemain ${i + 1}`, emoji: EMOJIS[i], pos: 1 }))
    setPlayers(ps.current); setTurn(0); setDice(0); setWinner(null); setBusy(false); setMsg('Ayo lempar dadu!'); setStage('play')
  }
  const land = async (i, p) => {
    const to = LADDERS[p] || SNAKES[p]
    if (!to) return p
    setMsg(LADDERS[p] ? '🪜 Hore, naik tangga!' : '🐍 Aduh, turun lewat ular!')
    beep(LADDERS[p] ? 900 : 180, 0.4); await sleep(600); upd(i, to); await sleep(800)
    return to
  }
  const roll = async () => {
    if (busy) return
    setBusy(true)
    const i = turn
    let d = 1
    for (let k = 0; k < 8; k++) { d = rnd(1, 6); setDice(d); beep(300 + k * 30, 0.05); await sleep(80) }
    let p = ps.current[i].pos
    if (p + d > 100) {
      setMsg('Butuh angka yang pas untuk sampai 100! 😮')
    } else {
      for (let k = 0; k < d; k++) { p++; upd(i, p); beep(500, 0.05); await sleep(260) }
      p = await land(i, p)
      if (p !== 100 && STARS.includes(p)) {
        setMsg('⭐ Mini game!'); await sleep(700)
        const ok = await new Promise((res) => setQuiz({ res }))
        setQuiz(null)
        if (ok && p + 2 <= 100) {
          setMsg('🎉 Bonus maju 2 langkah!')
          for (let k = 0; k < 2; k++) { p++; upd(i, p); beep(700, 0.08); await sleep(300) }
          p = await land(i, p)
        } else if (!ok) setMsg('Tidak apa-apa, coba lagi nanti! 💪')
      }
      if (p === 100) { beep(1000, 0.6); setWinner(ps.current[i]); setBusy(false); return }
    }
    await sleep(500)
    if (d === 6 && p + 0 <= 100) setMsg('🎲 Dapat 6! Main lagi!')
    else { const nx = (i + 1) % ps.current.length; setTurn(nx); setMsg(`Giliran ${ps.current[nx].name}`) }
    setBusy(false)
  }

  if (stage === 'setup') return (
    <div className="wrap"><div className="card setup">
      <h1>🐍 Ular Tangga Belajar 🪜</h1>
      <p>Lempar dadu, capai kotak 100! Kotak ⭐ punya mini game: jawab benar untuk bonus maju 2 langkah.</p>
      <h3>Berapa pemain?</h3>
      <div className="row">{[1, 2, 3, 4].map((x) => <button key={x} className={'o' + (n === x ? ' on' : '')} onClick={() => setN(x)}>{x}</button>)}</div>
      {names.slice(0, n).map((nm, i) => (
        <label key={i} className="nm">{EMOJIS[i]} <input value={nm} maxLength={12} onChange={(e) => setNames(names.map((v, j) => (j === i ? e.target.value : v)))} /></label>
      ))}
      <h3>Pilih kelas</h3>
      <div className="row">{[1, 2, 3].map((x) => <button key={x} className={'o' + (g === x ? ' on' : '')} onClick={() => setG(x)}>Kelas {x}</button>)}</div>
      <button className="big" onClick={start}>▶ Mulai Main!</button>
    </div></div>
  )

  const cur = players[turn]
  return (
    <div className="wrap play">
      <div className="boardbox">
        <div className="board">
          {Array.from({ length: 100 }, (_, k) => k + 1).map((c) => {
            const { col, row } = xy(c)
            return <div key={c} className={'cell' + (STARS.includes(c) ? ' star' : '') + ((col + row) % 2 ? ' alt' : '')} style={{ gridColumn: col + 1, gridRow: row + 1 }}>{STARS.includes(c) ? '⭐' : c}</div>
          })}
          <svg viewBox="0 0 100 100">
            {Object.entries(LADDERS).map(([a, b]) => { const [x1, y1] = ctr(+a), [x2, y2] = ctr(b); return <g key={a}><line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#8d5524" strokeWidth="2.6" strokeLinecap="round" /><line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ffd8a8" strokeWidth="1.5" strokeDasharray="0.9 1.8" /></g> })}
            {Object.entries(SNAKES).map(([a, b]) => { const [x1, y1] = ctr(+a), [x2, y2] = ctr(b); const mx = (x1 + x2) / 2 + (y2 - y1) * 0.18, my = (y1 + y2) / 2 - (x2 - x1) * 0.18; return <g key={a}><path d={`M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}`} fill="none" stroke="#e8590c" strokeWidth="2.2" strokeLinecap="round" opacity=".85" /><text x={x1} y={y1 + 2} fontSize="6" textAnchor="middle">🐍</text></g> })}
          </svg>
          {players.map((p, i) => { const { col, row } = xy(p.pos); return <div key={i} className="tok" style={{ left: `${col * 10 + (i % 2) * 4.5 + 0.7}%`, top: `${row * 10 + (i >> 1) * 4.5 + 0.7}%` }}>{p.emoji}</div> })}
        </div>
      </div>
      <div className="card side">
        <button className="sp" onClick={() => setStage('setup')}>← Menu</button>
        <h2>{cur.emoji} Giliran {cur.name}</h2>
        <div className="dice">{dice ? '⚀⚁⚂⚃⚄⚅'[dice - 1] : '🎲'}</div>
        <button className="big" disabled={busy} onClick={roll}>🎲 Lempar Dadu</button>
        <div className="msg">{msg}</div>
        {players.map((p, i) => <div key={i} className={'pl' + (i === turn ? ' me' : '')}>{p.emoji} {p.name} — kotak {p.pos}</div>)}
      </div>
      {quiz && <Quiz g={g} onDone={quiz.res} />}
      {winner && <div className="modal"><div className="card"><h1>🏆 {winner.emoji} {winner.name} menang!</h1><p>Hebat sekali! Kamu pintar! 🎉</p><button className="big" onClick={start}>Main Lagi</button> <button className="big" onClick={() => setStage('setup')}>Menu</button></div></div>}
    </div>
  )
}

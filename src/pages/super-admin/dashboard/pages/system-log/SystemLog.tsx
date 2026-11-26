// @ts-nocheck
import { useMemo, useState } from 'react';
import { useGetSystemLogsQuery, useClearSystemLogsMutation } from '../../../../../redux/api/systemLogSlice';

type LogType = 'combined' | 'error';
type LevelFilter = 'all' | 'info' | 'warn' | 'error';

const LEVEL_COLORS = {
  error: '#ff7b72',
  warn:  '#e3b341',
  info:  '#7ee787',
  other: '#8b949e',
};

function classifyLine(line: string): 'error' | 'warn' | 'info' | 'other' {
  if (line.includes('] error:')) return 'error';
  if (line.includes('] warn:'))  return 'warn';
  if (line.includes('] info:'))  return 'info';
  return 'other';
}

export default function SystemLog() {
  const [logType, setLogType]       = useState<LogType>('combined');
  const [lines, setLines]           = useState(200);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [search, setSearch]         = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  const { data, isFetching, refetch } = useGetSystemLogsQuery(
    { type: logType, lines },
    { pollingInterval: autoRefresh ? 5000 : 0 }
  );
  const [clearSystemLogs, { isLoading: isClearing }] = useClearSystemLogsMutation();

  const rawLines: string[] = useMemo(() =>
    (data?.logs ?? '').split('\n').filter(Boolean),
    [data]
  );

  const stats = useMemo(() => {
    let errors = 0, warns = 0, infos = 0;
    rawLines.forEach(l => {
      const c = classifyLine(l);
      if (c === 'error') errors++;
      else if (c === 'warn') warns++;
      else if (c === 'info') infos++;
    });
    return { total: rawLines.length, errors, warns, infos };
  }, [rawLines]);

  const filteredLines = useMemo(() => {
    let result = rawLines;
    if (levelFilter !== 'all') result = result.filter(l => classifyLine(l) === levelFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(l => l.toLowerCase().includes(q));
    }
    return result;
  }, [rawLines, levelFilter, search]);

  const handleClear = async () => {
    if (!confirmClear) { setConfirmClear(true); return; }
    await clearSystemLogs({ type: logType });
    setConfirmClear(false);
    refetch();
  };

  const handleDownload = () => {
    const blob = new Blob([data?.logs ?? ''], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${logType}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const highlightSearch = (text: string) => {
    if (!search.trim()) return text;
    const idx = text.toLowerCase().indexOf(search.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark style={{ background: '#f0c040', color: '#000', borderRadius: 2 }}>
          {text.slice(idx, idx + search.length)}
        </mark>
        {text.slice(idx + search.length)}
      </>
    );
  };

  const S = {
    root:    { background: '#0d1117', minHeight: '100vh', display: 'flex', flexDirection: 'column' as const, fontFamily: 'monospace', fontSize: 12 },
    toolbar: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#161b22', borderBottom: '1px solid #30363d', flexWrap: 'wrap' as const },
    btn:     (active: boolean, accent?: string) => ({
      background: active ? (accent ?? '#238636') : '#21262d',
      color: active ? '#fff' : '#c9d1d9',
      border: `1px solid ${active ? (accent ?? '#238636') : '#30363d'}`,
      borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontSize: 12,
    }),
    statsBar: { display: 'flex', gap: 16, padding: '6px 14px', background: '#0d1117', borderBottom: '1px solid #21262d' },
    stat:    (color: string) => ({ color, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }),
    pre:     { flex: 1, margin: 0, padding: '10px 14px', background: '#0d1117', color: '#e6edf3', overflowY: 'auto' as const, lineHeight: 1.65 },
    searchBox: { background: '#21262d', color: '#c9d1d9', border: '1px solid #30363d', borderRadius: 4, padding: '3px 8px', outline: 'none', fontSize: 12, width: 180 },
    badge: (color: string) => ({ background: color + '22', color, border: `1px solid ${color}44`, borderRadius: 3, padding: '1px 6px', fontSize: 11 }),
  };

  return (
    <div style={S.root}>
      <div style={S.toolbar}>
        <span style={{ color: '#58a6ff', fontWeight: 'bold', fontSize: 14, marginRight: 4 }}>$ system-log</span>

        <button onClick={() => setLogType('combined')} style={S.btn(logType === 'combined', '#238636')}>combined</button>
        <button onClick={() => setLogType('error')}    style={S.btn(logType === 'error',    '#da3633')}>error</button>

        <div style={{ width: 1, height: 18, background: '#30363d' }} />

        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 search logs…"
          style={S.searchBox}
        />
        {search && (
          <span style={{ color: '#8b949e', fontSize: 11 }}>{filteredLines.length} match{filteredLines.length !== 1 ? 'es' : ''}</span>
        )}

        <div style={{ width: 1, height: 18, background: '#30363d' }} />

        <button onClick={() => refetch()} style={S.btn(false)}>
          {isFetching ? '⟳ …' : '⟳ refresh'}
        </button>
        <label style={{ color: '#8b949e', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} />
          auto 5s
        </label>
        <div style={{ flex: 1 }} />

        <button onClick={handleDownload} style={S.btn(false)} title="Download log file">
          ⬇ download
        </button>

        <button
          onClick={handleClear}
          onBlur={() => setConfirmClear(false)}
          disabled={isClearing}
          style={{ ...S.btn(confirmClear, '#b91c1c'), color: '#fca5a5', borderColor: '#7f1d1d' }}
        >
          {isClearing ? 'clearing…' : confirmClear ? '⚠ confirm clear' : '🗑 clear'}
        </button>
      </div>

      <div style={S.statsBar}>
        <span style={S.stat('#8b949e')}>📄 {stats.total} lines</span>
        <span style={S.stat(LEVEL_COLORS.info)}>  ● {stats.infos} info</span>
        <span style={S.stat(LEVEL_COLORS.warn)}>  ● {stats.warns} warn</span>
        <span style={S.stat(LEVEL_COLORS.error)}>  ● {stats.errors} error</span>
        {(levelFilter !== 'all' || search) && (
          <span style={S.stat('#58a6ff')}>  → showing {filteredLines.length}</span>
        )}
        <div style={{ flex: 1 }} />
        <select value={lines} onChange={e => setLines(Number(e.target.value))}
          style={{ background: '#21262d', color: '#8b949e', border: '1px solid #21262d', borderRadius: 4, padding: '1px 4px', fontSize: 11 }}>
          <option value={100}>last 100</option>
          <option value={200}>last 200</option>
          <option value={500}>last 500</option>
          <option value={1000}>last 1000</option>
        </select>
        <div style={{ width: 1, height: 14, background: '#21262d' }} />
        {(['all', 'info', 'warn', 'error'] as LevelFilter[]).map(l => (
          <button key={l} onClick={() => setLevelFilter(l)}
            style={{
              ...S.btn(levelFilter === l, l === 'error' ? '#da3633' : l === 'warn' ? '#9e6a03' : l === 'info' ? '#238636' : '#58a6ff'),
              padding: '1px 8px', fontSize: 11,
            }}>
            {l}
          </button>
        ))}
      </div>

      <pre style={S.pre}>
        {filteredLines.length === 0 ? (
          <span style={{ color: '#484f58' }}>
            {isFetching ? 'Loading…' : 'No logs match the current filters.'}
          </span>
        ) : (
          filteredLines.map((line, i) => {
            const level = classifyLine(line);
            const color = LEVEL_COLORS[level];
            return (
              <span key={i} style={{ color, display: 'flex', gap: 12, paddingBottom: 1 }}>
                <span style={{ color: '#484f58', userSelect: 'none', minWidth: 36, textAlign: 'right', flexShrink: 0 }}>
                  {i + 1}
                </span>
                <span style={{ flex: 1, wordBreak: 'break-all' }}>
                  {highlightSearch(line)}
                </span>
              </span>
            );
          })
        )}
      </pre>
    </div>
  );
}

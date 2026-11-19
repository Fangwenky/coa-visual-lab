import React, { useState } from 'react';
import { LabFrame } from '../../components/DocBlocks';

interface DataItem {
  id: string;
  label: string;
  size: number; // bytes: 1, 2, 4, 8
  color: string;
}

// Slide P14 sequence: 字节、半字、双字、单字、半字、单字、字节、单字
const SLIDE_ITEMS: DataItem[] = [
  { id: 'd1', label: '字节1', size: 1, color: '#4ea1ff' },
  { id: 'd2', label: '半字1', size: 2, color: '#38d9a9' },
  { id: 'd3', label: '双字1', size: 8, color: '#ffb03b' },
  { id: 'd4', label: '单字1', size: 4, color: '#b197fc' },
  { id: 'd5', label: '半字2', size: 2, color: '#38d9a9' },
  { id: 'd6', label: '单字2', size: 4, color: '#b197fc' },
  { id: 'd7', label: '字节2', size: 1, color: '#4ea1ff' },
  { id: 'd8', label: '单字3', size: 4, color: '#b197fc' },
];

type AlignMode = 'packed' | 'wordStart' | 'aligned';

function layoutItems(mode: AlignMode) {
  const placed: { item: DataItem; start: number; crossesWord: boolean }[] = [];
  let cursor = 0;
  for (const item of SLIDE_ITEMS) {
    if (mode === 'wordStart') {
      if (cursor % 8 !== 0) cursor = Math.ceil(cursor / 8) * 8;
    } else if (mode === 'aligned') {
      if (cursor % item.size !== 0) cursor = Math.ceil(cursor / item.size) * item.size;
    }
    const startRow = Math.floor(cursor / 8);
    const endRow = Math.floor((cursor + item.size - 1) / 8);
    placed.push({ item, start: cursor, crossesWord: startRow !== endRow });
    cursor += item.size;
    if (mode === 'wordStart') {
      cursor = Math.ceil(cursor / 8) * 8;
    }
  }
  const totalWords = Math.ceil(cursor / 8);
  const usedBytes = SLIDE_ITEMS.reduce((s, it) => s + it.size, 0);
  const wastedBytes = totalWords * 8 - usedBytes;
  const crossCount = placed.filter((p) => p.crossesWord).length;
  return { placed, totalWords, usedBytes, wastedBytes, crossCount };
}

export default function EndianAlignLab() {
  const [tab, setTab] = useState<'endian' | 'align'>('endian');
  const [hexWord, setHexWord] = useState('11223344');
  const [alignMode, setAlignMode] = useState<AlignMode>('aligned');

  const padded = hexWord.replace(/[^0-9a-fA-F]/g, '').toUpperCase().padStart(8, '0').slice(0, 8);
  const bytes = [padded.slice(0, 2), padded.slice(2, 4), padded.slice(4, 6), padded.slice(6, 8)]; // B3, B2, B1, B0
  const alignRes = layoutItems(alignMode);

  // Build grid of totalWords x 8 bytes
  const grid: ({ label: string; color: string; isStart: boolean; crosses: boolean } | null)[][] = Array.from(
    { length: alignRes.totalWords },
    () => Array(8).fill(null)
  );
  for (const p of alignRes.placed) {
    for (let k = 0; k < p.item.size; k++) {
      const addr = p.start + k;
      grid[Math.floor(addr / 8)][addr % 8] = {
        label: k === 0 ? p.item.label : `${p.item.label}[${k}]`,
        color: p.item.color,
        isStart: k === 0,
        crosses: p.crossesWord,
      };
    }
  }

  return (
    <LabFrame
      id="lab-4-1"
      code="LAB-4.1"
      title="大端/小端字节序 & 64位存储字边界对齐排布对比器"
      desc="复现课件 P10 (0x11223344 大小端存放) 与 P14–P17 (三种主存数据存放方案的空间与访存周期权衡)。"
    >
      <div className="lab-toolbar">
        <button type="button" className={`lab-btn ${tab === 'endian' ? 'primary' : ''}`} onClick={() => setTab('endian')}>
          大端 vs 小端方案（P10）
        </button>
        <button type="button" className={`lab-btn ${tab === 'align' ? 'primary' : ''}`} onClick={() => setTab('align')}>
          三种数据存放与边界对齐（P14–P17）
        </button>
      </div>

      {tab === 'endian' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="lab-toolbar" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: 13 }}>
              32位字数据（Hex）：0x
              <input
                type="text"
                maxLength={8}
                className="lab-input"
                style={{ width: 112, marginLeft: 4 }}
                value={hexWord}
                onChange={(e) => setHexWord(e.target.value.replace(/[^0-9a-fA-F]/g, '').toUpperCase())}
              />
            </label>
            <button type="button" className="lab-btn" onClick={() => setHexWord('11223344')}>课件例 11223344</button>
            <button type="button" className="lab-btn" onClick={() => setHexWord('12345678')}>12345678</button>
            <button type="button" className="lab-btn" onClick={() => setHexWord('DEADBEEF')}>DEADBEEF</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: 14 }}>
            <div className="lab-subpanel">
              <strong style={{ color: '#4ea1ff', display: 'block', marginBottom: 8 }}>小端方案 Little-Endian（x86 / VAX）</strong>
              <p style={{ fontSize: 12.5, color: '#8ea5be', margin: '0 0 10px' }}>
                字地址 = 最低有效字节 B0 的地址（低位字节存低地址）
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }} className="mono">
                {[0, 1, 2, 3].map((offset) => (
                  <div key={offset} style={{ background: '#0e1722', border: '1px solid #2e4b6c', borderRadius: 4, padding: '8px 6px', textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#8ea5be' }}>地址 0{offset}H</div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: '#4ea1ff', margin: '4px 0' }}>{bytes[3 - offset]}</div>
                    <div style={{ fontSize: 10.5, color: '#38d9a9' }}>B{offset} {offset === 0 ? '(LSB)' : offset === 3 ? '(MSB)' : ''}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lab-subpanel">
              <strong style={{ color: '#ffb03b', display: 'block', marginBottom: 8 }}>大端方案 Big-Endian（IBM 370 / Motorola 68000 / 网络序）</strong>
              <p style={{ fontSize: 12.5, color: '#8ea5be', margin: '0 0 10px' }}>
                字地址 = 最高有效字节 B3 的地址（高位字节存低地址，符合阅读顺序）
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }} className="mono">
                {[0, 1, 2, 3].map((offset) => (
                  <div key={offset} style={{ background: '#0e1722', border: '1px solid #594426', borderRadius: 4, padding: '8px 6px', textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#8ea5be' }}>地址 0{offset}H</div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: '#ffb03b', margin: '4px 0' }}>{bytes[offset]}</div>
                    <div style={{ fontSize: 10.5, color: '#38d9a9' }}>B{3 - offset} {offset === 0 ? '(MSB)' : offset === 3 ? '(LSB)' : ''}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="lab-toolbar" style={{ marginBottom: 0 }}>
            <button type="button" className={`lab-btn ${alignMode === 'packed' ? 'primary' : ''}`} onClick={() => setAlignMode('packed')}>
              ① 紧凑不浪费（会跨存储字）
            </button>
            <button type="button" className={`lab-btn ${alignMode === 'wordStart' ? 'primary' : ''}`} onClick={() => setAlignMode('wordStart')}>
              ② 从存储字起始存放（极度浪费）
            </button>
            <button type="button" className={`lab-btn ${alignMode === 'aligned' ? 'primary' : ''}`} onClick={() => setAlignMode('aligned')}>
              ③ 边界对齐方案（课件最优折衷）
            </button>
          </div>

          <div className="lab-metric-grid">
            <div className="lab-metric">
              <div className="lab-metric-k">占用 64 位存储字行数</div>
              <div className="lab-metric-v">{alignRes.totalWords} 行 ({alignRes.totalWords * 8}B)</div>
            </div>
            <div className="lab-metric">
              <div className="lab-metric-k">有效数据总字节</div>
              <div className="lab-metric-v" style={{ color: '#4ea1ff' }}>{alignRes.usedBytes} B</div>
            </div>
            <div className="lab-metric">
              <div className="lab-metric-k">浪费空字节</div>
              <div className="lab-metric-v" style={{ color: '#ffb03b' }}>{alignRes.wastedBytes} B</div>
            </div>
            <div className="lab-metric">
              <div className="lab-metric-k">跨字数据数（需 2 次访存！）</div>
              <div className="lab-metric-v" style={{ color: alignRes.crossCount > 0 ? '#ff6b6b' : '#38d9a9' }}>
                {alignRes.crossCount} 个
              </div>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="mono" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 4, fontSize: 11.5 }}>
              <thead>
                <tr style={{ color: '#8ea5be' }}>
                  <th style={{ textAlign: 'left', width: 68 }}>存储字行</th>
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((col) => (
                    <th key={col}>+{col} (…{col.toString(2).padStart(3, '0')})</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grid.map((row, r) => (
                  <tr key={r}>
                    <td style={{ color: '#8ea5be' }}>行 {r} ({r * 8}~{r * 8 + 7})</td>
                    {row.map((cell, c) => (
                      <td
                        key={c}
                        style={{
                          padding: '6px 4px',
                          textAlign: 'center',
                          borderRadius: 3,
                          background: cell ? `${cell.color}28` : '#0c141d',
                          border: `1px solid ${cell ? (cell.crosses ? '#ff6b6b' : cell.color) : '#213244'}`,
                          color: cell ? '#ffffff' : '#4a5f75',
                          fontWeight: cell?.isStart ? 700 : 400,
                        }}
                      >
                        {cell ? `${cell.label}${cell.crosses && cell.isStart ? ' ⚠跨行' : ''}` : '空'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="lab-status-bar">
            边界对齐规则：双字(8B)地址末3位为 <code>000</code>，单字(4B)末2位为 <code>00</code>，半字(2B)末1位为 <code>0</code>。保证任意长度数据均在 <strong>1 个存取周期</strong>内完成读写，且浪费空间远小于方案②。
          </div>
        </div>
      )}
    </LabFrame>
  );
}

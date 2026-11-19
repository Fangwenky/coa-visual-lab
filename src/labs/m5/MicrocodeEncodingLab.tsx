import React, { useState } from 'react';
import { LabFrame } from '../../components/DocBlocks';

const SIGNALS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'] as const;

interface MicroInstrRow {
  id: string;
  active: string[];
  // Slide P47 encoding: [a, c, d, g] (4 direct bits) + Field1(2b: 00=无,01=b,10=i,11=j) + Field2(2b: 00=无,01=e,10=f,11=h)
  direct4: string;
  f1: string;
  f2: string;
}

const ROWS: MicroInstrRow[] = [
  { id: 'I1', active: ['a', 'b', 'c', 'd', 'e'], direct4: '1110', f1: '01', f2: '01' },
  { id: 'I2', active: ['a', 'd', 'f', 'g'], direct4: '1011', f1: '00', f2: '10' },
  { id: 'I3', active: ['b', 'h'], direct4: '0000', f1: '01', f2: '11' },
  { id: 'I4', active: ['c'], direct4: '0100', f1: '00', f2: '00' },
  { id: 'I5', active: ['c', 'e', 'g', 'i'], direct4: '0101', f1: '10', f2: '01' },
  { id: 'I6', active: ['a', 'h', 'j'], direct4: '1000', f1: '11', f2: '11' },
  { id: 'I7', active: ['c', 'd', 'h'], direct4: '0110', f1: '00', f2: '11' },
  { id: 'I8', active: ['a', 'b', 'h'], direct4: '1000', f1: '01', f2: '11' },
];

const F1_MAP: Record<string, string> = { '00': '无操作', '01': 'b', '10': 'i', '11': 'j' };
const F2_MAP: Record<string, string> = { '00': '无操作', '01': 'e', '10': 'f', '11': 'h' };

export default function MicrocodeEncodingLab() {
  const [selectedId, setSelectedId] = useState('I1');
  const cur = ROWS.find((r) => r.id === selectedId) || ROWS[0];

  const direct10 = SIGNALS.map((s) => (cur.active.includes(s) ? '1' : '0')).join('');
  const encoded8 = `${cur.direct4} ${cur.f1} ${cur.f2}`;

  return (
    <LabFrame
      id="lab-5-2"
      code="LAB-5.2"
      title="微指令字段直接编码压缩工作台（课件例题 6-20）"
      desc="复现课件 P46–P47：点击任意微指令 I1~I8，观察如何把互斥微命令 {b,i,j} 与 {e,f,h} 分别归入 2 位译码字段，把操作控制字段从 10 位压缩到 8 位并保持完整并行度！"
    >
      <div className="lab-toolbar">
        <span style={{ fontSize: 13, color: '#8ea5be' }}>选择微指令测试译码：</span>
        {ROWS.map((r) => (
          <button
            key={r.id}
            type="button"
            className={`lab-btn ${r.id === selectedId ? 'primary' : ''}`}
            onClick={() => setSelectedId(r.id)}
          >
            {r.id}
          </button>
        ))}
      </div>

      {/* 8x10 Compatibility Matrix */}
      <div style={{ overflowX: 'auto', marginBottom: 14 }}>
        <table className="mono" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'center' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2a3f56', color: '#8ea5be' }}>
              <th style={{ padding: '6px', textAlign: 'left' }}>微指令</th>
              {SIGNALS.map((s) => {
                const grp = ['b', 'i', 'j'].includes(s) ? '段1' : ['e', 'f', 'h'].includes(s) ? '段2' : '直控';
                const col = grp === '段1' ? '#ffb03b' : grp === '段2' ? '#38d9a9' : '#4ea1ff';
                return (
                  <th key={s} style={{ padding: '6px', color: col }}>
                    {s}
                    <div style={{ fontSize: 9.5, opacity: 0.85 }}>{grp}</div>
                  </th>
                );
              })}
              <th style={{ padding: '6px' }}>8位字段直接编码</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => {
              const isSel = r.id === selectedId;
              return (
                <tr
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  style={{
                    cursor: 'pointer',
                    background: isSel ? 'rgba(78, 161, 255, 0.18)' : 'transparent',
                    borderBottom: '1px solid #1c2c3e',
                  }}
                >
                  <td style={{ padding: '6px', textAlign: 'left', fontWeight: 700, color: isSel ? '#ffffff' : '#8ea5be' }}>{r.id}</td>
                  {SIGNALS.map((s) => {
                    const on = r.active.includes(s);
                    return (
                      <td key={s} style={{ padding: '6px', color: on ? '#38d9a9' : '#35495e', fontWeight: on ? 700 : 400 }}>
                        {on ? '✓' : '·'}
                      </td>
                    );
                  })}
                  <td style={{ padding: '6px', color: '#ffb03b', fontWeight: isSel ? 700 : 500 }}>
                    {r.direct4} {r.f1} {r.f2}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Live Decoder Schematic */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 12 }}>
        <div className="lab-subpanel mono">
          <span className="lab-label">直控字段 (4位：a, c, d, g)</span>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            {['a', 'c', 'd', 'g'].map((sig, i) => {
              const bit = cur.direct4[i];
              return (
                <div
                  key={sig}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '8px 4px',
                    borderRadius: 4,
                    background: bit === '1' ? 'rgba(78,161,255,0.24)' : '#0e1722',
                    border: `1px solid ${bit === '1' ? '#4ea1ff' : '#25384d'}`,
                  }}
                >
                  <div style={{ fontSize: 11, color: '#8ea5be' }}>{sig}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: bit === '1' ? '#ffffff' : '#586d84' }}>{bit}</div>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 11.5, color: '#8ea5be', marginTop: 8 }}>
            与其他信号大多兼容，不译码直接输出
          </div>
        </div>

        <div className="lab-subpanel mono">
          <span className="lab-label">字段 1 (2位 → 2:4 译码器)</span>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#ffb03b', margin: '6px 0' }}>
            输入 {cur.f1} ──▶ 输出：{F1_MAP[cur.f1]}
          </div>
          <div style={{ fontSize: 11.5, color: '#8ea5be' }}>
            互斥集合：b, i, j 从未在同一微指令中共存（00 留作无操作，01=b, 10=i, 11=j）
          </div>
        </div>

        <div className="lab-subpanel mono">
          <span className="lab-label">字段 2 (2位 → 2:4 译码器)</span>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#38d9a9', margin: '6px 0' }}>
            输入 {cur.f2} ──▶ 输出：{F2_MAP[cur.f2]}
          </div>
          <div style={{ fontSize: 11.5, color: '#8ea5be' }}>
            互斥集合：e, f, h 从未在同一微指令中共存（00 留作无操作，01=e, 10=f, 11=h）
          </div>
        </div>
      </div>

      <div className="lab-status-bar mono" style={{ fontSize: 12.8 }}>
        当前 {cur.id}：直接控制需 10 位 ({direct10}) → 字段直接编码仅需 <strong>8 位 ({encoded8})</strong>，并行发出微命令：
        <strong style={{ color: '#38d9a9', marginLeft: 6 }}>{cur.active.join(', ')}</strong>
      </div>
    </LabFrame>
  );
}

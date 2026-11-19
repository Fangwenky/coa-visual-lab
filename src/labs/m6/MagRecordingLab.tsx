import React, { useState } from 'react';
import { LabFrame } from '../../components/DocBlocks';

interface WaveTrack {
  id: string;
  name: string;
  rule: string;
  color: string;
  // Each bit has 2 half-periods (left half, right half), values in {-1, 0, +1}
  samples: number[];
}

function generateWaves(bitStr: string): WaveTrack[] {
  const bits = bitStr.split('').map((c) => (c === '1' ? 1 : 0));

  // 1. RZ: 1 -> +1 then 0; 0 -> -1 then 0
  const rz: number[] = [];
  bits.forEach((b) => {
    rz.push(b === 1 ? 1 : -1, 0);
  });

  // 2. NRZ: 1 -> +1, +1; 0 -> -1, -1
  const nrz: number[] = [];
  bits.forEach((b) => {
    nrz.push(b === 1 ? 1 : -1, b === 1 ? 1 : -1);
  });

  // 3. NRZ-1: flip at start of bit if bit==1, hold if bit==0
  const nrz1: number[] = [];
  let cur = -1;
  bits.forEach((b) => {
    if (b === 1) cur = -cur;
    nrz1.push(cur, cur);
  });

  // 4. PE (Phase Encoding / Manchester): 1 -> -1 then +1 (rising at mid); 0 -> +1 then -1 (falling at mid)
  const pe: number[] = [];
  bits.forEach((b) => {
    if (b === 1) pe.push(-1, 1);
    else pe.push(1, -1);
  });

  // 5. FM (Frequency Modulation): flip at every bit boundary; if bit==1, also flip at mid
  const fm: number[] = [];
  cur = -1;
  bits.forEach((b) => {
    cur = -cur; // boundary flip
    const first = cur;
    if (b === 1) cur = -cur; // mid flip
    fm.push(first, cur);
  });

  // 6. MFM (Modified FM / Miller): flip at mid if bit==1; flip at boundary between two consecutive 0s
  const mfm: number[] = [];
  cur = -1;
  bits.forEach((b, i) => {
    if (i > 0 && b === 0 && bits[i - 1] === 0) cur = -cur; // boundary flip for 00
    const first = cur;
    if (b === 1) cur = -cur; // mid flip for 1
    mfm.push(first, cur);
  });

  // 7. M2FM (Slide P42): 1 flips at mid; isolated 0 no flip; consecutive 0s flip at boundary of 2nd zero, then every 2 zeros
  const m2fm: number[] = [];
  cur = -1;
  let zeroRun = 0;
  bits.forEach((b) => {
    if (b === 0) {
      zeroRun++;
      if (zeroRun >= 2 && zeroRun % 2 === 0) {
        cur = -cur; // flip at boundary of 2nd, 4th... zero
      }
      m2fm.push(cur, cur);
    } else {
      zeroRun = 0;
      const first = cur;
      cur = -cur; // flip at mid
      m2fm.push(first, cur);
    }
  });

  return [
    { id: 'rz', name: 'RZ 归零制', rule: '1 正脉冲回零，0 负脉冲回零（密度低）', color: '#8ea5be', samples: rz },
    { id: 'nrz', name: 'NRZ 不归零制', rule: '1 高电平，0 低电平，见变就翻', color: '#4ea1ff', samples: nrz },
    { id: 'nrz1', name: 'NRZ-1 见1就翻', rule: '遇 1 翻转，遇 0 不变（所有编码写磁层的基础）', color: '#74c0fc', samples: nrz1 },
    { id: 'pe', name: 'PE 调相制', rule: '1 位中由负变正，0 位中由正变负（自同步能力强）', color: '#b197fc', samples: pe },
    { id: 'fm', name: 'FM 调频制(倍频)', rule: '位边界必翻；1 在位中再翻一次（间距 0.5T0 / T0）', color: '#ffb03b', samples: fm },
    { id: 'mfm', name: 'MFM 改进调频(密勒码)', rule: '1 位中翻；仅连续两个 0 在边界翻（间距 T0/1.5T0/2T0）', color: '#38d9a9', samples: mfm },
    { id: 'm2fm', name: 'M²FM 四频制', rule: '1 位中翻；连续0仅每两个0的边界翻一次（间距至2.5T0）', color: '#ff8787', samples: m2fm },
  ];
}

function buildSvgPolyline(samples: number[], cellW: number, yHigh: number, yMid: number, yLow: number) {
  const halfW = cellW / 2;
  const pts: string[] = [];
  const yOf = (v: number) => (v === 1 ? yHigh : v === -1 ? yLow : yMid);
  samples.forEach((v, idx) => {
    const x0 = idx * halfW;
    const x1 = (idx + 1) * halfW;
    const y = yOf(v);
    if (idx === 0) {
      pts.push(`${x0},${y}`);
    } else {
      const prevY = yOf(samples[idx - 1]);
      if (prevY !== y) pts.push(`${x0},${y}`);
    }
    pts.push(`${x1},${y}`);
  });
  return pts.join(' ');
}

export default function MagRecordingLab() {
  // Slide P40 & P43 example: 0 1 1 1 1 1 0 0 0
  const [bitStr, setBitStr] = useState('011111000');
  const clean = (bitStr.replace(/[^01]/g, '') || '0').slice(0, 14);
  const tracks = generateWaves(clean);
  const cellW = 54;
  const totalW = clean.length * cellW;

  return (
    <LabFrame
      id="lab-6-2"
      code="LAB-6.2"
      title="数字磁记录 7 种编码方式实时波形示波器"
      desc="默认载入课件 P40 & P43 经典比特流 011111000。自定义任意 0/1 序列，实时对比 7 种磁记录写电流翻转规律与自同步能力！"
    >
      <div className="lab-toolbar">
        <label style={{ fontSize: 13 }}>
          二进制数据序列（最多14位）：
          <input
            type="text"
            className="lab-input"
            style={{ width: 170, marginLeft: 8, letterSpacing: 2 }}
            value={bitStr}
            onChange={(e) => setBitStr(e.target.value.replace(/[^01]/g, '').slice(0, 14))}
          />
        </label>
        <button type="button" className="lab-btn" onClick={() => setBitStr('011111000')}>课件原序列 011111000</button>
        <button type="button" className="lab-btn" onClick={() => setBitStr('101100010')}>101100010</button>
        <button type="button" className="lab-btn" onClick={() => setBitStr('00001111')}>全0与全1测试</button>
      </div>

      <div className="lab-subpanel" style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: Math.max(540, totalW + 190) }}>
          {/* Bit Header */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ width: 175, flexShrink: 0, fontSize: 12, color: '#8ea5be' }} className="mono">数据序列 (位周期 T0)</div>
            <svg width={totalW} height={24}>
              {clean.split('').map((b, i) => (
                <g key={i}>
                  <rect x={i * cellW} y={0} width={cellW} height={22} fill={b === '1' ? 'rgba(78,161,255,0.22)' : 'rgba(255,255,255,0.03)'} stroke="#2a3f56" />
                  <text x={i * cellW + cellW / 2} y={16} textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="700" fontFamily="monospace">
                    {b}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          {/* 7 Waveform Tracks */}
          {tracks.map((tr) => (
            <div key={tr.id} style={{ display: 'flex', alignItems: 'center', padding: '5px 0', borderTop: '1px solid #1c2c3e' }}>
              <div style={{ width: 175, flexShrink: 0, paddingRight: 10 }}>
                <div className="mono" style={{ fontSize: 12.5, fontWeight: 700, color: tr.color }}>{tr.name}</div>
                <div style={{ fontSize: 10.5, color: '#8ea5be', lineHeight: 1.3 }}>{tr.rule}</div>
              </div>
              <svg width={totalW} height={38} style={{ overflow: 'visible' }}>
                {/* Zero baseline */}
                <line x1={0} y1={19} x2={totalW} y2={19} stroke="#24364a" strokeDasharray="2 3" />
                {/* Bit boundaries */}
                {Array.from({ length: clean.length + 1 }, (_, i) => (
                  <line key={i} x1={i * cellW} y1={0} x2={i * cellW} y2={38} stroke="#24364a" />
                ))}
                {/* Waveform */}
                <polyline
                  fill="none"
                  stroke={tr.color}
                  strokeWidth="2.4"
                  strokeLinejoin="miter"
                  points={buildSvgPolyline(tr.samples, cellW, 5, 19, 33)}
                />
              </svg>
            </div>
          ))}
        </div>
      </div>

      <div className="lab-status-bar">
        记忆秘诀：PE 和 FM <strong>每位必有翻转</strong>（抗连 0 失步，自同步强，但最高翻转频率达 2/T₀）；<strong>MFM 改进调频</strong>去掉了 1 和孤立 0 的冗余边界翻转，把最小翻转间距扩大了一倍（从 0.5T₀ 变为 T₀），记录密度直接翻倍！
      </div>
    </LabFrame>
  );
}

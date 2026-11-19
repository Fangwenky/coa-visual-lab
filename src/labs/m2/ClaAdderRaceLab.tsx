import React, { useEffect, useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { LabFrame } from '../../components/DocBlocks';

export default function ClaAdderRaceLab() {
  const [aHex, setAHex] = useState('0FFF');
  const [bHex, setBHex] = useState('0001');
  const [c0, setC0] = useState(0);
  const [timeTy, setTimeTy] = useState(0);
  const [running, setRunning] = useState(false);

  const aVal = parseInt(aHex || '0', 16) & 0xffff;
  const bVal = parseInt(bHex || '0', 16) & 0xffff;
  const sum = aVal + bVal + c0;

  // Compute bit-by-bit Gi, Pi, Ci (bits 1..16, index 0..15)
  const bits = Array.from({ length: 16 }, (_, i) => {
    const ai = (aVal >> i) & 1;
    const bi = (bVal >> i) & 1;
    return { i, ai, bi, g: ai & bi, p: ai ^ bi };
  });

  const carries: number[] = [c0];
  for (let i = 0; i < 16; i++) {
    carries.push(bits[i].g | (bits[i].p & carries[i]));
  }

  useEffect(() => {
    if (!running) return;
    if (timeTy >= 32) {
      setRunning(false);
      return;
    }
    const id = setTimeout(() => setTimeTy((t) => Math.min(32, t + 1)), 140);
    return () => clearTimeout(id);
  }, [running, timeTy]);

  // Ready times (ignoring Gi/Pi generation time, following Slides P41-P45)
  // Ripple carry: C_k ready at 2*k ty (k=1..16 => 2..32 ty)
  // Single-level 4-bit CLA (group-parallel, inter-group ripple):
  //   Group 0 (C1..C4): 2 ty; Group 1 (C5..C8): 4 ty; Group 2 (C9..C12): 6 ty; Group 3 (C13..C16): 8 ty
  // Two-level 16-bit CLA (intra-group parallel + inter-group parallel via 74182):
  //   2 ty: C1..C3 + all G*, P*; 4 ty: C4, C8, C12, C16; 6 ty: C5..C7, C9..C11, C13..C15
  const readyTimeRipple = (k: number) => 2 * k;
  const readyTimeCla1 = (k: number) => Math.ceil(k / 4) * 2;
  const readyTimeCla2 = (k: number) => {
    if (k <= 3) return 2;
    if (k % 4 === 0) return 4;
    return 6;
  };

  const architectures = [
    { name: '① 16位行波进位加法器 (RCA)', totalTy: 32, readyFn: readyTimeRipple, color: '#ff6b6b', desc: '全串行进位：2n·ty = 32 ty' },
    { name: '② 单级先行进位 (4×4位CLA, 组间串行)', totalTy: 8, readyFn: readyTimeCla1, color: '#ffb03b', desc: '组内并行、组间串行：4×2ty = 8 ty' },
    { name: '③ 两级先行进位 (4×BCLA + 74182)', totalTy: 6, readyFn: readyTimeCla2, color: '#38d9a9', desc: '组内并行、组间并行：2+2+2 = 6 ty' },
  ];

  return (
    <LabFrame
      id="lab-2-3"
      code="LAB-2.3"
      title="16位并行加法器进位延迟竞赛：行波进位 vs 单级/两级超前进位 (CLA)"
      desc="复现课件 P40–P45（不计 Gi/Pi 形成时间，每级进位延迟 2ty）。观察最坏进位链 0FFFH + 0001H 在三种架构下的传播速度差异！"
    >
      <div className="lab-toolbar">
        <label style={{ fontSize: 13 }}>
          A (Hex)：
          <input
            type="text"
            maxLength={4}
            className="lab-input"
            style={{ width: 76, marginLeft: 6 }}
            value={aHex}
            onChange={(e) => setAHex(e.target.value.replace(/[^0-9a-fA-F]/g, '').toUpperCase())}
          />
        </label>
        <label style={{ fontSize: 13 }}>
          B (Hex)：
          <input
            type="text"
            maxLength={4}
            className="lab-input"
            style={{ width: 76, marginLeft: 6 }}
            value={bHex}
            onChange={(e) => setBHex(e.target.value.replace(/[^0-9a-fA-F]/g, '').toUpperCase())}
          />
        </label>
        <button type="button" className={`lab-btn ${c0 ? 'active' : ''}`} onClick={() => setC0((v) => 1 - v)}>
          C0 = {c0}
        </button>
        <button
          type="button"
          className="lab-btn primary"
          onClick={() => {
            setTimeTy(0);
            setRunning(true);
          }}
        >
          <Play size={14} /> 开始延迟竞赛
        </button>
        <button
          type="button"
          className="lab-btn"
          onClick={() => {
            setRunning(false);
            setTimeTy(0);
          }}
        >
          <RotateCcw size={14} /> 归零
        </button>
        <span className="mono" style={{ marginLeft: 'auto', fontSize: 13, color: '#4ea1ff' }}>
          当前门延迟时刻：t = {timeTy} ty ｜ 和 = 0x{(sum & 0xffff).toString(16).toUpperCase().padStart(4, '0')} (C16={carries[16]})
        </span>
      </div>

      {/* Slider for manual scrubbing */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span className="mono" style={{ fontSize: 12, color: '#8ea5be' }}>手动拖动时间轴 (0~32 ty):</span>
        <input
          type="range"
          min={0}
          max={32}
          value={timeTy}
          onChange={(e) => {
            setRunning(false);
            setTimeTy(Number(e.target.value));
          }}
          style={{ flex: 1 }}
        />
      </div>

      {/* 3 Architecture tracks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {architectures.map((arch) => {
          const done = timeTy >= arch.totalTy;
          return (
            <div key={arch.name} className="lab-subpanel">
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                <strong style={{ color: arch.color, fontSize: 13.5 }}>{arch.name}</strong>
                <span className="mono" style={{ fontSize: 12, color: done ? '#38d9a9' : '#8ea5be' }}>
                  {arch.desc} {done ? '· ✓ 已全部稳定！' : `· 进行中 (${Math.min(100, Math.round((timeTy / arch.totalTy) * 100))}%)`}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(16, minmax(0, 1fr))', gap: 4 }}>
                {[...Array(16)].map((_, idx) => {
                  const k = 16 - idx; // C16 on left down to C1 on right
                  const isReady = timeTy >= arch.readyFn(k);
                  const val = carries[k];
                  return (
                    <div
                      key={k}
                      className="mono"
                      style={{
                        textAlign: 'center',
                        padding: '5px 2px',
                        borderRadius: 4,
                        fontSize: 11,
                        border: `1px solid ${isReady ? arch.color : '#25384d'}`,
                        background: isReady
                          ? val
                            ? 'rgba(56, 217, 169, 0.22)'
                            : 'rgba(78, 161, 255, 0.12)'
                          : '#0b121a',
                        color: isReady ? '#ffffff' : '#586d84',
                      }}
                    >
                      <div style={{ fontSize: 9.5, opacity: 0.78 }}>C{k}</div>
                      <div style={{ fontWeight: 700 }}>{isReady ? val : '?'}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="lab-status-bar">
        关键理解：1位全加器中，<strong>进位产生函数 Gᵢ = AᵢBᵢ</strong>（本位直接产生进位），<strong>进位传递函数 Pᵢ = Aᵢ⊕Bᵢ</strong>（把低位进位传向高位）。两级先行进位通过 74182 在 4ty 时刻同时算出组间进位 C₄, C₈, C₁₂, C₁₆，仅 6ty 即可完成全部 16 位进位，比行波进位（32ty）提速超过 5 倍！
      </div>
    </LabFrame>
  );
}

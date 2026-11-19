import React, { useState } from 'react';
import { LabFrame } from '../../components/DocBlocks';

export default function DramRefreshLab() {
  const [rows, setRows] = useState(32); // Slide P24: 32x32 matrix -> 32 rows
  const [maxIntervalUs, setMaxIntervalUs] = useState(2000); // 2 ms = 2000 us
  const [tmUs, setTmUs] = useState(0.5); // 500 ns = 0.5 us

  const totalCycles = Math.floor(maxIntervalUs / tmUs);
  const concDeadUs = rows * tmUs;
  const concRwCycles = Math.max(0, totalCycles - rows);
  const concDeadPct = ((concDeadUs / maxIntervalUs) * 100).toFixed(2);

  const distSysCycleUs = tmUs * 2;
  const distFullRefreshUs = rows * distSysCycleUs;

  const asyncStepUs = maxIntervalUs / rows;

  return (
    <LabFrame
      id="lab-4-2"
      code="LAB-4.2"
      title="DRAM 三种刷新方式时序示波器（集中 vs 分散 vs 异步）"
      desc="默认参数与课件 P24–P26 完全一致（32×32 矩阵、最大刷新间隔 2ms、存取周期 0.5μs）。调节参数实时对比死区时间、刷新间隔与系统访存代价。"
    >
      <div className="lab-toolbar">
        <label style={{ fontSize: 13 }}>
          矩阵行数：
          <select className="lab-select" style={{ marginLeft: 6 }} value={rows} onChange={(e) => setRows(Number(e.target.value))}>
            <option value={32}>32 行 (1K=32×32, 课件例)</option>
            <option value={64}>64 行 (4K=64×64)</option>
            <option value={128}>128 行 (16K=128×128)</option>
            <option value={256}>256 行 (64K=256×256)</option>
          </select>
        </label>
        <label style={{ fontSize: 13 }}>
          最大刷新间隔 (ms)：
          <select
            className="lab-select"
            style={{ marginLeft: 6 }}
            value={maxIntervalUs}
            onChange={(e) => setMaxIntervalUs(Number(e.target.value))}
          >
            <option value={2000}>2 ms (课件默认)</option>
            <option value={4000}>4 ms</option>
            <option value={8000}>8 ms</option>
          </select>
        </label>
        <label style={{ fontSize: 13 }}>
          存取周期 Tm (μs)：
          <select className="lab-select" style={{ marginLeft: 6 }} value={tmUs} onChange={(e) => setTmUs(Number(e.target.value))}>
            <option value={0.5}>0.5 μs (500ns, 课件默认)</option>
            <option value={0.25}>0.25 μs (250ns)</option>
            <option value={1.0}>1.0 μs</option>
          </select>
        </label>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* 1. Centralized */}
        <div className="lab-subpanel">
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
            <strong style={{ color: '#ff6b6b' }}>① 集中刷新方式（存在连续“死区”）</strong>
            <span className="mono" style={{ fontSize: 12, color: '#e6eef7' }}>
              总周期={totalCycles} ｜ 读写={concRwCycles}周期 ｜ 连续死区={rows}周期 = <strong style={{ color: '#ff6b6b' }}>{concDeadUs} μs</strong> ({concDeadPct}%)
            </span>
          </div>
          <div style={{ display: 'flex', height: 28, borderRadius: 4, overflow: 'hidden', border: '1px solid #2a3f56' }} className="mono">
            <div
              style={{
                flex: 1,
                background: 'rgba(78, 161, 255, 0.24)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                color: '#cfe4ff',
              }}
            >
              CPU 正常读/写 ({maxIntervalUs - concDeadUs} μs · {concRwCycles} 周期)
            </div>
            <div
              style={{
                width: `${Math.max(14, (concDeadUs / maxIntervalUs) * 100 * 8)}%`,
                background: '#c53030',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11.5,
                color: '#fff',
                fontWeight: 700,
              }}
            >
              死区 {concDeadUs}μs
            </div>
          </div>
        </div>

        {/* 2. Distributed */}
        <div className="lab-subpanel">
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
            <strong style={{ color: '#ffb03b' }}>② 分散刷新方式（无死区，但系统存取周期翻倍！）</strong>
            <span className="mono" style={{ fontSize: 12, color: '#e6eef7' }}>
              系统周期={distSysCycleUs} μs (2×Tm) ｜ 刷完一遍仅用 <strong style={{ color: '#ffb03b' }}>{distFullRefreshUs} μs</strong>（过度刷新！）
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2, height: 28 }} className="mono">
            {[...Array(12)].map((_, i) => (
              <div key={i} style={{ display: 'flex', borderRadius: 2, overflow: 'hidden', border: '1px solid #2a3f56' }}>
                <div style={{ flex: 1, background: 'rgba(78, 161, 255, 0.35)', fontSize: 10, display: 'grid', placeItems: 'center' }}>读</div>
                <div style={{ flex: 1, background: 'rgba(255, 176, 59, 0.45)', fontSize: 10, display: 'grid', placeItems: 'center', color: '#fff' }}>刷</div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Asynchronous */}
        <div className="lab-subpanel">
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
            <strong style={{ color: '#38d9a9' }}>③ 异步刷新方式（现代最实用：充分利用最大间隔，单次死区极短）</strong>
            <span className="mono" style={{ fontSize: 12, color: '#e6eef7' }}>
              相邻两行刷新间隔 = {maxIntervalUs} / {rows} = <strong style={{ color: '#38d9a9' }}>{asyncStepUs.toFixed(2)} μs</strong> ｜ 单次死区仅 {tmUs} μs
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 3, height: 28 }} className="mono">
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{ display: 'flex', borderRadius: 2, overflow: 'hidden', border: '1px solid #2a3f56' }}>
                <div style={{ flex: 6, background: 'rgba(78, 161, 255, 0.22)', fontSize: 10, display: 'grid', placeItems: 'center' }}>
                  读写 ({(asyncStepUs - tmUs).toFixed(1)}μs)
                </div>
                <div style={{ flex: 1, background: '#0e8265', fontSize: 9.5, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700 }}>
                  刷
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="lab-status-bar">
        要点提示（课件 P27）：① DRAM 刷新按<strong>行</strong>进行，只需行地址（RAS），对 CPU 透明；② 刷新是定时的，与破坏性读出后的随机“重写”不同；③ 所有芯片并行同时刷新，因此刷新时间按<strong>单个芯片行数</strong>计算！
      </div>
    </LabFrame>
  );
}

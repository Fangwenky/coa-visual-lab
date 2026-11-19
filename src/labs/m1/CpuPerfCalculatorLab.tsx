import React, { useState } from 'react';
import { LabFrame } from '../../components/DocBlocks';

export default function CpuPerfCalculatorLab() {
  const [tab, setTab] = useState<'seq' | 'compare'>('seq');

  // Sequence CPI simulator (from Slide P31)
  const [cpiA, setCpiA] = useState(1);
  const [cpiB, setCpiB] = useState(2);
  const [cpiC, setCpiC] = useState(3);
  const [s1, setS1] = useState([2, 1, 2]);
  const [s2, setS2] = useState([4, 1, 1]);
  const [freqGhz, setFreqGhz] = useState(2.0);

  const calcSeq = (counts: number[]) => {
    const ic = counts[0] + counts[1] + counts[2];
    const cycles = counts[0] * cpiA + counts[1] * cpiB + counts[2] * cpiC;
    const cpi = ic > 0 ? cycles / ic : 0;
    const ipc = cpi > 0 ? 1 / cpi : 0;
    const mips = cpi > 0 ? (freqGhz * 1000) / cpi : 0;
    const timeNs = freqGhz > 0 ? cycles / freqGhz : 0;
    return { ic, cycles, cpi, ipc, mips, timeNs };
  };

  const r1 = calcSeq(s1);
  const r2 = calcSeq(s2);

  // Two-machine comparison (from Slide P33)
  const [periodA, setPeriodA] = useState(250); // ps
  const [machineCpiA, setMachineCpiA] = useState(2.0);
  const [periodB, setPeriodB] = useState(500); // ps
  const [machineCpiB, setMachineCpiB] = useState(1.2);

  const perInstA = periodA * machineCpiA;
  const perInstB = periodB * machineCpiB;
  const faster = perInstA < perInstB ? 'A' : perInstB < perInstA ? 'B' : '相等';
  const speedup =
    perInstA === perInstB ? 1 : perInstA < perInstB ? perInstB / perInstA : perInstA / perInstB;

  return (
    <LabFrame
      id="lab-1-2"
      code="LAB-1.2"
      title="CPU 性能公式、平均 CPI 与双机加速比实验台"
      desc="内置课件 P31 编译代码序列对比与 P33 计算机 A/B 对比原题，直观理解为什么指令条数多不代表更慢、主频高不代表更快。"
    >
      <div className="lab-toolbar">
        <button
          type="button"
          className={`lab-btn ${tab === 'seq' ? 'primary' : ''}`}
          onClick={() => setTab('seq')}
        >
          编译序列 CPI / MIPS 对比（P31）
        </button>
        <button
          type="button"
          className={`lab-btn ${tab === 'compare' ? 'primary' : ''}`}
          onClick={() => setTab('compare')}
        >
          双机 CPU 执行时间与加速比（P33）
        </button>
      </div>

      {tab === 'seq' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="lab-subpanel">
            <span className="lab-label">硬件基础参数（主频与三类指令各自的 CPI）</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', fontSize: 13 }}>
              <label>
                主频 (GHz)：
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  className="lab-input"
                  style={{ width: 72, marginLeft: 6 }}
                  value={freqGhz}
                  onChange={(e) => setFreqGhz(Math.max(0.1, Number(e.target.value) || 1))}
                />
              </label>
              <label>
                A类 CPI：
                <input
                  type="number"
                  min="1"
                  className="lab-input"
                  style={{ width: 58, marginLeft: 6 }}
                  value={cpiA}
                  onChange={(e) => setCpiA(Math.max(1, Number(e.target.value) || 1))}
                />
              </label>
              <label>
                B类 CPI：
                <input
                  type="number"
                  min="1"
                  className="lab-input"
                  style={{ width: 58, marginLeft: 6 }}
                  value={cpiB}
                  onChange={(e) => setCpiB(Math.max(1, Number(e.target.value) || 1))}
                />
              </label>
              <label>
                C类 CPI：
                <input
                  type="number"
                  min="1"
                  className="lab-input"
                  style={{ width: 58, marginLeft: 6 }}
                  value={cpiC}
                  onChange={(e) => setCpiC(Math.max(1, Number(e.target.value) || 1))}
                />
              </label>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 14 }}>
            {[
              { name: '代码序列 1', counts: s1, setter: setS1, res: r1, color: '#4ea1ff' },
              { name: '代码序列 2', counts: s2, setter: setS2, res: r2, color: '#38d9a9' },
            ].map((item) => (
              <div key={item.name} className="lab-subpanel">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <strong style={{ color: item.color }}>{item.name}</strong>
                  <span className="mono" style={{ fontSize: 12, color: '#8ea5be' }}>
                    IC = {item.res.ic} 条指令
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                  {['A', 'B', 'C'].map((cls, idx) => (
                    <label key={cls} style={{ fontSize: 12.5, color: '#8ea5be' }}>
                      {cls}类条数
                      <input
                        type="number"
                        min="0"
                        className="lab-input"
                        style={{ width: 58, display: 'block', marginTop: 4 }}
                        value={item.counts[idx]}
                        onChange={(e) => {
                          const next = [...item.counts];
                          next[idx] = Math.max(0, Number(e.target.value) || 0);
                          item.setter(next);
                        }}
                      />
                    </label>
                  ))}
                </div>
                {/* Cycle breakdown bar */}
                <div style={{ height: 18, borderRadius: 4, overflow: 'hidden', display: 'flex', background: '#0b121a', marginBottom: 10 }}>
                  {[
                    { c: item.counts[0] * cpiA, bg: '#4ea1ff' },
                    { c: item.counts[1] * cpiB, bg: '#ffb03b' },
                    { c: item.counts[2] * cpiC, bg: '#ff6b6b' },
                  ].map((seg, i) => (
                    <div
                      key={i}
                      style={{
                        width: item.res.cycles > 0 ? `${(seg.c / item.res.cycles) * 100}%` : '0%',
                        background: seg.bg,
                      }}
                    />
                  ))}
                </div>
                <div className="lab-metric-grid">
                  <div className="lab-metric" style={{ background: '#0e1722' }}>
                    <div className="lab-metric-k">总时钟周期数</div>
                    <div className="lab-metric-v" style={{ color: item.color }}>{item.res.cycles}</div>
                  </div>
                  <div className="lab-metric" style={{ background: '#0e1722' }}>
                    <div className="lab-metric-k">平均 CPI</div>
                    <div className="lab-metric-v">{item.res.cpi.toFixed(2)}</div>
                  </div>
                  <div className="lab-metric" style={{ background: '#0e1722' }}>
                    <div className="lab-metric-k">执行时间</div>
                    <div className="lab-metric-v" style={{ fontSize: 15 }}>{item.res.timeNs.toFixed(2)} ns</div>
                  </div>
                  <div className="lab-metric" style={{ background: '#0e1722' }}>
                    <div className="lab-metric-k">MIPS</div>
                    <div className="lab-metric-v" style={{ fontSize: 15 }}>{item.res.mips.toFixed(0)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lab-status-bar">
            结论：
            {r2.cycles < r1.cycles
              ? `序列 2 虽然指令数（${r2.ic}）比序列 1（${r1.ic}）更多，但总时钟周期数更少（${r2.cycles} < ${r1.cycles}），因此序列 2 执行更快！这证明仅看指令条数 IC 或仅看 CPI 都不能片面评判性能。`
              : r1.cycles < r2.cycles
              ? `序列 1 总时钟周期数更少（${r1.cycles} < ${r2.cycles}），执行更快。`
              : `两个序列总时钟周期数相同（${r1.cycles}），执行时间相等。`}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
            <div className="lab-subpanel">
              <strong style={{ color: '#4ea1ff', display: 'block', marginBottom: 10 }}>计算机 A（默认 250ps, CPI=2.0）</strong>
              <div style={{ display: 'flex', gap: 12 }}>
                <label style={{ fontSize: 12.5, color: '#8ea5be' }}>
                  时钟周期 (ps)
                  <input
                    type="number"
                    className="lab-input"
                    style={{ width: 96, display: 'block', marginTop: 4 }}
                    value={periodA}
                    onChange={(e) => setPeriodA(Math.max(1, Number(e.target.value) || 1))}
                  />
                </label>
                <label style={{ fontSize: 12.5, color: '#8ea5be' }}>
                  平均 CPI
                  <input
                    type="number"
                    step="0.1"
                    className="lab-input"
                    style={{ width: 84, display: 'block', marginTop: 4 }}
                    value={machineCpiA}
                    onChange={(e) => setMachineCpiA(Math.max(0.1, Number(e.target.value) || 0.1))}
                  />
                </label>
              </div>
              <div className="mono" style={{ marginTop: 10, fontSize: 13, color: '#e6eef7' }}>
                主频 = {(1000 / periodA).toFixed(2)} GHz ｜ 单条指令耗时 = {perInstA.toFixed(0)} ps
              </div>
            </div>

            <div className="lab-subpanel">
              <strong style={{ color: '#38d9a9', display: 'block', marginBottom: 10 }}>计算机 B（默认 500ps, CPI=1.2）</strong>
              <div style={{ display: 'flex', gap: 12 }}>
                <label style={{ fontSize: 12.5, color: '#8ea5be' }}>
                  时钟周期 (ps)
                  <input
                    type="number"
                    className="lab-input"
                    style={{ width: 96, display: 'block', marginTop: 4 }}
                    value={periodB}
                    onChange={(e) => setPeriodB(Math.max(1, Number(e.target.value) || 1))}
                  />
                </label>
                <label style={{ fontSize: 12.5, color: '#8ea5be' }}>
                  平均 CPI
                  <input
                    type="number"
                    step="0.1"
                    className="lab-input"
                    style={{ width: 84, display: 'block', marginTop: 4 }}
                    value={machineCpiB}
                    onChange={(e) => setMachineCpiB(Math.max(0.1, Number(e.target.value) || 0.1))}
                  />
                </label>
              </div>
              <div className="mono" style={{ marginTop: 10, fontSize: 13, color: '#e6eef7' }}>
                主频 = {(1000 / periodB).toFixed(2)} GHz ｜ 单条指令耗时 = {perInstB.toFixed(0)} ps
              </div>
            </div>
          </div>

          <div className="lab-status-bar">
            相同 ISA（指令数 IC 相同）下：CPU时间_A = I × {perInstA.toFixed(0)} ps，CPU时间_B = I × {perInstB.toFixed(0)} ps。
            <strong style={{ color: '#38d9a9', marginLeft: 8 }}>
              {faster === '相等' ? '两台机器速度相同（1.00×）' : `计算机 ${faster} 更快，速度是另一台的 ${speedup.toFixed(2)} 倍`}
            </strong>
          </div>
        </div>
      )}
    </LabFrame>
  );
}

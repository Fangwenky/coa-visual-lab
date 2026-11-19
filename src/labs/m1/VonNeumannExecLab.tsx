import React, { useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, StepForward, StepBack } from 'lucide-react';
import { LabFrame } from '../../components/DocBlocks';

interface StepSnapshot {
  title: string;
  pc: string;
  ir: string;
  mdr: string;
  acc: string;
  mem8: string;
  activeMem: string[];
  activeBus: 'none' | 'mem-to-cu' | 'mem-to-mdr' | 'mdr-to-acc' | 'alu-op' | 'acc-to-mem';
  explain: string;
}

export default function VonNeumannExecLab() {
  const [a, setA] = useState(12);
  const [b, setB] = useState(8);
  const [c, setC] = useState(5);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  const steps: StepSnapshot[] = [
    {
      title: '初始状态：程序与数据已存入主存（存储程序原理）',
      pc: '000',
      ir: '—',
      mdr: '—',
      acc: '0',
      mem8: '空',
      activeMem: ['000', '001', '002', '003', '004', '005', '006', '007'],
      activeBus: 'none',
      explain: `程序指令存于 000~004 单元，原始数据 a=${a}、b=${b}、c=${c} 存于 005~007 单元。启动计算机后，PC 指向首条指令 000。`,
    },
    {
      title: '指令 1（取数）：执行 LOAD 005',
      pc: '000 → 001',
      ir: 'LOAD 005',
      mdr: String(a),
      acc: String(a),
      mem8: '空',
      activeMem: ['000', '005'],
      activeBus: 'mdr-to-acc',
      explain: `控制器从 000 单元取出指令 LOAD 005，按地址 005 读取 a=${a} 经数据总线送入 MDR，再送入累加器 ACC（ACC = ${a}）。`,
    },
    {
      title: '指令 2（加法）：执行 ADD 006',
      pc: '001 → 002',
      ir: 'ADD 006',
      mdr: String(b),
      acc: String(a + b),
      mem8: '空',
      activeMem: ['001', '006'],
      activeBus: 'alu-op',
      explain: `从 001 单元取指 ADD 006，从 006 单元读取 b=${b} 送入 MDR；ALU 将 ACC(${a}) + MDR(${b}) = ${a + b}，结果回存 ACC。`,
    },
    {
      title: '指令 3（减法）：执行 SUB 007',
      pc: '002 → 003',
      ir: 'SUB 007',
      mdr: String(c),
      acc: String(a + b - c),
      mem8: '空',
      activeMem: ['002', '007'],
      activeBus: 'alu-op',
      explain: `从 002 单元取指 SUB 007，从 007 单元读取 c=${c} 送入 MDR；ALU 计算 ACC(${a + b}) - MDR(${c}) = ${a + b - c}，结果存入 ACC。`,
    },
    {
      title: '指令 4（存数）：执行 STORE 008',
      pc: '003 → 004',
      ir: 'STORE 008',
      mdr: String(a + b - c),
      acc: String(a + b - c),
      mem8: String(a + b - c),
      activeMem: ['003', '008'],
      activeBus: 'acc-to-mem',
      explain: `从 003 单元取指 STORE 008，将 ACC 中的最终结果 ${a + b - c} 经 MDR 与数据总线写回主存 008 单元。`,
    },
    {
      title: '指令 5（停机）：执行 HALT',
      pc: '004',
      ir: 'HALT',
      mdr: String(a + b - c),
      acc: String(a + b - c),
      mem8: String(a + b - c),
      activeMem: ['004', '008'],
      activeBus: 'none',
      explain: `取出 004 单元的 HALT 指令，控制器停止取指与执行。主存 008 单元已保存 a + b - c = ${a + b - c}。`,
    },
  ];

  useEffect(() => {
    if (!playing) return;
    if (step >= steps.length - 1) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setStep((s) => Math.min(s + 1, steps.length - 1)), 1500);
    return () => clearTimeout(t);
  }, [playing, step, steps.length]);

  const cur = steps[step];

  const memCells = [
    { addr: '000', val: 'LOAD 005', tag: '指令' },
    { addr: '001', val: 'ADD 006', tag: '指令' },
    { addr: '002', val: 'SUB 007', tag: '指令' },
    { addr: '003', val: 'STORE 008', tag: '指令' },
    { addr: '004', val: 'HALT', tag: '指令' },
    { addr: '005', val: `a = ${a}`, tag: '数据' },
    { addr: '006', val: `b = ${b}`, tag: '数据' },
    { addr: '007', val: `c = ${c}`, tag: '数据' },
    { addr: '008', val: cur.mem8 === '空' ? '— (结果区)' : `结果 = ${cur.mem8}`, tag: '结果' },
  ];

  return (
    <LabFrame
      id="lab-1-1"
      code="LAB-1.1"
      title="冯·诺依曼计算机工作过程动画机（a + b - c）"
      desc="复现课件 P18–P23：修改 a、b、c 数值，逐步观察指令与数据在主存、总线、MDR、ALU 与累加器间的流动。"
    >
      <div className="lab-toolbar">
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <span style={{ color: 'var(--silicon-muted)' }}>a=</span>
          <input
            type="number"
            className="lab-input"
            style={{ width: 64 }}
            value={a}
            onChange={(e) => {
              setA(Number(e.target.value) || 0);
              setStep(0);
              setPlaying(false);
            }}
          />
        </label>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <span style={{ color: 'var(--silicon-muted)' }}>b=</span>
          <input
            type="number"
            className="lab-input"
            style={{ width: 64 }}
            value={b}
            onChange={(e) => {
              setB(Number(e.target.value) || 0);
              setStep(0);
              setPlaying(false);
            }}
          />
        </label>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <span style={{ color: 'var(--silicon-muted)' }}>c=</span>
          <input
            type="number"
            className="lab-input"
            style={{ width: 64 }}
            value={c}
            onChange={(e) => {
              setC(Number(e.target.value) || 0);
              setStep(0);
              setPlaying(false);
            }}
          />
        </label>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          className="lab-btn"
          disabled={step === 0}
          onClick={() => {
            setPlaying(false);
            setStep((s) => Math.max(0, s - 1));
          }}
        >
          <StepBack size={14} /> 上一步
        </button>
        <button
          type="button"
          className="lab-btn primary"
          onClick={() => {
            if (step >= steps.length - 1) setStep(0);
            setPlaying((p) => !p);
          }}
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
          {playing ? '暂停' : '自动播放'}
        </button>
        <button
          type="button"
          className="lab-btn"
          disabled={step >= steps.length - 1}
          onClick={() => {
            setPlaying(false);
            setStep((s) => Math.min(steps.length - 1, s + 1));
          }}
        >
          下一步 <StepForward size={14} />
        </button>
        <button
          type="button"
          className="lab-btn"
          onClick={() => {
            setPlaying(false);
            setStep(0);
          }}
        >
          <RotateCcw size={14} /> 重置
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
        {/* Main Memory */}
        <div className="lab-subpanel">
          <span className="lab-label">主存储器（指令与数据同存于统一地址空间）</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {memCells.map((cell) => {
              const hit = cur.activeMem.includes(cell.addr);
              return (
                <div
                  key={cell.addr}
                  className="mono"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '5px 9px',
                    borderRadius: 4,
                    fontSize: 12.5,
                    background: hit ? 'rgba(78, 161, 255, 0.2)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${hit ? '#4ea1ff' : '#25384d'}`,
                    color: hit ? '#ffffff' : '#c6d5e5',
                  }}
                >
                  <span style={{ color: '#8ea5be' }}>{cell.addr}</span>
                  <span style={{ fontWeight: hit ? 700 : 500 }}>{cell.val}</span>
                  <span
                    style={{
                      fontSize: 10.5,
                      padding: '1px 5px',
                      borderRadius: 3,
                      background: cell.tag === '指令' ? '#1e3550' : cell.tag === '结果' ? '#173e34' : '#3a2d1d',
                      color: cell.tag === '指令' ? '#82bfff' : cell.tag === '结果' ? '#38d9a9' : '#ffb03b',
                    }}
                  >
                    {cell.tag}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* CPU Internal Units */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="lab-subpanel">
            <span className="lab-label">控制器（取指、译码与时序指挥）</span>
            <div className="lab-metric-grid">
              <div className="lab-metric" style={{ background: '#0e1722' }}>
                <div className="lab-metric-k">程序计数器 PC</div>
                <div className="lab-metric-v" style={{ color: '#4ea1ff', fontSize: 15 }}>
                  {cur.pc}
                </div>
              </div>
              <div className="lab-metric" style={{ background: '#0e1722' }}>
                <div className="lab-metric-k">当前执行指令 IR</div>
                <div className="lab-metric-v" style={{ color: '#ffb03b', fontSize: 15 }}>
                  {cur.ir}
                </div>
              </div>
            </div>
          </div>

          <div
            className="lab-subpanel"
            style={{
              borderColor: cur.activeBus !== 'none' ? '#38d9a9' : '#2a3f56',
              textAlign: 'center',
              padding: '9px 12px',
            }}
          >
            <div className="mono" style={{ fontSize: 12, color: cur.activeBus !== 'none' ? '#38d9a9' : '#8ea5be' }}>
              {cur.activeBus === 'none' && '═══ 数据总线空闲 ═══'}
              {cur.activeBus === 'mdr-to-acc' && '═══ 数据总线：主存[005] ──▶ MDR ──▶ ACC ═══'}
              {cur.activeBus === 'alu-op' && '═══ 数据总线：主存操作数 ──▶ MDR ──▶ ALU 运算 ═══'}
              {cur.activeBus === 'acc-to-mem' && '═══ 数据总线：ACC ──▶ MDR ──▶ 主存[008] ═══'}
            </div>
          </div>

          <div className="lab-subpanel">
            <span className="lab-label">运算器（MDR + ALU + 累加器 ACC）</span>
            <div className="lab-metric-grid">
              <div className="lab-metric" style={{ background: '#0e1722' }}>
                <div className="lab-metric-k">存储器数据寄存器 MDR</div>
                <div className="lab-metric-v" style={{ color: '#e6eef7' }}>
                  {cur.mdr}
                </div>
              </div>
              <div
                className="lab-metric"
                style={{
                  background: cur.activeBus === 'alu-op' ? 'rgba(255, 176, 59, 0.14)' : '#0e1722',
                  borderColor: cur.activeBus === 'alu-op' ? '#ffb03b' : '#2a3f56',
                }}
              >
                <div className="lab-metric-k">算术逻辑单元 ALU</div>
                <div className="lab-metric-v" style={{ color: '#ffb03b', fontSize: 15 }}>
                  {step === 2 ? `${a} + ${b} = ${a + b}` : step === 3 ? `${a + b} - ${c} = ${a + b - c}` : '待命'}
                </div>
              </div>
              <div
                className="lab-metric"
                style={{
                  background: step >= 1 ? 'rgba(56, 217, 169, 0.12)' : '#0e1722',
                  borderColor: step >= 1 ? '#38d9a9' : '#2a3f56',
                }}
              >
                <div className="lab-metric-k">累加器 ACC</div>
                <div className="lab-metric-v" style={{ color: '#38d9a9' }}>
                  {cur.acc}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lab-status-bar">
        <div style={{ fontWeight: 700, marginBottom: 3, color: '#ffffff' }}>
          步骤 {step}/{steps.length - 1} · {cur.title}
        </div>
        <div>{cur.explain}</div>
      </div>
    </LabFrame>
  );
}

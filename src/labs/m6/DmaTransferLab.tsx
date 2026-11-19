import React, { useState } from 'react';
import { StepForward, StepBack, RotateCcw } from 'lucide-react';
import { LabFrame } from '../../components/DocBlocks';

const DMA_STEPS = [
  {
    sig: '预处理（CPU 完成）',
    addr: '1000H',
    cnt: 4,
    owner: 'CPU',
    note: 'CPU 执行几条 I/O 指令：给 DMA 控制器的主存地址计数器置初值 1000H、长度计数器置 4、设置方向(读外设→写主存)并启动外设。',
  },
  {
    sig: '① 外设 ──DREQ──▶ DMA',
    addr: '1000H',
    cnt: 4,
    owner: 'CPU',
    note: '外设准备好第 1 个数据，向 DMA 控制器发出 DMA 请求信号 DREQ，使 DMA 请求触发器置位。',
  },
  {
    sig: '② DMA ──HRQ──▶ CPU',
    addr: '1000H',
    cnt: 4,
    owner: 'CPU',
    note: 'DMA 控制器向 CPU 发出总线占用请求信号 HRQ (HOLD)。注意：CPU 在当前机器周期结束即可响应，无需等整条指令结束！',
  },
  {
    sig: '③ CPU ──HLDA──▶ DMA',
    addr: '1000H',
    cnt: 4,
    owner: 'DMA',
    note: 'CPU 响应并输出总线批准信号 HLDA，同时令自身地址/数据总线进入高阻三态，将总线控制权移交给 DMA 控制器！',
  },
  {
    sig: '④ DMA ──DACK──▶ 外设',
    addr: '1000H',
    cnt: 4,
    owner: 'DMA',
    note: 'DMA 控制器向外设发响应信号 DACK，告知外设总线已接管完毕，可以开始直接与主存高速交换数据。',
  },
  {
    sig: '⑤⑥⑦ 传送第 1~3 字节（硬件循环）',
    addr: '1003H',
    cnt: 1,
    owner: 'DMA',
    note: 'DMA 连续发出主存地址、IOR(读外设) 和 MEMW(写主存)，数据不经 CPU 直入主存！每传 1 字节，地址计数器 +1、长度计数器 -1。',
  },
  {
    sig: '长度计数器归 0 → 交还总线 + 中断后处理',
    addr: '1004H',
    cnt: 0,
    owner: 'CPU',
    note: '第 4 字节传完后长度计数器减为 0 产生溢出信号：HRQ 变低交还总线控制权，同时触发中断机构向 CPU 发中断请求做 DMA 后处理！',
  },
];

export default function DmaTransferLab() {
  const [tab, setTab] = useState<'flow' | 'methods'>('flow');
  const [step, setStep] = useState(0);

  const cur = DMA_STEPS[step];

  // 12 memory cycles timeline for 3 DMA methods (Slides P74-P76)
  const methodRows = [
    {
      name: '① CPU 停止访问主存法（成组连续独占）',
      desc: 'DMA 一次独占多个连续存取周期传完整个数据块，期间 CPU 处于保持状态停止访存，适合高速外设批量传输。',
      slots: ['CPU', 'CPU', 'DMA', 'DMA', 'DMA', 'DMA', 'DMA', 'DMA', 'CPU', 'CPU', 'CPU', 'CPU'],
    },
    {
      name: '② 存储器分时法（每周期切成 2 时间片）',
      desc: 'CPU 与 DMA 交替使用半个周期，无需申请/归还总线；但要求主存速度翻倍，且外设无数据时 DMA 时间片空转浪费。',
      slots: ['C|D', 'C|D', 'C|D', 'C|D', 'C|D', 'C|D', 'C|D', 'C|D', 'C|D', 'C|D', 'C|D', 'C|D'],
    },
    {
      name: '③ 周期挪用法（周期窃取 · 最常用折衷）',
      desc: '外设就绪就挪用（窃取）CPU 的 1 个存取周期传 1 字，传完立刻归还总线；访存冲突时 I/O 优先（防数据丢失）。',
      slots: ['CPU', 'CPU', 'DMA', 'CPU', 'CPU', 'DMA', 'CPU', 'DMA', 'CPU', 'CPU', 'DMA', 'CPU'],
    },
  ];

  return (
    <LabFrame
      id="lab-6-4"
      code="LAB-6.4"
      title="DMA 7 步握手传送流程 & 三种主存访问方式时间轴对比"
      desc="复现课件 P70–P79：单步体验 DMA 控制器如何绕过 CPU 直接读写主存，并横向对比三种 DMA 传送方式对主存与 CPU 的影响。"
    >
      <div className="lab-toolbar">
        <button type="button" className={`lab-btn ${tab === 'flow' ? 'primary' : ''}`} onClick={() => setTab('flow')}>
          DMA 7步握手与硬件计数器（P72–P73）
        </button>
        <button type="button" className={`lab-btn ${tab === 'methods' ? 'primary' : ''}`} onClick={() => setTab('methods')}>
          三种 DMA 传送方式对比（P74–P76）
        </button>
      </div>

      {tab === 'flow' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="lab-toolbar" style={{ marginBottom: 0 }}>
            <button type="button" className="lab-btn" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
              <StepBack size={14} /> 上一步
            </button>
            <button type="button" className="lab-btn primary" disabled={step >= DMA_STEPS.length - 1} onClick={() => setStep((s) => s + 1)}>
              下一步 <StepForward size={14} />
            </button>
            <button type="button" className="lab-btn" onClick={() => setStep(0)}>
              <RotateCcw size={14} /> 重置
            </button>
            <span className="mono" style={{ marginLeft: 'auto', fontSize: 12.5, color: cur.owner === 'DMA' ? '#38d9a9' : '#4ea1ff', fontWeight: 700 }}>
              当前系统总线控制权：{cur.owner}
            </span>
          </div>

          <div className="lab-metric-grid">
            <div className="lab-metric">
              <div className="lab-metric-k">当前握手阶段</div>
              <div className="lab-metric-v" style={{ fontSize: 14, color: '#ffb03b' }}>{cur.sig}</div>
            </div>
            <div className="lab-metric">
              <div className="lab-metric-k">主存地址计数器 (自动+1)</div>
              <div className="lab-metric-v" style={{ color: '#4ea1ff' }}>{cur.addr}</div>
            </div>
            <div className="lab-metric">
              <div className="lab-metric-k">传送长度计数器 (自动-1)</div>
              <div className="lab-metric-v" style={{ color: cur.cnt === 0 ? '#38d9a9' : '#ffffff' }}>
                {cur.cnt} {cur.cnt === 0 ? '(归0触发中断!)' : '字节剩余'}
              </div>
            </div>
            <div className="lab-metric">
              <div className="lab-metric-k">总线支配者</div>
              <div className="lab-metric-v" style={{ color: cur.owner === 'DMA' ? '#38d9a9' : '#4ea1ff' }}>{cur.owner}</div>
            </div>
          </div>

          <div className="lab-status-bar">
            <strong>步骤 {step}/{DMA_STEPS.length - 1}：</strong>{cur.note}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {methodRows.map((m) => (
            <div key={m.name} className="lab-subpanel">
              <div style={{ fontWeight: 700, color: '#ffffff', marginBottom: 4, fontSize: 13.5 }}>{m.name}</div>
              <div style={{ fontSize: 12.5, color: '#8ea5be', marginBottom: 10 }}>{m.desc}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 4 }} className="mono">
                {m.slots.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      textAlign: 'center',
                      padding: '6px 2px',
                      borderRadius: 3,
                      fontSize: 11,
                      fontWeight: 700,
                      background: s === 'DMA' ? 'rgba(56,217,169,0.28)' : s === 'C|D' ? 'linear-gradient(90deg, rgba(78,161,255,0.28) 50%, rgba(56,217,169,0.28) 50%)' : 'rgba(78,161,255,0.22)',
                      border: `1px solid ${s === 'DMA' ? '#38d9a9' : s === 'C|D' ? '#ffb03b' : '#4ea1ff'}`,
                      color: '#ffffff',
                    }}
                  >
                    {s}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </LabFrame>
  );
}

import React, { useState } from 'react';
import { LabFrame } from '../../components/DocBlocks';

// Compute 4x4 interrupt mask matrix for a desired processing order (e.g., [1, 4, 3, 2])
// Rule (Slide P65-P66): When handling level L, mask (1) itself and all levels with LOWER processing priority;
// unmask (0) all levels with HIGHER processing priority so they can preempt!
function computeMaskMatrix(order: number[]) {
  // order[0] is highest processing priority, order[3] is lowest
  const rank: Record<number, number> = {};
  order.forEach((lvl, idx) => {
    rank[lvl] = idx;
  });
  const matrix: Record<number, number[]> = {};
  for (let cur = 1; cur <= 4; cur++) {
    matrix[cur] = [1, 2, 3, 4].map((target) => (rank[target] < rank[cur] ? 0 : 1));
  }
  return matrix;
}

// Simulate nested interrupt timeline for 20 ticks
// Suppose Interrupts arrive at t=2 (L3), t=4 (L2), t=6 (L4), t=9 (L1) — or simultaneous burst at t=2
function simulateTimeline(order: number[], arrivals: { level: number; at: number; dur: number }[]) {
  const rank: Record<number, number> = {};
  order.forEach((lvl, idx) => {
    rank[lvl] = idx;
  });
  // Hardware response priority is ALWAYS fixed: 1 > 2 > 3 > 4 (smaller level wins simultaneous response)
  const pending = new Set<number>();
  const rem: Record<number, number> = {};
  const stack: number[] = []; // currently active ISR stack (top is running)
  const slots: string[] = [];

  for (let t = 1; t <= 22; t++) {
    arrivals.forEach((ev) => {
      if (ev.at === t) {
        pending.add(ev.level);
        rem[ev.level] = ev.dur;
      }
    });

    // Check which pending interrupts are NOT masked by currently running ISR
    const curRunning = stack.length > 0 ? stack[stack.length - 1] : null;
    const unmasked = Array.from(pending).filter((lvl) => {
      if (curRunning === null) return true;
      return rank[lvl] < rank[curRunning]; // higher processing priority => mask bit 0 => can preempt!
    });

    if (unmasked.length > 0) {
      // Among unmasked pending requests, hardware responds by fixed response priority (1->2->3->4)
      unmasked.sort((a, b) => a - b);
      const chosen = unmasked[0];
      pending.delete(chosen);
      stack.push(chosen);
    }

    const active = stack.length > 0 ? stack[stack.length - 1] : 0;
    slots.push(active === 0 ? '主' : `L${active}`);

    if (active !== 0) {
      rem[active]--;
      if (rem[active] <= 0) {
        stack.pop();
      }
    }
  }
  return slots;
}

const PRESET_ORDERS: { label: string; order: number[] }[] = [
  { label: '默认一致：1 → 2 → 3 → 4 (P65)', order: [1, 2, 3, 4] },
  { label: '课件软升级：1 → 4 → 3 → 2 (P66)', order: [1, 4, 3, 2] },
  { label: '完全逆序：4 → 3 → 2 → 1', order: [4, 3, 2, 1] },
  { label: '自定义示例：2 → 4 → 1 → 3', order: [2, 4, 1, 3] },
];

const LEVEL_COLOR: Record<string, string> = {
  主: '#5c7085',
  L1: '#ff6b6b',
  L2: '#4ea1ff',
  L3: '#ffb03b',
  L4: '#38d9a9',
};

export default function InterruptMaskLab() {
  const [order, setOrder] = useState<number[]>([1, 4, 3, 2]);
  const [burstMode, setBurstMode] = useState<'stagger' | 'simultaneous'>('stagger');

  const matrix = computeMaskMatrix(order);
  const arrivals =
    burstMode === 'stagger'
      ? [
          { level: 2, at: 3, dur: 4 },
          { level: 3, at: 5, dur: 4 },
          { level: 4, at: 7, dur: 4 },
          { level: 1, at: 9, dur: 3 },
        ]
      : [
          { level: 1, at: 3, dur: 3 },
          { level: 2, at: 3, dur: 3 },
          { level: 3, at: 3, dur: 3 },
          { level: 4, at: 3, dur: 3 },
        ];

  const slots = simulateTimeline(order, arrivals);

  return (
    <LabFrame
      id="lab-6-3"
      code="LAB-6.3"
      title="多重中断屏蔽字软升级 & 嵌套执行轨迹模拟器"
      desc="复现课件 P65–P66：硬件中断响应次序固定为 1→2→3→4，但通过修改屏蔽码（1=屏蔽，0=允许打断），可以灵活改变实际的中断处理次序！"
    >
      <div className="lab-toolbar">
        {PRESET_ORDERS.map((p) => (
          <button
            key={p.label}
            type="button"
            className={`lab-btn ${JSON.stringify(order) === JSON.stringify(p.order) ? 'primary' : ''}`}
            style={{ fontSize: 12.5 }}
            onClick={() => setOrder(p.order)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 14, marginBottom: 14 }}>
        {/* 4x4 Mask Matrix */}
        <div className="lab-subpanel">
          <span className="lab-label">自动生成 4×4 中断屏蔽码表（目标处理次序：{order.join(' → ')}）</span>
          <table className="mono" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'center' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2a3f56', color: '#8ea5be' }}>
                <th style={{ padding: '6px', textAlign: 'left' }}>正在执行</th>
                {[1, 2, 3, 4].map((c) => (
                  <th key={c} style={{ padding: '6px' }}>屏蔽 {c} 级</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4].map((lvl) => (
                <tr key={lvl} style={{ borderBottom: '1px solid #1d2e41' }}>
                  <td style={{ padding: '6px', textAlign: 'left', fontWeight: 700, whiteSpace: 'nowrap', color: LEVEL_COLOR[`L${lvl}`] }}>第 {lvl} 级程序</td>
                  {matrix[lvl].map((bit, i) => (
                    <td
                      key={i}
                      style={{
                        padding: '6px',
                        fontWeight: 700,
                        color: bit === 1 ? '#ff9999' : '#38d9a9',
                        background: bit === 1 ? 'rgba(255,107,107,0.1)' : 'rgba(56,217,169,0.14)',
                      }}
                    >
                      {bit}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontSize: 11.5, color: '#8ea5be', marginTop: 8 }}>
            口诀：某级处理完之前<strong>不能被自己和比自己处理级低的打断（置 1）</strong>，只允许<strong>处理级更高的打断（置 0）</strong>！
          </div>
        </div>

        {/* Arrival scenario & summary */}
        <div className="lab-subpanel" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span className="lab-label">中断到达场景切换</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button type="button" className={`lab-btn ${burstMode === 'stagger' ? 'active' : ''}`} onClick={() => setBurstMode('stagger')}>
              交错到达 (t3:L2, t5:L3, t7:L4, t9:L1)
            </button>
            <button type="button" className={`lab-btn ${burstMode === 'simultaneous' ? 'active' : ''}`} onClick={() => setBurstMode('simultaneous')}>
              t=3 四源同时到达
            </button>
          </div>
          <div style={{ fontSize: 12.5, color: '#cfe0f0', lineHeight: 1.65 }}>
            <div>• <strong>硬件响应次序（不可改）</strong>：1 → 2 → 3 → 4</div>
            <div>• <strong>软件处理次序（由屏蔽字决定）</strong>：{order.join(' → ')}</div>
            <div style={{ color: '#ffb03b', marginTop: 4 }}>
              思考课件 P61 问题：多重中断嵌套时，最内层的中断服务程序处理优先级<strong>最高</strong>！
            </div>
          </div>
        </div>
      </div>

      {/* Execution Gantt Timeline */}
      <div className="lab-subpanel" style={{ overflowX: 'auto' }}>
        <span className="lab-label">实时多重中断嵌套执行轨迹（T1 ~ T22）</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(22, minmax(26px, 1fr))', gap: 3 }} className="mono">
          {slots.map((tag, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#8ea5be', marginBottom: 3 }}>{i + 1}</div>
              <div
                style={{
                  padding: '8px 0',
                  borderRadius: 3,
                  fontSize: 11.5,
                  fontWeight: 700,
                  background: `${LEVEL_COLOR[tag]}35`,
                  border: `1px solid ${LEVEL_COLOR[tag]}`,
                  color: '#ffffff',
                }}
              >
                {tag}
              </div>
            </div>
          ))}
        </div>
      </div>
    </LabFrame>
  );
}

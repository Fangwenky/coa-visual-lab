import React, { useState } from 'react';
import { LabFrame } from '../../components/DocBlocks';

type HazardScenario = 'ideal' | 'struct-conflict' | 'struct-fixed' | 'data-conflict' | 'data-stall' | 'data-forward';

interface PipeRow {
  inst: string;
  cells: Record<number, { stage: string; color: string; alert?: string }>;
}

const STAGE_COLOR: Record<string, string> = {
  IF: '#4ea1ff',
  ID: '#b197fc',
  EX: '#ffb03b',
  MEM: '#38d9a9',
  WB: '#20c997',
  BUBBLE: '#5c7085',
  CONFLICT: '#ff6b6b',
};

function getScenarioData(sc: HazardScenario): { title: string; cycles: number; instrCount: number; rows: PipeRow[]; explain: string } {
  if (sc === 'ideal') {
    return {
      title: '理想 5 段流水线（无任何冒险）',
      cycles: 8,
      instrCount: 4,
      rows: [
        { inst: 'I1: ADD R1,R2,R3', cells: { 1: { stage: 'IF', color: STAGE_COLOR.IF }, 2: { stage: 'ID', color: STAGE_COLOR.ID }, 3: { stage: 'EX', color: STAGE_COLOR.EX }, 4: { stage: 'MEM', color: STAGE_COLOR.MEM }, 5: { stage: 'WB', color: STAGE_COLOR.WB } } },
        { inst: 'I2: SUB R4,R5,R6', cells: { 2: { stage: 'IF', color: STAGE_COLOR.IF }, 3: { stage: 'ID', color: STAGE_COLOR.ID }, 4: { stage: 'EX', color: STAGE_COLOR.EX }, 5: { stage: 'MEM', color: STAGE_COLOR.MEM }, 6: { stage: 'WB', color: STAGE_COLOR.WB } } },
        { inst: 'I3: AND R7,R8,R9', cells: { 3: { stage: 'IF', color: STAGE_COLOR.IF }, 4: { stage: 'ID', color: STAGE_COLOR.ID }, 5: { stage: 'EX', color: STAGE_COLOR.EX }, 6: { stage: 'MEM', color: STAGE_COLOR.MEM }, 7: { stage: 'WB', color: STAGE_COLOR.WB } } },
        { inst: 'I4: OR R10,R11,R12', cells: { 4: { stage: 'IF', color: STAGE_COLOR.IF }, 5: { stage: 'ID', color: STAGE_COLOR.ID }, 6: { stage: 'EX', color: STAGE_COLOR.EX }, 7: { stage: 'MEM', color: STAGE_COLOR.MEM }, 8: { stage: 'WB', color: STAGE_COLOR.WB } } },
      ],
      explain: '理想情况下，每条指令经 5 个功能段，建立时间后每个时钟周期流出 1 条结果；4 条指令总耗时 k+(n-1) = 5+3 = 8 周期（非流水需 4×5=20 周期）。',
    };
  }
  if (sc === 'struct-conflict') {
    return {
      title: '结构冒险：统一存储器在 T4 发生访存冲突（课件 P65）',
      cycles: 8,
      instrCount: 4,
      rows: [
        { inst: 'I1: LW R1, 0(R2)', cells: { 1: { stage: 'IF', color: STAGE_COLOR.IF }, 2: { stage: 'ID', color: STAGE_COLOR.ID }, 3: { stage: 'EX', color: STAGE_COLOR.EX }, 4: { stage: 'MEM⚠', color: STAGE_COLOR.CONFLICT }, 5: { stage: 'WB', color: STAGE_COLOR.WB } } },
        { inst: 'I2: ADD R3,R4,R5', cells: { 2: { stage: 'IF', color: STAGE_COLOR.IF }, 3: { stage: 'ID', color: STAGE_COLOR.ID }, 4: { stage: 'EX', color: STAGE_COLOR.EX }, 5: { stage: 'MEM', color: STAGE_COLOR.MEM }, 6: { stage: 'WB', color: STAGE_COLOR.WB } } },
        { inst: 'I3: SUB R6,R7,R8', cells: { 3: { stage: 'IF', color: STAGE_COLOR.IF }, 4: { stage: 'ID', color: STAGE_COLOR.ID }, 5: { stage: 'EX', color: STAGE_COLOR.EX }, 6: { stage: 'MEM', color: STAGE_COLOR.MEM }, 7: { stage: 'WB', color: STAGE_COLOR.WB } } },
        { inst: 'I4: OR R9,R10,R11', cells: { 4: { stage: 'IF⚠', color: STAGE_COLOR.CONFLICT }, 5: { stage: 'ID', color: STAGE_COLOR.ID }, 6: { stage: 'EX', color: STAGE_COLOR.EX }, 7: { stage: 'MEM', color: STAGE_COLOR.MEM }, 8: { stage: 'WB', color: STAGE_COLOR.WB } } },
      ],
      explain: '第 4 拍（T4）：I1 的数据访存（MEM）与 I4 的取指令（IF）同时争抢同一个主存端口，发生结构冒险！',
    };
  }
  if (sc === 'struct-fixed') {
    return {
      title: '解决结构冒险：分离指令 Cache (IM) 与数据 Cache (DM)（课件 P66）',
      cycles: 8,
      instrCount: 4,
      rows: [
        { inst: 'I1: LW R1, 0(R2)', cells: { 1: { stage: 'IM', color: STAGE_COLOR.IF }, 2: { stage: 'ID', color: STAGE_COLOR.ID }, 3: { stage: 'EX', color: STAGE_COLOR.EX }, 4: { stage: 'DM✓', color: STAGE_COLOR.MEM }, 5: { stage: 'WB', color: STAGE_COLOR.WB } } },
        { inst: 'I2: ADD R3,R4,R5', cells: { 2: { stage: 'IM', color: STAGE_COLOR.IF }, 3: { stage: 'ID', color: STAGE_COLOR.ID }, 4: { stage: 'EX', color: STAGE_COLOR.EX }, 5: { stage: 'DM', color: STAGE_COLOR.MEM }, 6: { stage: 'WB', color: STAGE_COLOR.WB } } },
        { inst: 'I3: SUB R6,R7,R8', cells: { 3: { stage: 'IM', color: STAGE_COLOR.IF }, 4: { stage: 'ID', color: STAGE_COLOR.ID }, 5: { stage: 'EX', color: STAGE_COLOR.EX }, 6: { stage: 'DM', color: STAGE_COLOR.MEM }, 7: { stage: 'WB', color: STAGE_COLOR.WB } } },
        { inst: 'I4: OR R9,R10,R11', cells: { 4: { stage: 'IM✓', color: STAGE_COLOR.IF }, 5: { stage: 'ID', color: STAGE_COLOR.ID }, 6: { stage: 'EX', color: STAGE_COLOR.EX }, 7: { stage: 'DM', color: STAGE_COLOR.MEM }, 8: { stage: 'WB', color: STAGE_COLOR.WB } } },
      ],
      explain: '采用哈佛结构分离指令 Cache (IM) 和数据 Cache (DM)，T4 拍 I1 访问 DM、I4 访问 IM 互不干扰，0 停顿消除结构冒险！',
    };
  }
  if (sc === 'data-conflict') {
    return {
      title: '数据冒险（RAW 写后读冲突，课件 P67）',
      cycles: 8,
      instrCount: 4,
      rows: [
        { inst: 'I1: ADD R1,R2,R3', cells: { 1: { stage: 'IF', color: STAGE_COLOR.IF }, 2: { stage: 'ID', color: STAGE_COLOR.ID }, 3: { stage: 'EX', color: STAGE_COLOR.EX }, 4: { stage: 'MEM', color: STAGE_COLOR.MEM }, 5: { stage: 'WB(写R1)', color: STAGE_COLOR.WB } } },
        { inst: 'I2: SUB R4,R1,R5', cells: { 2: { stage: 'IF', color: STAGE_COLOR.IF }, 3: { stage: '读R1⚠', color: STAGE_COLOR.CONFLICT }, 4: { stage: 'EX', color: STAGE_COLOR.EX }, 5: { stage: 'MEM', color: STAGE_COLOR.MEM }, 6: { stage: 'WB', color: STAGE_COLOR.WB } } },
        { inst: 'I3: AND R6,R1,R7', cells: { 3: { stage: 'IF', color: STAGE_COLOR.IF }, 4: { stage: '读R1⚠', color: STAGE_COLOR.CONFLICT }, 5: { stage: 'EX', color: STAGE_COLOR.EX }, 6: { stage: 'MEM', color: STAGE_COLOR.MEM }, 7: { stage: 'WB', color: STAGE_COLOR.WB } } },
        { inst: 'I4: OR R8,R1,R9', cells: { 4: { stage: 'IF', color: STAGE_COLOR.IF }, 5: { stage: '读R1✓', color: STAGE_COLOR.ID }, 6: { stage: 'EX', color: STAGE_COLOR.EX }, 7: { stage: 'MEM', color: STAGE_COLOR.MEM }, 8: { stage: 'WB', color: STAGE_COLOR.WB } } },
      ],
      explain: 'I1 直到第 5 拍 (WB) 才将新 R1 写回寄存器堆，而 I2(T3) 和 I3(T4) 提前读了旧 R1 值导致结果错误！（I4 在 T5 借助“先写后读”可正确读到新 R1）。',
    };
  }
  if (sc === 'data-stall') {
    return {
      title: '解决数据冒险 ①：插入 2 个流水线气泡 NOP（课件 P69）',
      cycles: 9,
      instrCount: 3,
      rows: [
        { inst: 'I1: ADD R1,R2,R3', cells: { 1: { stage: 'IF', color: STAGE_COLOR.IF }, 2: { stage: 'ID', color: STAGE_COLOR.ID }, 3: { stage: 'EX', color: STAGE_COLOR.EX }, 4: { stage: 'MEM', color: STAGE_COLOR.MEM }, 5: { stage: 'WB(写R1)', color: STAGE_COLOR.WB } } },
        { inst: 'NOP (气泡1)', cells: { 2: { stage: 'BUB', color: STAGE_COLOR.BUBBLE }, 3: { stage: 'BUB', color: STAGE_COLOR.BUBBLE }, 4: { stage: 'BUB', color: STAGE_COLOR.BUBBLE }, 5: { stage: 'BUB', color: STAGE_COLOR.BUBBLE }, 6: { stage: 'BUB', color: STAGE_COLOR.BUBBLE } } },
        { inst: 'NOP (气泡2)', cells: { 3: { stage: 'BUB', color: STAGE_COLOR.BUBBLE }, 4: { stage: 'BUB', color: STAGE_COLOR.BUBBLE }, 5: { stage: 'BUB', color: STAGE_COLOR.BUBBLE }, 6: { stage: 'BUB', color: STAGE_COLOR.BUBBLE }, 7: { stage: 'BUB', color: STAGE_COLOR.BUBBLE } } },
        { inst: 'I2: SUB R4,R1,R5', cells: { 4: { stage: 'IF', color: STAGE_COLOR.IF }, 5: { stage: '读R1✓', color: STAGE_COLOR.ID }, 6: { stage: 'EX', color: STAGE_COLOR.EX }, 7: { stage: 'MEM', color: STAGE_COLOR.MEM }, 8: { stage: 'WB', color: STAGE_COLOR.WB } } },
        { inst: 'I3: AND R6,R1,R7', cells: { 5: { stage: 'IF', color: STAGE_COLOR.IF }, 6: { stage: '读R1✓', color: STAGE_COLOR.ID }, 7: { stage: 'EX', color: STAGE_COLOR.EX }, 8: { stage: 'MEM', color: STAGE_COLOR.MEM }, 9: { stage: 'WB', color: STAGE_COLOR.WB } } },
      ],
      explain: '插入 2 条空操作 NOP（气泡），配合寄存器堆在 T5 拍内“先写后读 (double bump)”，让 I2 在 T5 拍安全读到新 R1。缺点是损失了 2 个时钟周期的吞吐率。',
    };
  }
  return {
    title: '解决数据冒险 ②：旁路前递 Forwarding 通路（0 气泡！）',
    cycles: 7,
    instrCount: 3,
    rows: [
      { inst: 'I1: ADD R1,R2,R3', cells: { 1: { stage: 'IF', color: STAGE_COLOR.IF }, 2: { stage: 'ID', color: STAGE_COLOR.ID }, 3: { stage: 'EX(产出)↘', color: STAGE_COLOR.EX }, 4: { stage: 'MEM↘', color: STAGE_COLOR.MEM }, 5: { stage: 'WB', color: STAGE_COLOR.WB } } },
      { inst: 'I2: SUB R4,R1,R5', cells: { 2: { stage: 'IF', color: STAGE_COLOR.IF }, 3: { stage: 'ID', color: STAGE_COLOR.ID }, 4: { stage: 'EX←旁路', color: '#38d9a9' }, 5: { stage: 'MEM', color: STAGE_COLOR.MEM }, 6: { stage: 'WB', color: STAGE_COLOR.WB } } },
      { inst: 'I3: AND R6,R1,R7', cells: { 3: { stage: 'IF', color: STAGE_COLOR.IF }, 4: { stage: 'ID', color: STAGE_COLOR.ID }, 5: { stage: 'EX←旁路', color: '#38d9a9' }, 6: { stage: 'MEM', color: STAGE_COLOR.MEM }, 7: { stage: 'WB', color: STAGE_COLOR.WB } } },
    ],
    explain: 'I1 在 T3 的 EX 段末其实已经算出了新 R1！通过硬件旁路（Forwarding）把 EX/MEM 流水线寄存器中的结果直接前递给 I2(T4 EX) 与 I3(T5 EX)，无需等待 WB，0 停顿完成！',
  };
}

// Slide P72-P74: 4-stage FP adder summing 8 numbers Z = [(A+B)+(C+D)] + [(E+F)+(G+H)] in 15 cycles
interface FpTask {
  id: number;
  label: string;
  startCycle: number; // 1-based cycle entering Stage 1
}

const FP_TASKS: FpTask[] = [
  { id: 1, label: '1: A+B', startCycle: 1 },
  { id: 2, label: '2: C+D', startCycle: 2 },
  { id: 3, label: '3: E+F', startCycle: 3 },
  { id: 4, label: '4: G+H', startCycle: 4 },
  { id: 5, label: '5: (A+B)+(C+D)', startCycle: 6 }, // waits for #2 to finish at end of cycle 5!
  { id: 6, label: '6: (E+F)+(G+H)', startCycle: 8 }, // waits for #4 to finish at end of cycle 7!
  { id: 7, label: '7: 总和 Z', startCycle: 12 }, // waits for #6 to finish at end of cycle 11 -> finishes at cycle 15!
];

const FP_STAGES = ['规格化 (S4)', '尾数加 (S3)', '对阶 (S2)', '求阶差 (S1)'];

export default function PipelineHazardLab() {
  const [tab, setTab] = useState<'hazards' | 'fp8'>('hazards');
  const [scenario, setScenario] = useState<HazardScenario>('data-conflict');
  const [fpCycle, setFpCycle] = useState(15);

  const sc = getScenarioData(scenario);
  const nonPipeCycles = sc.instrCount * 5;
  const sp = (nonPipeCycles / sc.cycles).toFixed(2);
  const eff = ((nonPipeCycles / (5 * sc.cycles)) * 100).toFixed(1);

  return (
    <LabFrame
      id="lab-5-3"
      code="LAB-5.3"
      title="指令流水线三大冒险 & 4段浮点加法器求8数之和时空图模拟器"
      desc="覆盖课件 P58–P74：对比结构/数据冒险的产生与解法（分离Cache、插NOP气泡、Forwarding旁路），并逐拍推演经典的 15Δt 浮点累加时空图！"
    >
      <div className="lab-toolbar">
        <button type="button" className={`lab-btn ${tab === 'hazards' ? 'primary' : ''}`} onClick={() => setTab('hazards')}>
          5段指令流水线冒险实验室（P64–P69）
        </button>
        <button type="button" className={`lab-btn ${tab === 'fp8' ? 'primary' : ''}`} onClick={() => setTab('fp8')}>
          4段浮点加法求8数之和（P72–P74）
        </button>
      </div>

      {tab === 'hazards' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="lab-toolbar" style={{ marginBottom: 0 }}>
            {(
              [
                ['ideal', '理想流水线'],
                ['struct-conflict', '结构冒险(冲突)'],
                ['struct-fixed', '结构冒险(IM/DM分离)'],
                ['data-conflict', '数据冒险(RAW冲突)'],
                ['data-stall', '数据冒险(插NOP气泡)'],
                ['data-forward', '数据冒险(旁路前递)'],
              ] as [HazardScenario, string][]
            ).map(([id, label]) => (
              <button key={id} type="button" className={`lab-btn ${scenario === id ? 'active' : ''}`} style={{ fontSize: 12 }} onClick={() => setScenario(id)}>
                {label}
              </button>
            ))}
          </div>

          <div className="lab-subpanel" style={{ overflowX: 'auto' }}>
            <div style={{ fontWeight: 700, color: '#ffffff', marginBottom: 10, fontSize: 13.5 }}>{sc.title}</div>
            <table className="mono" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 4, fontSize: 12 }}>
              <thead>
                <tr style={{ color: '#8ea5be' }}>
                  <th style={{ textAlign: 'left', minWidth: 148 }}>指令序列</th>
                  {Array.from({ length: sc.cycles }, (_, i) => (
                    <th key={i} style={{ minWidth: 58 }}>T{i + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sc.rows.map((row, ri) => (
                  <tr key={ri}>
                    <td style={{ color: '#d4e1ee', fontWeight: 600 }}>{row.inst}</td>
                    {Array.from({ length: sc.cycles }, (_, ci) => {
                      const cell = row.cells[ci + 1];
                      return (
                        <td
                          key={ci}
                          style={{
                            textAlign: 'center',
                            padding: '6px 3px',
                            borderRadius: 4,
                            background: cell ? `${cell.color}30` : '#0c141d',
                            border: `1px solid ${cell ? cell.color : '#1f3042'}`,
                            color: cell ? '#ffffff' : 'transparent',
                            fontWeight: 700,
                            fontSize: 11,
                          }}
                        >
                          {cell ? cell.stage : '.'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="lab-metric-grid">
            <div className="lab-metric">
              <div className="lab-metric-k">有效指令数 n / 总周期 T</div>
              <div className="lab-metric-v">{sc.instrCount} 条 / {sc.cycles} 拍</div>
            </div>
            <div className="lab-metric">
              <div className="lab-metric-k">实际吞吐率 TP</div>
              <div className="lab-metric-v" style={{ color: '#4ea1ff' }}>{(sc.instrCount / sc.cycles).toFixed(2)} 条/拍</div>
            </div>
            <div className="lab-metric">
              <div className="lab-metric-k">加速比 Sp = T非流水/T流水</div>
              <div className="lab-metric-v" style={{ color: '#38d9a9' }}>{sp}×</div>
            </div>
            <div className="lab-metric">
              <div className="lab-metric-k">硬件效率 η</div>
              <div className="lab-metric-v" style={{ color: '#ffb03b' }}>{eff}%</div>
            </div>
          </div>

          <div className="lab-status-bar">{sc.explain}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="lab-toolbar" style={{ marginBottom: 0 }}>
            <span className="mono" style={{ fontSize: 12.5, color: '#8ea5be' }}>
              拖动查看第 1~15Δt 的执行过程：当前显示至 <strong style={{ color: '#38d9a9' }}>T{fpCycle}</strong>
            </span>
            <input
              type="range"
              min={1}
              max={15}
              value={fpCycle}
              onChange={(e) => setFpCycle(Number(e.target.value))}
              style={{ flex: 1, minWidth: 160 }}
            />
          </div>

          <div className="lab-subpanel" style={{ overflowX: 'auto' }}>
            <div className="mono" style={{ fontSize: 12, color: '#8ea5be', marginBottom: 8 }}>
              归约树拆解：Z = [(A+B)₁ + (C+D)₂]₅ + [(E+F)₃ + (G+H)₄]₆ → 任务 7 输出总和（注意任务 5 必须等任务 2 完成于 T5 末才能在 T6 进入！）
            </div>
            <table className="mono" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 3, fontSize: 11.5 }}>
              <thead>
                <tr style={{ color: '#8ea5be' }}>
                  <th style={{ textAlign: 'left', minWidth: 92 }}>空间(功能段)</th>
                  {Array.from({ length: 15 }, (_, i) => (
                    <th key={i} style={{ minWidth: 34, color: i + 1 === fpCycle ? '#ffb03b' : undefined }}>
                      {i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FP_STAGES.map((stName, rowIdx) => {
                  const stageNum = 4 - rowIdx; // S4 top, S1 bottom (matches Slide P73 space-time diagram!)
                  return (
                    <tr key={stName}>
                      <td style={{ color: '#d4e1ee', fontWeight: 600 }}>{stName}</td>
                      {Array.from({ length: 15 }, (_, ci) => {
                        const cycle = ci + 1;
                        const task =
                          cycle <= fpCycle
                            ? FP_TASKS.find((t) => cycle - t.startCycle + 1 === stageNum)
                            : undefined;
                        const taskColor = task
                          ? task.id <= 4
                            ? '#4ea1ff'
                            : task.id <= 6
                            ? '#ffb03b'
                            : '#38d9a9'
                          : '';
                        return (
                          <td
                            key={ci}
                            title={task ? `${task.label} @ T${cycle}` : `空闲 @ T${cycle}`}
                            style={{
                              textAlign: 'center',
                              padding: '7px 2px',
                              borderRadius: 3,
                              background: task ? `${taskColor}32` : '#0c141d',
                              border: `1px solid ${task ? taskColor : '#1f3042'}`,
                              color: task ? '#ffffff' : '#35495e',
                              fontWeight: 700,
                            }}
                          >
                            {task ? task.id : '·'}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="lab-metric-grid">
            <div className="lab-metric">
              <div className="lab-metric-k">总加法次数 / 总耗时</div>
              <div className="lab-metric-v">7 次 / 15 Δt</div>
            </div>
            <div className="lab-metric">
              <div className="lab-metric-k">吞吐率 TP = n / T流水</div>
              <div className="lab-metric-v" style={{ color: '#4ea1ff' }}>7 / (15Δt)</div>
            </div>
            <div className="lab-metric">
              <div className="lab-metric-k">加速比 Sp = (7×4Δt)/(15Δt)</div>
              <div className="lab-metric-v" style={{ color: '#38d9a9' }}>1.87</div>
            </div>
            <div className="lab-metric">
              <div className="lab-metric-k">效率 E = (7×4)/(4×15)</div>
              <div className="lab-metric-v" style={{ color: '#ffb03b' }}>46.7% ≈ 47%</div>
            </div>
          </div>

          <div className="lab-status-bar">
            为什么有空隙？因为任务 5=(A+B)+(C+D) 存在<strong>数据相关</strong>，必须等任务 2 在 T5 末流出后才能在 T6 流入；任务 6 必须等任务 4 在 T7 末流出；任务 7 必须等任务 6 在 T11 末流出！这是考试画时空图与算指标的超级高频题。
          </div>
        </div>
      )}
    </LabFrame>
  );
}

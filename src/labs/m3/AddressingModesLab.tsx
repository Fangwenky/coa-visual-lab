import React, { useState } from 'react';
import { LabFrame } from '../../components/DocBlocks';

interface AddrModeSpec {
  id: string;
  name: string;
  speedRank: number;
  irField: string;
  formula: string;
  eaResult: string;
  operand: string;
  memReadsAfterFetch: number;
  steps: string[];
  activeRegs: string[];
  activeMem: string[];
  useAlu: boolean;
  note: string;
}

const MODES: AddrModeSpec[] = [
  {
    id: 'imm',
    name: '1. 立即寻址',
    speedRank: 1,
    irField: 'OP | #50 (立即数)',
    formula: 'S = A（无有效地址）',
    eaResult: '无（操作数在指令内）',
    operand: '50',
    memReadsAfterFetch: 0,
    steps: ['取指令时操作数 #50 已随指令进入 IR', '直接将 IR 地址码段送往运算器，无需再访存'],
    activeRegs: ['IR'],
    activeMem: [],
    useAlu: false,
    note: '速度最快（取指后 0 次访存）；缺点是操作数不能修改且位数受指令字长限制。',
  },
  {
    id: 'reg',
    name: '2. 寄存器寻址',
    speedRank: 2,
    irField: 'OP | R5',
    formula: 'EA = R5，S = (R5)',
    eaResult: 'R5',
    operand: '100',
    memReadsAfterFetch: 0,
    steps: ['从 IR 中读出寄存器编号 R5', '直接从 CPU 内部通用寄存器 R5 取出操作数 100（0 次访存）'],
    activeRegs: ['IR', 'R5'],
    activeMem: [],
    useAlu: false,
    note: '无需访问主存，速度快；寄存器数量少，指令地址码字段很短。',
  },
  {
    id: 'direct',
    name: '3. 直接寻址（绝对寻址）',
    speedRank: 3,
    irField: 'OP | A=100',
    formula: 'EA = A，S = (A)',
    eaResult: '100',
    operand: '200 (主存[100]内容)',
    memReadsAfterFetch: 1,
    steps: ['IR 中的形式地址 A=100 直接作为有效地址 EA=100', '访问主存 100 号单元，读出操作数 200'],
    activeRegs: ['IR'],
    activeMem: ['100'],
    useAlu: false,
    note: '形式地址即真实物理地址，取指后需 1 次访存；寻址范围受限于地址码位数，不易重定位。',
  },
  {
    id: 'reg-ind',
    name: '4. 寄存器间接寻址',
    speedRank: 4,
    irField: 'OP | @R5',
    formula: 'EA = (R5)，S = ((R5))',
    eaResult: '(R5) = 100',
    operand: '200 (主存[100]内容)',
    memReadsAfterFetch: 1,
    steps: ['读取寄存器 R5 的内容得到有效地址 EA = 100', '按地址 100 访问主存 1 次，取出操作数 200'],
    activeRegs: ['IR', 'R5'],
    activeMem: ['100'],
    useAlu: false,
    note: '指令短，且取指后只需 1 次访存（比主存间接寻址少 1 次访存），常用于指针访问。',
  },
  {
    id: 'page',
    name: '5. 页面寻址（当前页）',
    speedRank: 5,
    irField: 'OP | A=38H (页内地址)',
    formula: 'EA = (PC)H ∥ A',
    eaResult: '2FH ∥ 38H = 2F38H',
    operand: '0x9A (主存[2F38H])',
    memReadsAfterFetch: 1,
    steps: ['取出 PC 高位页号 (PC)H = 2FH（PC=2F85H）', '与指令页内地址 38H 直接硬件拼接（无需加法器）得 EA=2F38H', '访问主存 2F38H 取出操作数'],
    activeRegs: ['IR', 'PC'],
    activeMem: ['2F38H'],
    useAlu: false,
    note: '拼接操作无需 ALU 加法延迟，因此比变址/基址/相对寻址更快！零页寻址则高位置全 0（00∥A）。',
  },
  {
    id: 'index',
    name: '6. 变址寻址',
    speedRank: 6,
    irField: 'OP | RX, A=100',
    formula: 'EA = A + (RX)，S = (A + (RX))',
    eaResult: '100 + 20 = 120',
    operand: '42 (主存[120]内容)',
    memReadsAfterFetch: 1,
    steps: ['形式地址 A=100 作为数组首地址基准', 'ALU 将 A(100) 与变址寄存器 RX(20) 相加得 EA=120', '访问主存 120 单元取出数组元素 42'],
    activeRegs: ['IR', 'RX'],
    activeMem: ['120'],
    useAlu: true,
    note: '面向用户，适合循环遍历数组/字符串（指令不变，只需递增 RX）。',
  },
  {
    id: 'base',
    name: '7. 基址寻址',
    speedRank: 6,
    irField: 'OP | Rb, D=20',
    formula: 'EA = (Rb) + D，S = ((Rb) + D)',
    eaResult: '100 + 20 = 120',
    operand: '42 (主存[120]内容)',
    memReadsAfterFetch: 1,
    steps: ['基址寄存器 Rb=100 由操作系统设定程序基址', 'ALU 将 (Rb)=100 加上指令位移量 D=20 得 EA=120', '访问主存 120 单元取出操作数 42'],
    activeRegs: ['IR', 'Rb'],
    activeMem: ['120'],
    useAlu: true,
    note: '面向系统（操作系统/特权指令控制 Rb），用于程序动态重定位与扩大寻址空间！',
  },
  {
    id: 'rel',
    name: '8. 相对寻址',
    speedRank: 6,
    irField: 'OP | D=+20 (或 -20)',
    formula: 'EA = (PC) + D',
    eaResult: '100 + 20 = 120',
    operand: '42 (主存[120]内容)',
    memReadsAfterFetch: 1,
    steps: ['以当前程序计数器 PC=100 为基准', 'ALU 计算 (PC) + D = 100 + 20 = 120（D 可正可负）', '访问主存 120 单元；程序整体浮动时相对距离不变'],
    activeRegs: ['IR', 'PC'],
    activeMem: ['120'],
    useAlu: true,
    note: '广泛用于条件转移指令与浮动代码（位置无关代码），位移量 D 用补码表示可向前/向后跳。',
  },
  {
    id: 'ind1',
    name: '9a. 一级间接寻址',
    speedRank: 7,
    irField: 'OP | @=1, A=100',
    formula: 'EA = (A)，S = ((A))',
    eaResult: '(100) = 200',
    operand: '777 (主存[200]内容)',
    memReadsAfterFetch: 2,
    steps: ['第 1 次访存：读主存 100 号单元，得到其中存放的有效地址 EA=200', '第 2 次访存：按地址 200 读主存，取出真正的操作数 777'],
    activeRegs: ['IR'],
    activeMem: ['100', '200'],
    useAlu: false,
    note: '用短形式地址访问大主存空间，便于实现地址指针；代价是取指后需要 2 次访存。',
  },
  {
    id: 'ind-multi',
    name: '9b. 多级间接寻址',
    speedRank: 8,
    irField: 'OP | @=1, A=100',
    formula: 'EA = (((100))) = 50',
    eaResult: '100 → 200 → 300 → 50',
    operand: '999 (主存[50]内容)',
    memReadsAfterFetch: 4,
    steps: [
      '第 1 次访存：读 [100] 得标志位 1 与地址 200（继续间址）',
      '第 2 次访存：读 [200] 得标志位 1 与地址 300（继续间址）',
      '第 3 次访存：读 [300] 得标志位 0 与最终有效地址 EA=50',
      '第 4 次访存：读 [50] 得到真正的操作数 999',
    ],
    activeRegs: ['IR'],
    activeMem: ['100', '200', '300', '50'],
    useAlu: false,
    note: '复现课件 P36：最高位间址标志 1=继续间址，0=找到 EA；每多一级就多 1 次访存，速度最慢。',
  },
];

export default function AddressingModesLab() {
  const [selectedId, setSelectedId] = useState('index');
  const mode = MODES.find((m) => m.id === selectedId) || MODES[0];

  const regs = [
    { id: 'IR', label: '指令寄存器 IR', val: mode.irField },
    { id: 'R5', label: '通用寄存器 R5', val: '100' },
    { id: 'RX', label: '变址寄存器 RX', val: '20' },
    { id: 'Rb', label: '基址寄存器 Rb', val: '100' },
    { id: 'PC', label: '程序计数器 PC', val: mode.id === 'page' ? '2F85H (页2FH)' : '100' },
  ];

  const mem = [
    { addr: '50', val: '操作数 = 999' },
    { addr: '100', val: mode.id === 'ind-multi' ? '标志1 | 200' : '200 (数值/指针)' },
    { addr: '120', val: '操作数 = 42' },
    { addr: '200', val: mode.id === 'ind-multi' ? '标志1 | 300' : '操作数 = 777' },
    { addr: '300', val: '标志0 | EA=50' },
    { addr: '2F38H', val: '操作数 = 0x9A' },
  ];

  return (
    <LabFrame
      id="lab-3-2"
      code="LAB-3.2"
      title="9 种数据寻址方式动态路径追踪器"
      desc="对应课件 P32–P48：切换不同寻址方式，实时高亮参与运算的寄存器、ALU、主存单元跳转链，以及取指后的主存访问次数与速度排名。"
    >
      <div className="lab-toolbar">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`lab-btn ${m.id === selectedId ? 'primary' : ''}`}
            style={{ fontSize: 12.5, padding: '5px 9px' }}
            onClick={() => setSelectedId(m.id)}
          >
            {m.name}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 14 }}>
        {/* CPU Registers */}
        <div className="lab-subpanel">
          <span className="lab-label">CPU 内部寄存器</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {regs.map((r) => {
              const active = mode.activeRegs.includes(r.id);
              return (
                <div
                  key={r.id}
                  className="mono"
                  style={{
                    padding: '6px 9px',
                    borderRadius: 4,
                    fontSize: 12,
                    border: `1px solid ${active ? '#4ea1ff' : '#25384d'}`,
                    background: active ? 'rgba(78, 161, 255, 0.2)' : '#0e1722',
                    color: active ? '#ffffff' : '#7389a1',
                  }}
                >
                  <div style={{ fontSize: 10.5, opacity: 0.85 }}>{r.label}</div>
                  <div style={{ fontWeight: 700 }}>{r.val}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Address Formation Unit / ALU */}
        <div className="lab-subpanel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 10 }}>
          <div>
            <span className="lab-label">有效地址形成过程</span>
            <div
              className="mono"
              style={{
                padding: '10px',
                borderRadius: 5,
                background: mode.useAlu ? 'rgba(255, 176, 59, 0.16)' : '#0e1722',
                border: `1px solid ${mode.useAlu ? '#ffb03b' : '#2a3f56'}`,
                marginBottom: 10,
              }}
            >
              <div style={{ fontSize: 11, color: '#8ea5be' }}>地址形成公式</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#ffb03b', marginTop: 2 }}>{mode.formula}</div>
              <div style={{ fontSize: 12, color: '#e6eef7', marginTop: 4 }}>
                {mode.useAlu ? '★ 经过 ALU 加法器计算' : '○ 无需 ALU 加法计算'}
              </div>
            </div>

            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: '#d4e1ee', lineHeight: 1.65 }}>
              {mode.steps.map((s, i) => (
                <li key={i} style={{ marginBottom: 4 }}>{s}</li>
              ))}
            </ol>
          </div>

          <div className="lab-metric-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="lab-metric" style={{ background: '#0e1722' }}>
              <div className="lab-metric-k">取指后访存次数</div>
              <div className="lab-metric-v" style={{ color: mode.memReadsAfterFetch === 0 ? '#38d9a9' : '#ffb03b' }}>
                {mode.memReadsAfterFetch} 次
              </div>
            </div>
            <div className="lab-metric" style={{ background: '#0e1722' }}>
              <div className="lab-metric-k">速度排名（1最快）</div>
              <div className="lab-metric-v" style={{ color: '#4ea1ff' }}>第 {mode.speedRank} 档</div>
            </div>
          </div>
        </div>

        {/* Main Memory */}
        <div className="lab-subpanel">
          <span className="lab-label">主存储器（高亮为本次寻址访问链路）</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {mem.map((cell) => {
              const stepIdx = mode.activeMem.indexOf(cell.addr);
              const active = stepIdx !== -1;
              return (
                <div
                  key={cell.addr}
                  className="mono"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 9px',
                    borderRadius: 4,
                    fontSize: 12,
                    border: `1px solid ${active ? '#38d9a9' : '#25384d'}`,
                    background: active ? 'rgba(56, 217, 169, 0.16)' : '#0e1722',
                    color: active ? '#ffffff' : '#7389a1',
                  }}
                >
                  <span>[{cell.addr}]</span>
                  <span style={{ fontWeight: active ? 700 : 400 }}>{cell.val}</span>
                  {active && (
                    <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 3, background: '#0e8265', color: '#fff' }}>
                      第{stepIdx + 1}访
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mono" style={{ marginTop: 10, fontSize: 12.5, color: '#38d9a9', fontWeight: 700 }}>
            最终取出操作数 S = {mode.operand}
          </div>
        </div>
      </div>

      <div className="lab-status-bar">
        <strong>要点速记：</strong>{mode.note}
      </div>
    </LabFrame>
  );
}

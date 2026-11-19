import React, { useEffect, useState } from 'react';
import { Play, Pause, StepForward, StepBack, RotateCcw } from 'lucide-react';
import { LabFrame } from '../../components/DocBlocks';

interface MicroStep {
  phase: '取指周期' | '取数周期' | '执行周期';
  signals: string[];
  rtl: string;
  busValue: string;
  activeUnits: string[];
  regs: Record<string, string>;
  explain: string;
}

const ADD_STEPS: MicroStep[] = [
  {
    phase: '取指周期',
    signals: ['初始待命'],
    rtl: '准备执行 ADD @R0, R1  (实现 ((R0))+(R1)→(R0))',
    busValue: '空闲',
    activeUnits: ['PC'],
    regs: { PC: '100H', MAR: '—', MDR: '—', IR: '—', R0: '200H', R1: '15', Y: '—', Z: '—', MEM200: '27' },
    explain: '初始状态：PC=100H 指向指令 ADD @R0, R1；R0 存放操作数主存地址 200H（主存[200H]=27）；R1 存放加数 15。',
  },
  {
    phase: '取指周期',
    signals: ['PCout', 'MARin'],
    rtl: '(PC) → MAR',
    busValue: '100H (指令地址)',
    activeUnits: ['PC', 'MAR', 'BUS'],
    regs: { PC: '100H', MAR: '100H', MDR: '—', IR: '—', R0: '200H', R1: '15', Y: '—', Z: '—', MEM200: '27' },
    explain: '打开 PC 输出门与 MAR 输入门，把现行指令地址 100H 经内部总线送入 MAR。',
  },
  {
    phase: '取指周期',
    signals: ['Read', '(PC)+1→PC'],
    rtl: 'M(MAR) → MDR；同时 PC 递增',
    busValue: '外部存储总线读出指令',
    activeUnits: ['MAR', 'MEM', 'MDR', 'PC'],
    regs: { PC: '101H', MAR: '100H', MDR: 'ADD @R0,R1', IR: '—', R0: '200H', R1: '15', Y: '—', Z: '—', MEM200: '27' },
    explain: 'CU 向主存发 Read 命令，主存将 100H 处的指令送入 MDR；同时 PC 自增为 101H 指向下条指令。',
  },
  {
    phase: '取指周期',
    signals: ['MDRout', 'IRin'],
    rtl: '(MDR) → IR，送指令译码器 ID 分析',
    busValue: 'ADD @R0, R1',
    activeUnits: ['MDR', 'IR', 'BUS'],
    regs: { PC: '101H', MAR: '100H', MDR: 'ADD @R0,R1', IR: 'ADD @R0,R1', R0: '200H', R1: '15', Y: '—', Z: '—', MEM200: '27' },
    explain: 'MDR 将指令经内部总线送入 IR，指令译码器识别出这是源为寄存器、目的为寄存器间址的加法指令。',
  },
  {
    phase: '取数周期',
    signals: ['R0out', 'MARin'],
    rtl: '(R0) → MAR',
    busValue: '200H (被加数地址)',
    activeUnits: ['R0', 'MAR', 'BUS'],
    regs: { PC: '101H', MAR: '200H', MDR: 'ADD @R0,R1', IR: 'ADD @R0,R1', R0: '200H', R1: '15', Y: '—', Z: '—', MEM200: '27' },
    explain: '因为 @R0 是寄存器间接寻址，必须先把 R0 中的地址 200H 送到 MAR，准备读出被加数。',
  },
  {
    phase: '取数周期',
    signals: ['Read'],
    rtl: 'M(MAR) → MDR',
    busValue: '外部存储总线读数据 27',
    activeUnits: ['MAR', 'MEM', 'MDR'],
    regs: { PC: '101H', MAR: '200H', MDR: '27', IR: 'ADD @R0,R1', R0: '200H', R1: '15', Y: '—', Z: '—', MEM200: '27' },
    explain: 'CU 向主存发 Read 命令，主存 200H 单元中的被加数 27 读入 MDR。',
  },
  {
    phase: '取数周期',
    signals: ['MDRout', 'Yin'],
    rtl: '(MDR) → Y（暂存 ALU 第一操作数）',
    busValue: '27',
    activeUnits: ['MDR', 'Y', 'BUS'],
    regs: { PC: '101H', MAR: '200H', MDR: '27', IR: 'ADD @R0,R1', R0: '200H', R1: '15', Y: '27', Z: '—', MEM200: '27' },
    explain: '单总线同一拍只能传 1 个数，因此必须先把被加数 27 锁存到暂存器 Y，腾出内部总线给第二个操作数 R1！',
  },
  {
    phase: '执行周期',
    signals: ['R1out', 'ALUin', 'ADD'],
    rtl: '(Y) + (R1) → Z',
    busValue: '15 (经总线直入 ALU)',
    activeUnits: ['R1', 'Y', 'ALU', 'Z', 'BUS'],
    regs: { PC: '101H', MAR: '200H', MDR: '27', IR: 'ADD @R0,R1', R0: '200H', R1: '15', Y: '27', Z: '42', MEM200: '27' },
    explain: 'R1(15) 送上总线并进入 ALU，与 Y(27) 在 ADD 信号下相加得 42，锁存至输出暂存器 Z（防止结果立即冲刷总线）。',
  },
  {
    phase: '执行周期',
    signals: ['Zout', 'MDRin'],
    rtl: '(Z) → MDR',
    busValue: '42 (运算和)',
    activeUnits: ['Z', 'MDR', 'BUS'],
    regs: { PC: '101H', MAR: '200H', MDR: '42', IR: 'ADD @R0,R1', R0: '200H', R1: '15', Y: '27', Z: '42', MEM200: '27' },
    explain: '把暂存器 Z 中的结果 42 经内部总线送入 MDR（MAR 中仍保留着 200H，无需重送地址！）。',
  },
  {
    phase: '执行周期',
    signals: ['Write'],
    rtl: '(MDR) → M(MAR)，写回主存 [200H]',
    busValue: '外部存储总线写入 42',
    activeUnits: ['MAR', 'MDR', 'MEM'],
    regs: { PC: '101H', MAR: '200H', MDR: '42', IR: 'ADD @R0,R1', R0: '200H', R1: '15', Y: '27', Z: '42', MEM200: '42' },
    explain: 'CU 发 Write 命令，将 MDR 中的 42 写入主存 200H 单元，指令 ADD @R0, R1 执行完毕！',
  },
];

const JC_STEPS: MicroStep[] = [
  {
    phase: '取指周期',
    signals: ['PCout', 'MARin', 'Read', 'MDRout', 'IRin', '(PC)+1→PC'],
    rtl: '取指公操作：取出条件转移指令 JC +10H，PC=101H',
    busValue: 'JC +10H',
    activeUnits: ['PC', 'MAR', 'MEM', 'MDR', 'IR', 'BUS'],
    regs: { PC: '101H', MAR: '100H', MDR: 'JC +10H', IR: 'JC +10H', R0: 'C=1', R1: '—', Y: '—', Z: '—', MEM200: '—' },
    explain: '条件转移指令 JC A（课件 P31 思考题）：当进位标志 C=1 时，转移目标地址 = (PC) + 位移量 A；若 C=0 则顺序执行下一条。',
  },
  {
    phase: '执行周期',
    signals: ['PCout', 'Yin'],
    rtl: '若 C=1：(PC) → Y',
    busValue: '101H',
    activeUnits: ['PC', 'Y', 'BUS'],
    regs: { PC: '101H', MAR: '100H', MDR: 'JC +10H', IR: 'JC +10H', R0: 'C=1', R1: '—', Y: '101H', Z: '—', MEM200: '—' },
    explain: '检测到 C=1 满足转移条件，先把当前 PC(101H) 送入暂存器 Y。',
  },
  {
    phase: '执行周期',
    signals: ['Ad(IR)out', 'ALUin', 'ADD'],
    rtl: '(Y) + Ad(IR) → Z',
    busValue: '+10H (位移量)',
    activeUnits: ['IR', 'Y', 'ALU', 'Z', 'BUS'],
    regs: { PC: '101H', MAR: '100H', MDR: 'JC +10H', IR: 'JC +10H', R0: 'C=1', R1: '—', Y: '101H', Z: '111H', MEM200: '—' },
    explain: '将 IR 中的位移量字段 Ad(IR)=+10H 送上内部总线，与 Y(101H) 相加得转移目标地址 111H，暂存 Z。',
  },
  {
    phase: '执行周期',
    signals: ['Zout', 'PCin'],
    rtl: '(Z) → PC（完成程序跳转！）',
    busValue: '111H (新 PC)',
    activeUnits: ['Z', 'PC', 'BUS'],
    regs: { PC: '111H', MAR: '100H', MDR: 'JC +10H', IR: 'JC +10H', R0: 'C=1', R1: '—', Y: '101H', Z: '111H', MEM200: '—' },
    explain: '将 Z 中的 111H 写回 PC，下一条取指周期将从 111H 取指令执行！若 C=0，则跳过这三步直接进入下条取指。',
  },
];

export default function SingleBusDatapathLab() {
  const [instr, setInstr] = useState<'add' | 'jc'>('add');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  const steps = instr === 'add' ? ADD_STEPS : JC_STEPS;
  const cur = steps[Math.min(step, steps.length - 1)];

  useEffect(() => {
    if (!playing) return;
    if (step >= steps.length - 1) {
      setPlaying(false);
      return;
    }
    const id = setTimeout(() => setStep((s) => Math.min(s + 1, steps.length - 1)), 1350);
    return () => clearTimeout(id);
  }, [playing, step, steps.length]);

  const boxStyle = (unit: string) => {
    const active = cur.activeUnits.includes(unit);
    return {
      padding: '8px 10px',
      borderRadius: 5,
      border: `1px solid ${active ? '#38d9a9' : '#2a3f56'}`,
      background: active ? 'rgba(56, 217, 169, 0.16)' : '#0e1722',
      color: active ? '#ffffff' : '#96adc4',
    };
  };

  return (
    <LabFrame
      id="lab-5-1"
      code="LAB-5.1"
      title="单总线 CPU 数据通路 & 微操作序列步进执行台"
      desc="复现课件 P28–P31 单总线结构（含暂存器 Y、Z 的必要性）：单步执行 ADD @R0, R1 与条件转移 JC A，实时观察控制信号与总线脉冲。"
    >
      <div className="lab-toolbar">
        <button
          type="button"
          className={`lab-btn ${instr === 'add' ? 'primary' : ''}`}
          onClick={() => { setInstr('add'); setStep(0); setPlaying(false); }}
        >
          加法指令 ADD @R0, R1（P28–P31）
        </button>
        <button
          type="button"
          className={`lab-btn ${instr === 'jc' ? 'primary' : ''}`}
          onClick={() => { setInstr('jc'); setStep(0); setPlaying(false); }}
        >
          条件转移 JC A（P31思考题）
        </button>
        <div style={{ flex: 1 }} />
        <button type="button" className="lab-btn" disabled={step === 0} onClick={() => { setPlaying(false); setStep((s) => s - 1); }}>
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
        <button type="button" className="lab-btn" disabled={step >= steps.length - 1} onClick={() => { setPlaying(false); setStep((s) => s + 1); }}>
          下一步 <StepForward size={14} />
        </button>
        <button type="button" className="lab-btn" onClick={() => { setPlaying(false); setStep(0); }}>
          <RotateCcw size={14} /> 重置
        </button>
      </div>

      {/* Active Control Signals Strip */}
      <div className="lab-subpanel" style={{ marginBottom: 12, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
        <span className="mono" style={{ fontSize: 12, padding: '2px 7px', borderRadius: 3, background: '#1e3a5f', color: '#82bfff', fontWeight: 700 }}>
          {cur.phase} · 步 {step}/{steps.length - 1}
        </span>
        <span style={{ fontSize: 12.5, color: '#8ea5be' }}>有效控制信号：</span>
        {cur.signals.map((sig) => (
          <span key={sig} className="mono" style={{ fontSize: 12, padding: '2px 8px', borderRadius: 3, background: 'rgba(255,176,59,0.2)', border: '1px solid #ffb03b', color: '#ffd89b', fontWeight: 700 }}>
            {sig}
          </span>
        ))}
        <span className="mono" style={{ marginLeft: 'auto', fontSize: 13, color: '#38d9a9', fontWeight: 700 }}>
          {cur.rtl}
        </span>
      </div>

      {/* Single-bus Datapath Schematic */}
      <div className="lab-subpanel" style={{ marginBottom: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(115px, 1fr))', gap: 8 }} className="mono">
          <div style={boxStyle('PC')}>
            <div style={{ fontSize: 10.5, opacity: 0.8 }}>PC (程序计数器)</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{cur.regs.PC}</div>
          </div>
          <div style={boxStyle('IR')}>
            <div style={{ fontSize: 10.5, opacity: 0.8 }}>IR (指令寄存器)</div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{cur.regs.IR}</div>
          </div>
          <div style={boxStyle('MAR')}>
            <div style={{ fontSize: 10.5, opacity: 0.8 }}>MAR (地址寄存器)</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{cur.regs.MAR}</div>
          </div>
          <div style={boxStyle('MDR')}>
            <div style={{ fontSize: 10.5, opacity: 0.8 }}>MDR (数据寄存器)</div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{cur.regs.MDR}</div>
          </div>
          <div style={boxStyle('MEM')}>
            <div style={{ fontSize: 10.5, opacity: 0.8 }}>主存 [200H]</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#ffb03b' }}>{cur.regs.MEM200}</div>
          </div>
        </div>

        {/* CPU Internal Bus */}
        <div
          className="mono"
          style={{
            margin: '12px 0',
            padding: '8px 12px',
            borderRadius: 4,
            textAlign: 'center',
            fontSize: 12.5,
            fontWeight: 700,
            background: cur.activeUnits.includes('BUS') ? 'rgba(78, 161, 255, 0.22)' : '#0b121a',
            border: `2px solid ${cur.activeUnits.includes('BUS') ? '#4ea1ff' : '#25384d'}`,
            color: cur.activeUnits.includes('BUS') ? '#ffffff' : '#6c8198',
          }}
        >
          ══ CPU 内部单总线（同一拍仅允许 1 个部件送出数据） · 当前数据：{cur.busValue} ══
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(115px, 1fr))', gap: 8 }} className="mono">
          <div style={boxStyle('R0')}>
            <div style={{ fontSize: 10.5, opacity: 0.8 }}>{instr === 'add' ? 'R0 (存地址)' : 'PSWR (进位C)'}</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{cur.regs.R0}</div>
          </div>
          <div style={boxStyle('R1')}>
            <div style={{ fontSize: 10.5, opacity: 0.8 }}>R1 (加数)</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{cur.regs.R1}</div>
          </div>
          <div style={boxStyle('Y')}>
            <div style={{ fontSize: 10.5, opacity: 0.8 }}>暂存器 Y (ALU输入1)</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{cur.regs.Y}</div>
          </div>
          <div style={boxStyle('ALU')}>
            <div style={{ fontSize: 10.5, opacity: 0.8 }}>ALU 算术逻辑单元</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: cur.activeUnits.includes('ALU') ? '#ffb03b' : undefined }}>
              {cur.activeUnits.includes('ALU') ? '执行 ADD' : '待命'}
            </div>
          </div>
          <div style={boxStyle('Z')}>
            <div style={{ fontSize: 10.5, opacity: 0.8 }}>暂存器 Z (ALU输出)</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{cur.regs.Z}</div>
          </div>
        </div>
      </div>

      <div className="lab-status-bar">{cur.explain}</div>
    </LabFrame>
  );
}

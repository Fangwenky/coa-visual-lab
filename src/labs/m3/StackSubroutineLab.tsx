import React, { useState } from 'react';
import { LabFrame } from '../../components/DocBlocks';

export default function StackSubroutineLab() {
  const [tab, setTab] = useState<'stack' | 'recursion' | 'shift'>('stack');

  // Soft stack state (Slide P54-P55: bottom=2000H, grows downward, SP points to full top cell)
  const [stackItems, setStackItems] = useState<string[]>(['0x00A1']);
  const [pushVal, setPushVal] = useState('0x1234');
  const [lastLog, setLastLog] = useState('初始栈顶 SP = 2000H，存放数据 0x00A1（自底向上生成，SP 始终指向栈顶满单元）。');

  const spAddr = 0x2000 - (stackItems.length - 1);

  const doPush = () => {
    if (stackItems.length >= 6) {
      setLastLog('演示栈区已满（最多演示 6 层），请先 POP。');
      return;
    }
    const nextSp = spAddr - 1;
    setStackItems((prev) => [...prev, pushVal || '0x0000']);
    setLastLog(`执行 PUSH ${pushVal}：① 先修改栈指针 (SP)-1 → SP (${nextSp.toString(16).toUpperCase()}H)；② 再压入数据 (${pushVal}) → (SP)。`);
    setPushVal(`0x${Math.floor(Math.random() * 0xfff + 0x100).toString(16).toUpperCase()}`);
  };

  const doPop = () => {
    if (stackItems.length === 0) {
      setLastLog('栈空，无法弹出！');
      return;
    }
    const popped = stackItems[stackItems.length - 1];
    const nextSp = spAddr + 1;
    setStackItems((prev) => prev.slice(0, -1));
    setLastLog(`执行 POP：① 先弹出栈顶数据 ((SP)) = ${popped}；② 再修改栈指针 (SP)+1 → SP (${nextSp.toString(16).toUpperCase()}H)。`);
  };

  // Recursion comparison state (Slides P67 vs P70)
  const [recStep, setRecStep] = useState(0);
  const recSteps = [
    {
      desc: '主程序在地址 K 执行 CALL A（返回地址 K+1）',
      stack: ['K+1'],
      firstCell: 'K+1',
      conflict: false,
    },
    {
      desc: '子程序 A 内部在地址 L 递归执行 CALL A（返回地址 L+1）',
      stack: ['K+1', 'L+1'],
      firstCell: 'L+1（覆盖了 K+1！）',
      conflict: true,
    },
    {
      desc: '最内层 A 执行 RET 返回 L+1；再执行外层 RET 试图返回主程序',
      stack: ['K+1 → 顺利回到主程序 K+1！'],
      firstCell: '依然是 L+1 → 死循环无法返回主程序！',
      conflict: true,
    },
  ];

  // 8-bit Shift lab (Slide P62)
  const [bits, setBits] = useState<number[]>([1, 0, 1, 1, 0, 1, 0, 0]);
  const [cf, setCf] = useState(1);
  const [shiftDesc, setShiftDesc] = useState('点击下方任意移位指令，实时观察符号位、补位 0/1 与进位位 CF 的变化。');

  const doShift = (type: string) => {
    const b = [...bits];
    let nextCf = cf;
    if (type === 'asl') {
      // 算术左移：符号位不变，数值位左移，低位补0
      nextCf = b[1];
      const next = [b[0], ...b.slice(2), 0];
      setBits(next);
      setCf(nextCf);
      setShiftDesc('算术左移：符号位 b7 保持不变，数值位左移 1 位（×2），最低位补 0，原最高数值位进 CF。');
    } else if (type === 'asr') {
      // 算术右移：符号位不变并向右复制
      nextCf = b[7];
      const next = [b[0], b[0], ...b.slice(1, 7)];
      setBits(next);
      setCf(nextCf);
      setShiftDesc('算术右移：符号位 b7 保持不变并补入次高位（÷2，补码符号扩展），最低位出至 CF。');
    } else if (type === 'lsl') {
      nextCf = b[0];
      setBits([...b.slice(1), 0]);
      setCf(nextCf);
      setShiftDesc('逻辑左移：无视符号位，全部 8 位左移，低位补 0，最高位移入 CF。');
    } else if (type === 'lsr') {
      nextCf = b[7];
      setBits([0, ...b.slice(0, 7)]);
      setCf(nextCf);
      setShiftDesc('逻辑右移：无视符号位，全部 8 位右移，最高位补 0，最低位移入 CF。');
    } else if (type === 'rol') {
      nextCf = b[0];
      setBits([...b.slice(1), b[0]]);
      setCf(nextCf);
      setShiftDesc('小循环左移（不带进位）：最高位绕回最低位，同时拷贝一份给 CF。');
    } else if (type === 'rcl') {
      nextCf = b[0];
      setBits([...b.slice(1), cf]);
      setCf(nextCf);
      setShiftDesc('大循环左移（带进位 CF）：CF 参与 9 位大循环，原 CF 进入最低位，最高位进入 CF。');
    }
  };

  return (
    <LabFrame
      id="lab-3-3"
      code="LAB-3.3"
      title="软堆栈 (SP) 压栈/出栈、递归断点保存对比 & 移位指令实验台"
      desc="对应课件 P53–P55、P62、P66–P70：彻底搞懂 PUSH 先减后存 vs POP 先取后加、为什么首单元保存返回地址不能递归，以及 6 种移位指令区别。"
    >
      <div className="lab-toolbar">
        <button type="button" className={`lab-btn ${tab === 'stack' ? 'primary' : ''}`} onClick={() => setTab('stack')}>
          软堆栈 PUSH / POP（P54）
        </button>
        <button type="button" className={`lab-btn ${tab === 'recursion' ? 'primary' : ''}`} onClick={() => setTab('recursion')}>
          子程序递归：堆栈 vs 首单元（P67/P70）
        </button>
        <button type="button" className={`lab-btn ${tab === 'shift' ? 'primary' : ''}`} onClick={() => setTab('shift')}>
          8位算术/逻辑/大小循环移位（P62）
        </button>
      </div>

      {tab === 'stack' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="lab-toolbar" style={{ marginBottom: 0 }}>
            <input
              type="text"
              className="lab-input"
              style={{ width: 100 }}
              value={pushVal}
              onChange={(e) => setPushVal(e.target.value)}
            />
            <button type="button" className="lab-btn primary" onClick={doPush}>
              PUSH 进栈 (SP-1 后写入)
            </button>
            <button type="button" className="lab-btn" onClick={doPop}>
              POP 出栈 (读出后 SP+1)
            </button>
            <span className="mono" style={{ marginLeft: 'auto', color: '#38d9a9', fontSize: 13 }}>
              当前 SP = {stackItems.length > 0 ? `${spAddr.toString(16).toUpperCase()}H` : '2001H (栈空)'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }} className="mono">
            {[0x1ffb, 0x1ffc, 0x1ffd, 0x1ffe, 0x1fff, 0x2000].map((addr) => {
              const idxFromBottom = 0x2000 - addr;
              const val = stackItems[idxFromBottom];
              const isSp = stackItems.length > 0 && addr === spAddr;
              return (
                <div
                  key={addr}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 12px',
                    borderRadius: 4,
                    fontSize: 12.5,
                    background: isSp ? 'rgba(56, 217, 169, 0.18)' : val ? 'rgba(78, 161, 255, 0.1)' : '#14202e',
                    border: `1px solid ${isSp ? '#38d9a9' : val ? '#335375' : '#223347'}`,
                  }}
                >
                  <span style={{ color: '#8ea5be' }}>
                    {addr.toString(16).toUpperCase()}H {addr === 0x2000 ? '(栈底·高地址)' : addr === 0x1ffb ? '(低地址方向↑)' : ''}
                  </span>
                  <strong style={{ color: val ? '#ffffff' : '#4a5f75' }}>{val || '— 空闲单元 —'}</strong>
                  <span style={{ width: 92, textAlign: 'right', color: '#38d9a9', fontWeight: 700 }}>
                    {isSp ? '◀ SP (栈顶)' : ''}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="lab-status-bar">{lastLog}</div>
        </div>
      )}

      {tab === 'recursion' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="lab-toolbar" style={{ marginBottom: 0 }}>
            {[0, 1, 2].map((s) => (
              <button key={s} type="button" className={`lab-btn ${recStep === s ? 'primary' : ''}`} onClick={() => setRecStep(s)}>
                阶段 {s + 1}
              </button>
            ))}
          </div>
          <div className="lab-status-bar" style={{ marginTop: 0 }}>
            当前执行动作：<strong>{recSteps[recStep].desc}</strong>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
            <div className="lab-subpanel" style={{ borderColor: '#38d9a9' }}>
              <strong style={{ color: '#38d9a9', display: 'block', marginBottom: 8 }}>方案 A：利用堆栈保存返回地址（支持递归 ✓）</strong>
              <div className="mono" style={{ display: 'flex', flexDirection: 'column-reverse', gap: 5 }}>
                {recSteps[recStep].stack.map((item, i) => (
                  <div key={i} style={{ padding: '7px 10px', borderRadius: 4, background: 'rgba(56,217,169,0.16)', border: '1px solid #38d9a9' }}>
                    栈层 {i + 1}：{item}
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 12.5, color: '#9ab0c7', marginBottom: 0 }}>
                每次 CALL 都新压栈，L+1 与 K+1 互不覆盖；RET 零地址指令按 LIFO 顺序逐层安全返回。
              </p>
            </div>
            <div className="lab-subpanel" style={{ borderColor: recSteps[recStep].conflict ? '#ff6b6b' : '#2a3f56' }}>
              <strong style={{ color: '#ffb03b', display: 'block', marginBottom: 8 }}>方案 B：子程序首单元保存（不能递归 ✗，如 Cyber70）</strong>
              <div
                className="mono"
                style={{
                  padding: '10px 12px',
                  borderRadius: 4,
                  background: recSteps[recStep].conflict ? 'rgba(255,107,107,0.2)' : '#0e1722',
                  border: `1px solid ${recSteps[recStep].conflict ? '#ff6b6b' : '#2a3f56'}`,
                  color: recSteps[recStep].conflict ? '#ff9999' : '#e6eef7',
                }}
              >
                子程序 A 首单元 [A] = {recSteps[recStep].firstCell}
              </div>
              <p style={{ fontSize: 12.5, color: '#9ab0c7', marginBottom: 0 }}>
                可实现不同子程序的多重嵌套（A→B→C 各自占独立首单元），但递归调用自身时会覆写 A 的唯一首单元，丢失主程序返回点 K+1！
              </p>
            </div>
          </div>
        </div>
      )}

      {tab === 'shift' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'center', padding: '12px 0' }}>
            <div style={{ textAlign: 'center', marginRight: 12 }}>
              <div className="mono" style={{ fontSize: 11, color: '#ffb03b', marginBottom: 4 }}>进位 CF</div>
              <button type="button" className={`bit-cell sign ${cf ? 'one' : ''}`} onClick={() => setCf((v) => 1 - v)}>
                {cf}
              </button>
            </div>
            {bits.map((b, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div className="mono" style={{ fontSize: 11, color: i === 0 ? '#38d9a9' : '#8ea5be', marginBottom: 4 }}>
                  {i === 0 ? '符号b7' : `b${7 - i}`}
                </div>
                <button
                  type="button"
                  className={`bit-cell ${i === 0 ? 'exp' : ''} ${b ? 'one' : ''}`}
                  onClick={() => setBits((prev) => prev.map((v, idx) => (idx === i ? 1 - v : v)))}
                >
                  {b}
                </button>
              </div>
            ))}
          </div>

          <div className="lab-toolbar" style={{ justifyContent: 'center', marginBottom: 0 }}>
            <button type="button" className="lab-btn" onClick={() => doShift('asl')}>算术左移</button>
            <button type="button" className="lab-btn" onClick={() => doShift('asr')}>算术右移</button>
            <button type="button" className="lab-btn" onClick={() => doShift('lsl')}>逻辑左移</button>
            <button type="button" className="lab-btn" onClick={() => doShift('lsr')}>逻辑右移</button>
            <button type="button" className="lab-btn" onClick={() => doShift('rol')}>小循环左移(不带CF)</button>
            <button type="button" className="lab-btn" onClick={() => doShift('rcl')}>大循环左移(带CF)</button>
          </div>
          <div className="lab-status-bar">{shiftDesc}</div>
        </div>
      )}
    </LabFrame>
  );
}

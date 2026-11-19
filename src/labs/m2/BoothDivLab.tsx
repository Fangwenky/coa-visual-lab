import React, { useState } from 'react';
import { StepForward, StepBack, RotateCcw } from 'lucide-react';
import { LabFrame } from '../../components/DocBlocks';

function toBinFixed(val: number, bits: number) {
  const mask = (1 << bits) - 1;
  return ((val & mask) >>> 0).toString(2).padStart(bits, '0');
}

function fmtDoubleSign(val: number, magBits: number) {
  const s = toBinFixed(val, magBits + 2);
  return `${s.slice(0, 2)}.${s.slice(2)}`;
}

interface BoothRow {
  step: number;
  op: string;
  aStr: string;
  cStr: string;
  yExtra: string;
  note: string;
}

// 4-bit fractional fixed-point Booth multiplier (scaled by 16: e.g. -0.1101 => -13/16)
function buildBoothSteps(xInt: number, yInt: number): { rows: BoothRow[]; xBu: string; negXBu: string; yBu: string; prodBin: string; prodDec: number } {
  const n = 4;
  // Double-sign 6-bit integer representing x * 16 in two's complement
  const xBu6 = xInt & 0x3f;
  const negXBu6 = (-xInt) & 0x3f;
  // C holds [Y]补 in 5 bits (1 sign + 4 mag)
  let A = 0; // 6-bit double-sign
  let C = yInt & 0x1f; // 5-bit
  let yExtra = 0;

  const rows: BoothRow[] = [
    {
      step: 0,
      op: '初值',
      aStr: fmtDoubleSign(A, n),
      cStr: `${toBinFixed(C, 5)[0]}.${toBinFixed(C, 5).slice(1)}`,
      yExtra: String(yExtra),
      note: 'A=00.0000，C 存 [Y]补，附加位 Yn+1=0',
    },
  ];

  for (let i = 1; i <= n + 1; i++) {
    const yn = C & 1;
    const pair = `${yn}${yExtra}`;
    let addLabel = '+0';
    if (pair === '01') {
      A = (A + xBu6) & 0x3f;
      addLabel = '+[X]补';
    } else if (pair === '10') {
      A = (A + negXBu6) & 0x3f;
      addLabel = '+[-X]补';
    }

    const isLast = i === n + 1;
    if (!isLast) {
      // Arithmetic right shift of (A, C, yExtra) together
      const aSign = (A >> 5) & 1;
      const aLsb = A & 1;
      const cLsb = C & 1;
      A = ((aSign << 5) | (A >> 1)) & 0x3f;
      C = ((aLsb << 4) | (C >> 1)) & 0x1f;
      yExtra = cLsb;
    }

    rows.push({
      step: i,
      op: `判位 ${pair} → ${addLabel}${isLast ? '（末步不移位）' : ' → 右移1位'}`,
      aStr: fmtDoubleSign(A, n),
      cStr: toBinFixed(C, 5),
      yExtra: String(yExtra),
      note: isLast
        ? `第 ${n + 1} 步只累加不移位，得到最终乘积补码`
        : `根据 YnYn+1=${pair} 执行 ${addLabel}，再按补码规则算术右移 1 位`,
    });
  }

  // Final product: single sign from A[4], 4 high mag bits A[3..0], 4 low mag bits C[4..1]
  const prodSign = (A >> 4) & 1;
  const prodHigh = toBinFixed(A & 0x0f, 4);
  const prodLow = toBinFixed((C >> 1) & 0x0f, 4);
  const prodBin = `${prodSign}.${prodHigh}${prodLow}`;
  const prodDec = (xInt / 16) * (yInt / 16);

  return {
    rows,
    xBu: fmtDoubleSign(xBu6, 4),
    negXBu: fmtDoubleSign(negXBu6, 4),
    yBu: `${toBinFixed(yInt & 0x1f, 5)[0]}.${toBinFixed(yInt & 0x1f, 5).slice(1)}`,
    prodBin,
    prodDec,
  };
}

interface DivRow {
  step: number;
  action: string;
  aStr: string;
  cStr: string;
  qBit: string;
  note: string;
}

// 4-bit fractional restoring-free (加减交替) 2's complement division (Slide P50: X=0.1000 (+8/16), Y=-0.1010 (-10/16))
function buildDivSteps(xInt: number, yInt: number): { rows: DivRow[]; qBin: string; qDec: number } {
  const n = 4;
  const yBu6 = yInt & 0x3f;
  const negYBu6 = (-yInt) & 0x3f;
  const ySign = yInt < 0 ? 1 : 0;

  let A = xInt & 0x3f;
  let Qbits = '';
  const rows: DivRow[] = [
    {
      step: 0,
      action: '初值',
      aStr: fmtDoubleSign(A, n),
      cStr: '0.0000',
      qBit: '—',
      note: `A=[X]补=${fmtDoubleSign(A, n)}，B=[Y]补=${fmtDoubleSign(yBu6, n)}，C=0`,
    },
  ];

  // Step 1: compare initial sign of X and Y
  const initSame = ((A >> 5) & 1) === ySign;
  A = (A + (initSame ? negYBu6 : yBu6)) & 0x3f;
  let rSign = (A >> 5) & 1;
  let q0 = rSign === ySign ? 1 : 0;
  Qbits += String(q0);
  rows.push({
    step: 1,
    action: initSame ? '同号，+[-Y]补' : '异号，+[Y]补',
    aStr: fmtDoubleSign(A, n),
    cStr: `${Qbits.padStart(5, '0')[0]}.${Qbits.padStart(5, '0').slice(1)}`,
    qBit: `商符号位 Q0=${q0}`,
    note: `[X]补与[Y]补${initSame ? '同号减除数' : '异号加除数'}；新余数与[Y]补${rSign === ySign ? '同号，上商 1' : '异号，上商 0'}`,
  });

  for (let i = 1; i <= n; i++) {
    const isLast = i === n;
    // Left shift A by 1
    A = (A << 1) & 0x3f;
    const opStr = q0 === 1 ? '左移1位，+[-Y]补' : '左移1位，+[Y]补';
    A = (A + (q0 === 1 ? negYBu6 : yBu6)) & 0x3f;
    rSign = (A >> 5) & 1;
    if (isLast) {
      q0 = 1; // 末位恒置1
    } else {
      q0 = rSign === ySign ? 1 : 0;
    }
    Qbits += String(q0);
    const padded = Qbits.padStart(5, '0');
    rows.push({
      step: i + 1,
      action: opStr,
      aStr: fmtDoubleSign(A, n),
      cStr: `${padded[0]}.${padded.slice(1)}`,
      qBit: isLast ? '末位恒置 1' : `上商 ${q0}`,
      note: isLast
        ? '最后一步采用末位恒置 1 舍入法（误差 ≤ 2⁻ⁿ），得到商的补码'
        : `由上步商值决定${opStr}；新余数与[Y]补${rSign === ySign ? '同号，上商 1' : '异号，上商 0'}`,
    });
  }

  const qBin = `${Qbits[0]}.${Qbits.slice(1)}`;
  return { rows, qBin, qDec: xInt / yInt };
}

export default function BoothDivLab() {
  const [mode, setMode] = useState<'booth' | 'div'>('booth');

  // Booth state (scaled by 16): Slide P48: X = -0.1101 (-13), Y = +0.1011 (+11)
  const [bx, setBx] = useState(-13);
  const [by, setBy] = useState(11);
  const [bStep, setBStep] = useState(5);

  // Div state (scaled by 16): Slide P50: X = +0.1000 (+8), Y = -0.1010 (-10)
  const [dx, setDx] = useState(8);
  const [dy, setDy] = useState(-10);
  const [dStep, setDStep] = useState(5);

  const booth = buildBoothSteps(bx, by);
  const divRes = buildDivSteps(dx, dy);

  return (
    <LabFrame
      id="lab-2-4"
      code="LAB-2.4"
      title="Booth 补码一位乘法 & 补码加减交替除法 步进模拟器"
      desc="内置课件 P48 Booth 原题（X=-0.1101, Y=0.1011）与 P50 补码除法原题（X=0.1000, Y=-0.1010），支持单步推演部分积与商寄存器变化。"
    >
      <div className="lab-toolbar">
        <button type="button" className={`lab-btn ${mode === 'booth' ? 'primary' : ''}`} onClick={() => setMode('booth')}>
          Booth 补码一位乘法（P48）
        </button>
        <button type="button" className={`lab-btn ${mode === 'div' ? 'primary' : ''}`} onClick={() => setMode('div')}>
          补码加减交替除法（P50）
        </button>
      </div>

      {mode === 'booth' ? (
        <div>
          <div className="lab-toolbar">
            <label style={{ fontSize: 13 }}>
              被乘数 X：
              <select
                className="lab-select"
                style={{ marginLeft: 6 }}
                value={bx}
                onChange={(e) => { setBx(Number(e.target.value)); setBStep(0); }}
              >
                <option value={-13}>-0.1101 (课件原题 -13/16)</option>
                <option value={13}>+0.1101 (+13/16)</option>
                <option value={-11}>-0.1011 (-11/16)</option>
                <option value={7}>+0.0111 (+7/16)</option>
              </select>
            </label>
            <label style={{ fontSize: 13 }}>
              乘数 Y：
              <select
                className="lab-select"
                style={{ marginLeft: 6 }}
                value={by}
                onChange={(e) => { setBy(Number(e.target.value)); setBStep(0); }}
              >
                <option value={11}>+0.1011 (课件原题 +11/16)</option>
                <option value={-11}>-0.1011 (-11/16)</option>
                <option value={-5}>-0.0101 (-5/16)</option>
                <option value={9}>+0.1001 (+9/16)</option>
              </select>
            </label>
            <div style={{ flex: 1 }} />
            <button type="button" className="lab-btn" disabled={bStep <= 0} onClick={() => setBStep((s) => s - 1)}>
              <StepBack size={14} /> 上一步
            </button>
            <button type="button" className="lab-btn primary" disabled={bStep >= 5} onClick={() => setBStep((s) => s + 1)}>
              下一步 <StepForward size={14} />
            </button>
            <button type="button" className="lab-btn" onClick={() => setBStep(0)}>
              <RotateCcw size={14} /> 重置
            </button>
          </div>

          <div className="mono" style={{ fontSize: 12.5, color: '#8ea5be', marginBottom: 10 }}>
            [X]补 = <strong style={{ color: '#4ea1ff' }}>{booth.xBu}</strong> ｜ [-X]补 ={' '}
            <strong style={{ color: '#ffb03b' }}>{booth.negXBu}</strong> ｜ [Y]补 ={' '}
            <strong style={{ color: '#38d9a9' }}>{booth.yBu}</strong>（共需 n+1=5 次累加，n=4 次右移）
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="mono" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.8 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2a3f56', color: '#8ea5be', textAlign: 'left' }}>
                  <th style={{ padding: '7px 8px' }}>步数</th>
                  <th style={{ padding: '7px 8px' }}>寄存器 A (双符号部分积)</th>
                  <th style={{ padding: '7px 8px' }}>寄存器 C (乘数/低位积)</th>
                  <th style={{ padding: '7px 8px' }}>附加位 Yn+1</th>
                  <th style={{ padding: '7px 8px' }}>操作规则</th>
                </tr>
              </thead>
              <tbody>
                {booth.rows.slice(0, bStep + 1).map((r, i) => {
                  const active = i === bStep;
                  return (
                    <tr
                      key={r.step}
                      style={{
                        background: active ? 'rgba(78, 161, 255, 0.16)' : 'transparent',
                        borderBottom: '1px solid #1d2e41',
                      }}
                    >
                      <td style={{ padding: '7px 8px', color: '#8ea5be' }}>#{r.step}</td>
                      <td style={{ padding: '7px 8px', color: '#38d9a9', fontWeight: active ? 700 : 500 }}>{r.aStr}</td>
                      <td style={{ padding: '7px 8px', color: '#4ea1ff' }}>{r.cStr}</td>
                      <td style={{ padding: '7px 8px', color: '#ffb03b', fontWeight: 700 }}>{r.yExtra}</td>
                      <td style={{ padding: '7px 8px', color: '#e6eef7' }}>{r.op}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="lab-status-bar">
            当前说明：{booth.rows[bStep].note}
            {bStep === 5 && (
              <div className="mono" style={{ marginTop: 4, color: '#38d9a9', fontWeight: 700 }}>
                最终结果：[X×Y]补 = {booth.prodBin}（真值 = {booth.prodDec.toFixed(6)}）
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          <div className="lab-toolbar">
            <label style={{ fontSize: 13 }}>
              被除数 X（|X|&lt;|Y|防溢出）：
              <select
                className="lab-select"
                style={{ marginLeft: 6 }}
                value={dx}
                onChange={(e) => { setDx(Number(e.target.value)); setDStep(0); }}
              >
                <option value={8}>+0.1000 (课件原题 +8/16)</option>
                <option value={-8}>-0.1000 (-8/16)</option>
                <option value={6}>+0.0110 (+6/16)</option>
              </select>
            </label>
            <label style={{ fontSize: 13 }}>
              除数 Y：
              <select
                className="lab-select"
                style={{ marginLeft: 6 }}
                value={dy}
                onChange={(e) => { setDy(Number(e.target.value)); setDStep(0); }}
              >
                <option value={-10}>-0.1010 (课件原题 -10/16)</option>
                <option value={10}>+0.1010 (+10/16)</option>
                <option value={-12}>-0.1100 (-12/16)</option>
              </select>
            </label>
            <div style={{ flex: 1 }} />
            <button type="button" className="lab-btn" disabled={dStep <= 0} onClick={() => setDStep((s) => s - 1)}>
              <StepBack size={14} /> 上一步
            </button>
            <button type="button" className="lab-btn primary" disabled={dStep >= 5} onClick={() => setDStep((s) => s + 1)}>
              下一步 <StepForward size={14} />
            </button>
            <button type="button" className="lab-btn" onClick={() => setDStep(0)}>
              <RotateCcw size={14} /> 重置
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="mono" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.8 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2a3f56', color: '#8ea5be', textAlign: 'left' }}>
                  <th style={{ padding: '7px 8px' }}>步数</th>
                  <th style={{ padding: '7px 8px' }}>加减与移位操作</th>
                  <th style={{ padding: '7px 8px' }}>余数寄存器 A (双符号)</th>
                  <th style={{ padding: '7px 8px' }}>商寄存器 C</th>
                  <th style={{ padding: '7px 8px' }}>本步上商</th>
                </tr>
              </thead>
              <tbody>
                {divRes.rows.slice(0, dStep + 1).map((r, i) => {
                  const active = i === dStep;
                  return (
                    <tr
                      key={r.step}
                      style={{
                        background: active ? 'rgba(56, 217, 169, 0.14)' : 'transparent',
                        borderBottom: '1px solid #1d2e41',
                      }}
                    >
                      <td style={{ padding: '7px 8px', color: '#8ea5be' }}>#{r.step}</td>
                      <td style={{ padding: '7px 8px', color: '#e6eef7' }}>{r.action}</td>
                      <td style={{ padding: '7px 8px', color: '#4ea1ff', fontWeight: active ? 700 : 500 }}>{r.aStr}</td>
                      <td style={{ padding: '7px 8px', color: '#38d9a9', fontWeight: 700 }}>{r.cStr}</td>
                      <td style={{ padding: '7px 8px', color: '#ffb03b' }}>{r.qBit}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="lab-status-bar">
            当前说明：{divRes.rows[dStep].note}
            {dStep === 5 && (
              <div className="mono" style={{ marginTop: 4, color: '#38d9a9', fontWeight: 700 }}>
                最终商补码：[Q]补 = {divRes.qBin}（理论真值 X÷Y = {divRes.qDec.toFixed(4)}）
              </div>
            )}
          </div>
        </div>
      )}
    </LabFrame>
  );
}

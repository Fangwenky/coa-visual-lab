import React, { useState } from 'react';
import { LabFrame } from '../../components/DocBlocks';

function floatToBits(num: number): number[] {
  const buf = new ArrayBuffer(4);
  const view = new DataView(buf);
  view.setFloat32(0, num, false);
  const u = view.getUint32(0, false);
  const bits: number[] = [];
  for (let i = 31; i >= 0; i--) bits.push((u >>> i) & 1);
  return bits;
}

function bitsToFloat(bits: number[]): { value: number; hex: string; u32: number } {
  let u = 0;
  for (let i = 0; i < 32; i++) u = ((u << 1) | bits[i]) >>> 0;
  const buf = new ArrayBuffer(4);
  const view = new DataView(buf);
  view.setUint32(0, u, false);
  return {
    value: view.getFloat32(0, false),
    hex: u.toString(16).toUpperCase().padStart(8, '0'),
    u32: u,
  };
}

export default function Ieee754Lab() {
  const [bits, setBits] = useState<number[]>(() => floatToBits(100.25));
  const [inputText, setInputText] = useState('100.25');

  const sign = bits[0];
  const expBits = bits.slice(1, 9);
  const fracBits = bits.slice(9, 32);
  const expRaw = parseInt(expBits.join(''), 2);
  const expUnbiased = expRaw - 127;
  const { value, hex } = bitsToFloat(bits);

  const isZero = expRaw === 0 && fracBits.every((b) => b === 0);
  const isSubnormal = expRaw === 0 && !isZero;
  const isInf = expRaw === 255 && fracBits.every((b) => b === 0);
  const isNaNVal = expRaw === 255 && !isInf;

  // Calculate exact fraction sum
  let fracVal = 0;
  for (let i = 0; i < 23; i++) {
    if (fracBits[i] === 1) fracVal += Math.pow(2, -(i + 1));
  }

  const applyDecimal = (str: string) => {
    setInputText(str);
    const n = Number(str);
    if (!Number.isNaN(n)) {
      setBits(floatToBits(n));
    }
  };

  const toggleBit = (index: number) => {
    const next = [...bits];
    next[index] = 1 - next[index];
    setBits(next);
    const decoded = bitsToFloat(next).value;
    setInputText(Number.isFinite(decoded) ? String(decoded) : String(decoded));
  };

  const trimmedFrac = fracBits.join('').replace(/0+$/, '') || '0';

  return (
    <LabFrame
      id="lab-2-2"
      code="LAB-2.2"
      title="IEEE 754 32位单精度浮点数交互解剖台"
      desc="默认载入课件 P21 经典例题 (100.25)₁₀ → 42C88000H。输入任意十进制数，或直接点击 32 个比特位实时观察数符、阶码（偏置127）与隐含 1 尾数的联动变化。"
    >
      <div className="lab-toolbar">
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <span style={{ color: '#8ea5be' }}>十进制真值：</span>
          <input
            type="text"
            className="lab-input"
            style={{ width: 130 }}
            value={inputText}
            onChange={(e) => applyDecimal(e.target.value)}
          />
        </label>
        <span style={{ fontSize: 12, color: '#8ea5be' }}>快速载入：</span>
        {[
          { label: '100.25 (课件P21)', v: '100.25' },
          { label: '-0.75', v: '-0.75' },
          { label: '0.1 (无限循环)', v: '0.1' },
          { label: '-12.625', v: '-12.625' },
          { label: '0', v: '0' },
        ].map((p) => (
          <button key={p.label} type="button" className="lab-btn" onClick={() => applyDecimal(p.v)}>
            {p.label}
          </button>
        ))}
      </div>

      {/* 32-bit Interactive Strip */}
      <div className="lab-subpanel" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-start' }}>
          <div>
            <span className="lab-label" style={{ color: '#ffb03b' }}>
              数符 ms (1位)
            </span>
            <div style={{ display: 'flex', gap: 3 }}>
              <button type="button" className={`bit-cell sign ${bits[0] ? 'one' : ''}`} onClick={() => toggleBit(0)}>
                {bits[0]}
              </button>
            </div>
          </div>

          <div>
            <span className="lab-label" style={{ color: '#38d9a9' }}>
              阶码 E (8位移码, 偏置=127)
            </span>
            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {expBits.map((b, i) => (
                <button
                  key={i}
                  type="button"
                  className={`bit-cell exp ${b ? 'one' : ''}`}
                  style={{ width: 28, height: 34, fontSize: 13 }}
                  onClick={() => toggleBit(1 + i)}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 260 }}>
            <span className="lab-label" style={{ color: '#4ea1ff' }}>
              尾数 m (23位原码纯小数，隐含最高整数位 1.)
            </span>
            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {fracBits.map((b, i) => (
                <button
                  key={i}
                  type="button"
                  className={`bit-cell ${b ? 'one' : ''}`}
                  style={{ width: 25, height: 34, fontSize: 12.5 }}
                  onClick={() => toggleBit(9 + i)}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Decoded metrics */}
      <div className="lab-metric-grid" style={{ marginBottom: 14 }}>
        <div className="lab-metric">
          <div className="lab-metric-k">十六进制机器码</div>
          <div className="lab-metric-v" style={{ color: '#ffb03b' }}>
            {hex}H
          </div>
        </div>
        <div className="lab-metric">
          <div className="lab-metric-k">符号 (-1)^ms</div>
          <div className="lab-metric-v">{sign === 0 ? '+ (正)' : '- (负)'}</div>
        </div>
        <div className="lab-metric">
          <div className="lab-metric-k">阶码真值 E - 127</div>
          <div className="lab-metric-v" style={{ color: '#38d9a9' }}>
            {expRaw === 0 ? '全0 (特殊/非规)' : expRaw === 255 ? '全1 (∞/NaN)' : `${expRaw} - 127 = ${expUnbiased}`}
          </div>
        </div>
        <div className="lab-metric">
          <div className="lab-metric-k">精确存储真值</div>
          <div className="lab-metric-v" style={{ fontSize: 15, color: '#4ea1ff' }}>
            {Number.isNaN(value) ? 'NaN' : !Number.isFinite(value) ? (sign ? '-∞' : '+∞') : value.toPrecision(8).replace(/\.?0+$/, '')}
          </div>
        </div>
      </div>

      {/* Step-by-step derivation */}
      <div className="lab-status-bar mono" style={{ fontSize: 12.8, lineHeight: 1.8 }}>
        {isZero && '特殊值：阶码全 0 且尾数全 0 ⇒ 机器零 (±0.0)。'}
        {isInf && `特殊值：阶码全 1 (255) 且尾数全 0 ⇒ ${sign ? '-∞' : '+∞'}。`}
        {isNaNVal && '特殊值：阶码全 1 (255) 且尾数非 0 ⇒ NaN (非数)。'}
        {isSubnormal && `非规格化数：(-1)^${sign} × (0.${trimmedFrac})₂ × 2⁻¹²⁶ ≈ ${value}`}
        {!isZero && !isInf && !isNaNVal && !isSubnormal && (
          <>
            <div>① 规格化二进制：(-1)^{sign} × (1.{trimmedFrac})₂ × 2^({expUnbiased})</div>
            <div>
              ② 阶码移码编码：127 + ({expUnbiased}) = {expRaw} = ({expBits.join('')})₂
            </div>
            <div>
              ③ 尾数小数部分：1 + {fracVal.toFixed(7)} = {(1 + fracVal).toFixed(7)}（最高位 1 隐含不存）
            </div>
            <div>
              ④ 32位拼接结果：{sign}; {expBits.slice(0, 4).join('')} {expBits.slice(4).join('')}; {fracBits.slice(0, 4).join('')} {fracBits.slice(4, 8).join('')} ... ⇒{' '}
              <strong style={{ color: '#ffb03b' }}>0x{hex}</strong>
            </div>
          </>
        )}
      </div>
    </LabFrame>
  );
}

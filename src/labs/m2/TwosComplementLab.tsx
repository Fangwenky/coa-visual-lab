import React, { useState } from 'react';
import { LabFrame } from '../../components/DocBlocks';

function toBin(n: number, bits: number): string {
  const mask = (1 << bits) - 1;
  return ((n & mask) >>> 0).toString(2).padStart(bits, '0');
}

function encode8(val: number) {
  const clamped = Math.max(-128, Math.min(127, Math.trunc(val)));
  const abs = Math.abs(clamped);
  const sign = clamped < 0 ? '1' : '0';
  const mag7 = abs.toString(2).padStart(7, '0');

  const yuan = clamped === -128 ? '无法表示 (超8位原码范围)' : `${sign}${mag7}`;
  const fan =
    clamped === -128
      ? '无法表示 (超8位反码范围)'
      : clamped >= 0
      ? `0${mag7}`
      : `1${mag7
          .split('')
          .map((b) => (b === '1' ? '0' : '1'))
          .join('')}`;
  const bu = toBin(clamped, 8);
  const yi = toBin(clamped + 128, 8);
  return { clamped, yuan, fan, bu, yi };
}

export default function TwosComplementLab() {
  const [tab, setTab] = useState<'code' | 'overflow' | 'parity'>('code');
  const [val, setVal] = useState(-11);

  // Overflow adder state (8-bit signed)
  const [xVal, setXVal] = useState(85);
  const [yVal, setYVal] = useState(60);
  const [op, setOp] = useState<'add' | 'sub'>('add');

  // 4x8 Cross Parity Matrix (Slide P32 default)
  const [matrix, setMatrix] = useState<number[][]>([
    [1, 1, 0, 0, 1, 0, 1, 1],
    [0, 1, 0, 1, 1, 1, 0, 0],
    [1, 0, 0, 1, 1, 0, 1, 0],
    [1, 0, 0, 1, 0, 1, 0, 1],
  ]);
  const [injected, setInjected] = useState<string[]>([]);

  const enc = encode8(val);

  // Double-sign bit (10-bit total: 2 sign bits + 7 numeric? Wait: for 8-bit signed, 1 sign + 7 mag => double-sign is 9-bit: Ss1 Ss2 + 7 mag)
  const effY = op === 'add' ? yVal : -yVal;
  const x9 = ((xVal < 0 ? 512 + xVal : xVal) & 0x1ff);
  const y9 = ((effY < 0 ? 512 + effY : effY) & 0x1ff);
  const x7 = x9 & 0x7f;
  const y7 = y9 & 0x7f;
  const c1 = (x7 + y7) >> 7; // carry from highest magnitude bit to sign bit
  const xs = (x9 >> 7) & 1;
  const ys = (y9 >> 7) & 1;
  const cs = (xs + ys + c1) >> 1; // carry out of sign bit
  const sum9 = (x9 + y9) & 0x1ff;
  const ss1 = (sum9 >> 8) & 1;
  const ss2 = (sum9 >> 7) & 1;
  const sBin9 = toBin(sum9, 9);
  const xBin9 = toBin(x9, 9);
  const yBin9 = toBin(y9, 9);

  const ovMethod1 = (xs === 1 && ys === 1 && ss2 === 0) || (xs === 0 && ys === 0 && ss2 === 1);
  const ovMethod2 = (cs ^ c1) === 1;
  const ovMethod3 = (ss1 ^ ss2) === 1;

  // Parity calculations (Even parity reference from initial clean matrix)
  const origRowPar = [1, 0, 0, 0];
  const origColPar = [1, 0, 0, 1, 1, 0, 0, 0];

  const toggleMatrixCell = (r: number, c: number) => {
    const key = `${r}-${c}`;
    setMatrix((prev) => prev.map((row, ri) => (ri === r ? row.map((v, ci) => (ci === c ? 1 - v : v)) : row)));
    setInjected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const resetMatrix = () => {
    setMatrix([
      [1, 1, 0, 0, 1, 0, 1, 1],
      [0, 1, 0, 1, 1, 1, 0, 0],
      [1, 0, 0, 1, 1, 0, 1, 0],
      [1, 0, 0, 1, 0, 1, 0, 1],
    ]);
    setInjected([]);
  };

  return (
    <LabFrame
      id="lab-2-1"
      code="LAB-2.1"
      title="原/反/补/移码转换、双符号位溢出检测与交叉奇偶校验台"
      desc="覆盖课件 P5–P19、P32、P36–P39：直观观察补码模运算特性、三种硬件溢出判据的等价性，以及二维交叉奇偶校验检错过程。"
    >
      <div className="lab-toolbar">
        <button type="button" className={`lab-btn ${tab === 'code' ? 'primary' : ''}`} onClick={() => setTab('code')}>
          原/反/补/移码实时转换
        </button>
        <button type="button" className={`lab-btn ${tab === 'overflow' ? 'primary' : ''}`} onClick={() => setTab('overflow')}>
          双符号位与三种溢出判据
        </button>
        <button type="button" className={`lab-btn ${tab === 'parity' ? 'primary' : ''}`} onClick={() => setTab('parity')}>
          交叉奇偶校验矩阵（P32）
        </button>
      </div>

      {tab === 'code' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="lab-subpanel" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
            <label style={{ fontSize: 13 }}>
              真值 X（-128 ~ +127）：
              <input
                type="number"
                min={-128}
                max={127}
                className="lab-input"
                style={{ width: 82, marginLeft: 8 }}
                value={val}
                onChange={(e) => setVal(Math.max(-128, Math.min(127, Number(e.target.value) || 0)))}
              />
            </label>
            <input
              type="range"
              min={-128}
              max={127}
              value={val}
              onChange={(e) => setVal(Number(e.target.value))}
              style={{ flex: 1, minWidth: 160 }}
            />
            <div style={{ display: 'flex', gap: 6 }}>
              {[-128, -11, -1, 0, 11, 127].map((p) => (
                <button key={p} type="button" className="lab-btn" onClick={() => setVal(p)}>
                  {p > 0 ? `+${p}` : p}
                </button>
              ))}
            </div>
          </div>

          <div className="lab-metric-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
            <div className="lab-metric">
              <div className="lab-metric-k">8位原码 [X]原（范围 -127 ~ +127）</div>
              <div className="lab-metric-v" style={{ color: '#4ea1ff', fontSize: 16 }}>
                {enc.yuan.length === 8 ? `${enc.yuan[0]}, ${enc.yuan.slice(1)}` : enc.yuan}
              </div>
            </div>
            <div className="lab-metric">
              <div className="lab-metric-k">8位反码 [X]反（负数除符号位取反）</div>
              <div className="lab-metric-v" style={{ color: '#b197fc', fontSize: 16 }}>
                {enc.fan.length === 8 ? `${enc.fan[0]}, ${enc.fan.slice(1)}` : enc.fan}
              </div>
            </div>
            <div className="lab-metric">
              <div className="lab-metric-k">8位补码 [X]补（0唯一，可表示 -128）</div>
              <div className="lab-metric-v" style={{ color: '#38d9a9', fontSize: 16 }}>
                {enc.bu[0]}, {enc.bu.slice(1)}
              </div>
            </div>
            <div className="lab-metric">
              <div className="lab-metric-k">8位移码 [X]移（偏置值 2⁷=128）</div>
              <div className="lab-metric-v" style={{ color: '#ffb03b', fontSize: 16 }}>
                {enc.yi[0]}, {enc.yi.slice(1)}
              </div>
            </div>
          </div>

          <div className="lab-status-bar">
            观察规律：
            {enc.clamped === -128
              ? ' -128 的8位补码为 10000000（它占用了原码中 [-0]原 的位置），移码为全 0（00000000），原码与反码均无法表示 -128！'
              : enc.clamped === 0
              ? ' 真值 0 的补码唯一（00000000），移码唯一（10000000），而原码/反码均有 +0 和 -0 两种形式。'
              : ` 同一真值 ${enc.clamped} 的移码 (${enc.yi}) 与补码 (${enc.bu}) 仅最高位相反，其余7位完全一致！`}
          </div>
        </div>
      )}

      {tab === 'overflow' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="lab-subpanel" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <label style={{ fontSize: 13 }}>
              X (-128~127)：
              <input
                type="number"
                min={-128}
                max={127}
                className="lab-input"
                style={{ width: 74, marginLeft: 6 }}
                value={xVal}
                onChange={(e) => setXVal(Math.max(-128, Math.min(127, Number(e.target.value) || 0)))}
              />
            </label>
            <div style={{ display: 'inline-flex', gap: 4 }}>
              <button type="button" className={`lab-btn ${op === 'add' ? 'primary' : ''}`} onClick={() => setOp('add')}>
                + 加法
              </button>
              <button type="button" className={`lab-btn ${op === 'sub' ? 'primary' : ''}`} onClick={() => setOp('sub')}>
                - 减法
              </button>
            </div>
            <label style={{ fontSize: 13 }}>
              Y (-127~127)：
              <input
                type="number"
                min={-127}
                max={127}
                className="lab-input"
                style={{ width: 74, marginLeft: 6 }}
                value={yVal}
                onChange={(e) => setYVal(Math.max(-127, Math.min(127, Number(e.target.value) || 0)))}
              />
            </label>
            <button type="button" className="lab-btn" onClick={() => { setXVal(85); setYVal(60); setOp('add'); }}>
              正溢例(85+60)
            </button>
            <button type="button" className="lab-btn" onClick={() => { setXVal(-90); setYVal(-70); setOp('add'); }}>
              负溢例(-90-70)
            </button>
            <button type="button" className="lab-btn" onClick={() => { setXVal(45); setYVal(-60); setOp('add'); }}>
              无溢例(45-60)
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 14 }}>
            <div className="lab-subpanel mono" style={{ fontSize: 14, lineHeight: 1.9 }}>
              <span className="lab-label">双符号位（变形补码）竖式演算</span>
              <div>
                <span style={{ color: '#8ea5be', display: 'inline-block', width: 96 }}>[X]补 (双符)</span>
                <span style={{ color: '#ffb03b', fontWeight: 700 }}>{xBin9.slice(0, 2)}</span>,{xBin9.slice(2)}
                <span style={{ color: '#8ea5be', marginLeft: 10 }}>({xVal})</span>
              </div>
              <div>
                <span style={{ color: '#8ea5be', display: 'inline-block', width: 96 }}>
                  {op === 'add' ? '[Y]补 (双符)' : '[-Y]补 (双符)'}
                </span>
                <span style={{ color: '#ffb03b', fontWeight: 700 }}>{yBin9.slice(0, 2)}</span>,{yBin9.slice(2)}
                <span style={{ color: '#8ea5be', marginLeft: 10 }}>({effY})</span>
              </div>
              <div style={{ borderTop: '1px solid #354e68', marginTop: 4, paddingTop: 4 }}>
                <span style={{ color: '#8ea5be', display: 'inline-block', width: 96 }}>[S]补 (双符)</span>
                <span style={{ color: ovMethod3 ? '#ff6b6b' : '#38d9a9', fontWeight: 700 }}>
                  {sBin9.slice(0, 2)}
                </span>
                ,{sBin9.slice(2)}
                <span style={{ color: '#8ea5be', marginLeft: 10 }}>真实和={xVal + effY}</span>
              </div>
            </div>

            <div className="lab-subpanel" style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
              <span className="lab-label">三种硬件溢出检测电路同步输出</span>
              <div className="mono">
                ① 单符号位法：Xs={xs}, Ys={ys}, Ss={ss2} ⇒{' '}
                <strong style={{ color: ovMethod1 ? '#ff6b6b' : '#38d9a9' }}>{ovMethod1 ? '溢出 (1)' : '正常 (0)'}</strong>
              </div>
              <div className="mono">
                ② 进位异或法：Cs={cs}, C1={c1} ⇒ Cs⊕C1 = {cs ^ c1} ⇒{' '}
                <strong style={{ color: ovMethod2 ? '#ff6b6b' : '#38d9a9' }}>{ovMethod2 ? '溢出 (1)' : '正常 (0)'}</strong>
              </div>
              <div className="mono">
                ③ 双符号位法：Ss1Ss2 = {ss1}{ss2} ⇒ Ss1⊕Ss2 = {ss1 ^ ss2} ⇒{' '}
                <strong style={{ color: ovMethod3 ? '#ff6b6b' : '#38d9a9' }}>
                  {ss1 === 0 && ss2 === 0 && '正数无溢出 (00)'}
                  {ss1 === 1 && ss2 === 1 && '负数无溢出 (11)'}
                  {ss1 === 0 && ss2 === 1 && '正溢！真符 Ss1=0 (01)'}
                  {ss1 === 1 && ss2 === 0 && '负溢！真符 Ss1=1 (10)'}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'parity' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: 13, color: '#8ea5be' }}>
              点击下方 4×8 数据矩阵中的任意比特翻转（模拟传输误码，例如像课件 P32 一样同时翻转第2字节的2位）：
            </span>
            <button type="button" className="lab-btn" onClick={resetMatrix}>
              恢复无错原始数据
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="mono" style={{ borderCollapse: 'separate', borderSpacing: 5, fontSize: 13 }}>
              <thead>
                <tr style={{ color: '#8ea5be', fontSize: 11.5 }}>
                  <th style={{ textAlign: 'left', paddingRight: 8 }}>字节</th>
                  {[7, 6, 5, 4, 3, 2, 1, 0].map((b) => (
                    <th key={b}>a{b}</th>
                  ))}
                  <th style={{ paddingLeft: 10 }}>横向偶校验</th>
                </tr>
              </thead>
              <tbody>
                {matrix.map((row, ri) => {
                  const ones = row.reduce((a, b) => a + b, 0);
                  const rowErr = (ones + origRowPar[ri]) % 2 !== 0;
                  return (
                    <tr key={ri}>
                      <td style={{ color: '#8ea5be', paddingRight: 8 }}>第{ri + 1}字节</td>
                      {row.map((bit, ci) => {
                        const isFlipped = injected.includes(`${ri}-${ci}`);
                        return (
                          <td key={ci}>
                            <button
                              type="button"
                              className={`bit-cell ${bit ? 'one' : ''}`}
                              style={{
                                width: 32,
                                height: 32,
                                borderColor: isFlipped ? '#ff6b6b' : undefined,
                                background: isFlipped ? 'rgba(255,107,107,0.28)' : undefined,
                              }}
                              onClick={() => toggleMatrixCell(ri, ci)}
                            >
                              {bit}
                            </button>
                          </td>
                        );
                      })}
                      <td style={{ paddingLeft: 10 }}>
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: 4,
                            fontWeight: 700,
                            background: rowErr ? 'rgba(255,107,107,0.2)' : 'rgba(56,217,169,0.16)',
                            color: rowErr ? '#ff6b6b' : '#38d9a9',
                          }}
                        >
                          P={origRowPar[ri]} {rowErr ? '✗错' : '✓'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                <tr>
                  <td style={{ color: '#8ea5be', paddingTop: 6 }}>纵向偶校验</td>
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((ci) => {
                    const colOnes = matrix.reduce((acc, row) => acc + row[ci], 0);
                    const colErr = (colOnes + origColPar[ci]) % 2 !== 0;
                    return (
                      <td key={ci} style={{ paddingTop: 6, textAlign: 'center' }}>
                        <div
                          style={{
                            padding: '4px 0',
                            borderRadius: 4,
                            fontWeight: 700,
                            fontSize: 12,
                            background: colErr ? 'rgba(255,107,107,0.2)' : 'rgba(56,217,169,0.16)',
                            color: colErr ? '#ff6b6b' : '#38d9a9',
                          }}
                        >
                          {origColPar[ci]}
                          {colErr ? '✗' : '✓'}
                        </div>
                      </td>
                    );
                  })}
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
          <div className="lab-status-bar">
            已注入误码数：{injected.length} 位。
            {injected.length === 1 && ' 单比特错误时，横向与纵向校验位同时报错，交叉点即可直接定位并纠正该位！'}
            {injected.length === 2 && ' 即使同一字节内有 2 位出错导致横向校验“漏检”，纵向两列的校验位依然能检出错误！'}
            {injected.length === 0 && ' 当前所有行、列偶校验全部通过。试着点击同一行里的 2 个比特观察交叉校验优势。'}
          </div>
        </div>
      )}
    </LabFrame>
  );
}

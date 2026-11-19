import React from 'react';
import { DatasheetTable, FormulaBox } from './DocBlocks';
import type { RouteId } from '../types/course';

export default function FormulaSheetView({ onNavigate }: { onNavigate: (id: RouteId) => void }) {
  return (
    <div className="overview-wrap" style={{ maxWidth: 1020 }}>
      <header className="mod-header" style={{ marginBottom: 24 }}>
        <div className="mod-header-meta">
          <span className="mod-header-chip">REF-ALL</span>
          <span className="mod-header-chip">期末冲刺 · 全六模块高频公式与易混点一页速查</span>
        </div>
        <h1>计算机组成与结构 · 核心公式与考点速查表</h1>
        <p>汇集 W1–W6 全套 416 页课件中的所有必考定量公式、硬件规则、编码换算与易错对比。</p>
      </header>

      <FormulaBox
        label="模块一：CPU 性能与算力公式"
        formula={`时钟周期 T = 1 / 主频 f    |    CPI = CPU时钟周期数 / IC = Σ(CPIᵢ × Iᵢ / IC)    |    IPC = 1 / CPI
CPU 执行时间 = IC × CPI / f = IC × CPI × T
MIPS = IC / (执行时间 × 10⁶) = f / (CPI × 10⁶)    |    MFLOPS = 浮点操作数 / (执行时间 × 10⁶)`}
      />

      <FormulaBox
        label="模块二：机器数、校验码、溢出、IEEE 754 与 CLA"
        formula={`8位范围：原/反码整数 -127~+127，补码整数 -128~+127；补码纯小数 -1 ~ +(1-2⁻⁷)
移码：[X]移 = 2ⁿ + X（与补码仅最高位相反；IEEE 754 单精度偏置=127，双精度=1023，尾数隐含1.）
汉字编码：国标码 = 区位码(Hex) + 2020H    |    机内码 = 国标码 + 8080H = 区位码(Hex) + A0A0H
校验码距：L - 1 = D + C （D ≥ C；奇偶校验 L=2，仅检奇数位错）
溢出检测：① XsYs~Ss + ~Xs~YsSs    ② Cs ⊕ C1    ③ 双符号位 Ss1 ⊕ Ss2（01正溢，10负溢，Ss1为真符）
进位延迟：n位行波 = 2n·tᵧ ｜ 16位单级CLA = 8tᵧ ｜ 16位两级CLA = 6tᵧ`}
      />

      <FormulaBox
        label="模块三：操作码优化、寻址速度与堆栈"
        formula={`定长操作码位数 N ≥ ⌈log₂ m⌉    |    Huffman 平均码长 = Σ(pᵢ · lᵢ)
数据寻址速度：立即 ＞ 寄存器 ＞ 直接 ＞ 寄存器间接 ＞ 页面 ＞ 变址/基址/相对 ＞ 一级间接 ＞ 多级间接
软堆栈(SP指满单元，栈底高地址)：PUSH 先 (SP)-1→SP 再存；POP 先取再 (SP)+1→SP`}
      />

      <FormulaBox
        label="模块四：主存带宽、DRAM 刷新与 Cache 计算"
        formula={`主存带宽 Bm = 时钟频率 × 倍增系数 × 位宽 ÷ 8    |    芯片总数 = 总容量 / 芯片容量
DRAM刷新：集中死区 = 行数×Tm；分散系统周期 = 2Tm；异步刷新间隔 = 最大刷新间隔 / 行数
Cache组相联：组号 = 主存块号 mod Cache组数    |    主存地址 = [Tag | Set | 块内地址]
平均访问时间：贯通查找式 = Tc + (1-H)·Tm    |    旁路式 = H·Tc + (1-H)·Tm`}
      />

      <FormulaBox
        label="模块五：微指令编码与流水线指标"
        formula={`字段直接编码：k 位字段最多表 2ᵏ - 1 个互斥微命令（留全 0 表不操作）
等长 k 段无相关流水线耗时：T流水 = (k + n - 1)·Δt
吞吐率 TP = n / T流水    |    加速比 Sp = T非流水 / T流水    |    效率 η = T非流水 / (m · T流水)`}
      />

      <FormulaBox
        label="模块六：总线带宽、仲裁线数与磁盘计算"
        formula={`总线带宽 B = W × F / N    |    集中仲裁控制线数：链式=3；计数器=2+⌈log₂n⌉；独立=2n+1
非格式化容量 = 最大位密度 × 最内圈周长 × 总磁道数    |    格式化容量 = 每道扇区数 × 扇区字节 × 总磁道数
磁盘平均存取时间 Ta = (Ts_max+Ts_min)/2 + (Tw_max+Tw_min)/2`}
      />

      <DatasheetTable
        headers={['高频易混概念对比', 'A 侧', 'B 侧']}
        rows={[
          ['变址寻址 vs 基址寻址', '变址：面向用户（数组/字符串），A固定 RX变', '基址：面向系统（重定位/扩空间），Rb由OS定'],
          ['水平型 vs 垂直型微指令', '水平型：并行强、微程序短、微指令字长', '垂直型：并行差、微程序长、微指令字短'],
          ['静态 vs 动态多功能流水线', '静态：切换功能须先排空，同拍仅一种功能', '动态：不同段可同时执行不同功能，利用率高'],
          ['中断响应次序 vs 处理次序', '响应次序：硬件排队决定，不可改变', '处理次序：软件中断屏蔽字决定，可软升级改变'],
          ['中断方式 vs DMA 方式', '中断：指令末响应、须保护现场、CPU循环传送', 'DMA：机器周期末响应、不保现场、硬件计数器传送'],
        ]}
      />

      <div style={{ marginTop: 22 }}>
        <button type="button" className="action-btn" onClick={() => onNavigate('overview')}>
          返回整机总览与六大模块
        </button>
      </div>
    </div>
  );
}

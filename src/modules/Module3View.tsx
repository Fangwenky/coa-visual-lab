import React from 'react';
import {
  ConceptSection,
  DatasheetTable,
  ExamTip,
  FormulaBox,
  ModuleFooterNav,
  ModuleHeader,
  QuizBlock,
  WorkedExample,
} from '../components/DocBlocks';
import { MODULES } from '../data/courseMeta';
import OpcodeHuffmanLab from '../labs/m3/OpcodeHuffmanLab';
import AddressingModesLab from '../labs/m3/AddressingModesLab';
import StackSubroutineLab from '../labs/m3/StackSubroutineLab';
import type { QuizQuestion, RouteId } from '../types/course';

const M3_QUIZ: QuizQuestion[] = [
  {
    id: 'm3-q1',
    question: '某机主存容量 2²⁰ 字节，机器字长 32 位。若按字节编址与按字编址，指令中的主存地址码分别至少需要多少位？',
    options: ['20 位和 18 位', '20 位和 19 位', '18 位和 20 位', '20 位和 16 位'],
    answerIndex: 0,
    explanation: '课件 P30 原题：2²⁰ B 按字节编址需 20 位；1 字 = 32 位 = 4 字节，共 2²⁰/4 = 2¹⁸ 字，按字编址只需 18 位。',
  },
  {
    id: 'm3-q2',
    question: '下列关于基址寻址与变址寻址区别的说法中，正确的是？',
    options: [
      '两者形成有效地址的硬件加法公式完全不同',
      '变址寻址面向系统（用于重定位），基址寻址面向用户（用于数组访问）',
      '变址寻址面向用户（用于遍历数组/字符串），基址寻址面向系统（用于重定位与扩空间）',
      '基址寻址中位移量只能为正数，变址寻址形式地址可正可负',
    ],
    answerIndex: 2,
    explanation: '课件 P40 核心考点：二者硬件上都算 寄存器+指令地址，但变址面向用户（A固定为数组首址，RX修改），基址面向操作系统（Rb常由特权指令设置，用于逻辑/物理重定位）。',
  },
  {
    id: 'm3-q3',
    question: '在自底向上生成且栈指针 SP 始终指向栈顶“满单元”的软堆栈中，执行进栈（PUSH）与出栈（POP）的正确微操作顺序是？',
    options: [
      'PUSH 先存数据再 SP-1；POP 先 SP+1 再取数据',
      'PUSH 先 (SP)-1→SP 再压入数据；POP 先弹出数据再 (SP)+1→SP',
      'PUSH 先 (SP)+1→SP 再压入数据；POP 先弹出数据再 (SP)-1→SP',
      '两者均不修改 SP',
    ],
    answerIndex: 1,
    explanation: '课件 P54–P55 标红重点！因为栈底在高地址（2000H）且 SP 指向满单元，进栈必须先 SP-1 腾出空单元再写入；出栈必须先读出栈顶数据再 SP+1。',
  },
  {
    id: 'm3-q4',
    question: '下列三种保存子程序返回地址的方法中，不支持子程序递归调用的是？',
    options: ['使用堆栈保存返回地址', '用子程序的第一个字单元保存返回地址', '用专用寄存器暂存并由子程序转存至安全区', '以上全部支持递归'],
    answerIndex: 1,
    explanation: '课件 P68–P70：子程序首单元只有一个固定位置，递归调用自身时新返回地址 L+1 会直接覆盖旧返回地址 K+1，导致永远无法返回主程序！',
  },
];

export default function Module3View({
  isDone,
  onToggleDone,
  onNavigate,
}: {
  isDone: boolean;
  onToggleDone: (id: string) => void;
  onNavigate: (id: RouteId) => void;
}) {
  const meta = MODULES[2];

  return (
    <div>
      <ModuleHeader meta={meta} />

      <ConceptSection id="m3-format" title="1. ISA 概念与指令地址码结构对比" slideRef="W3 · P3–P15">
        <div className="prose">
          <p>
            <strong>指令系统（指令集）</strong>是一台计算机全部机器指令的集合，而 <strong>ISA（指令集体系结构）</strong>位于软件与硬件的交界面，规定寻址方式、指令编码、操作数类型与指令集合（如 MIPS、x86、ARM、RISC-V）。指令由<strong>操作码字段</strong>（操作性质）和<strong>地址码字段</strong>（操作数地址或立即数）构成，长度应尽可能短且为字节的整数倍。
          </p>
        </div>

        <DatasheetTable
          headers={['地址码结构', '格式与操作语义', '单条指令访存次数（操作数在主存）', '计算 x=(a×b+c-d)÷(e+f) 统计']}
          rows={[
            ['四地址指令', 'OP A1 A2 A3 A4： (A1)OP(A2)→A3，下址 A4', '4 次（取指1+取2源+存1果）', '指令过长，现代极少采用'],
            ['三地址指令', 'OP A1 A2 A3： (A1)OP(A2)→A3，下址 (PC)+1', '4 次', '5 条指令，共访存 20 次（程序最短，指令最长）'],
            ['二地址指令', 'OP A1 A2： (A1)OP(A2)→A1（破坏原 A1）', '算逻 4 次，MOV 3 次', '7 条指令，共访存 2×3+5×4 = 26 次'],
            ['一地址指令', 'OP A1： (Acc)OP(A1)→Acc（隐含累加器）', '2 次（取指1+取/存1）', '9 条指令，共访存 9×2 = 18 次（访存最少！）'],
            ['零地址指令', 'OP：操作数与结果全隐含在堆栈顶（逆波兰式）', 'PUSH/POP 3次，算逻 4次（软堆栈）', '12 条指令，共访存 7×3+5×4 = 41 次（指令最短）'],
          ]}
        />
      </ConceptSection>

      <ConceptSection id="m3-opcode" title="2. 操作码编码：规整型、扩展操作码与 Huffman 优化" slideRef="W3 · P16–P27">
        <div className="compare-grid">
          <div className="compare-panel">
            <h4>规整型（定长）vs 非规整型（扩展操作码）</h4>
            <ul>
              <li><strong>规整型</strong>：操作码位数与位置固定，<code>N ≥ log₂ m</code>（如 IBM 370 固定 8 位操作码），译码电路最简单。</li>
              <li><strong>扩展操作码法</strong>：地址多的指令操作码短，地址少的指令操作码长（利用全 1 作为“扩展窗口”）。两大铁律：① <strong>短码不能是长码的前缀</strong>；② 各操作码唯一。</li>
            </ul>
          </div>
          <div className="compare-panel">
            <h4>Huffman 优化编码与 2-4 扩展编码</h4>
            <ul>
              <li><strong>Huffman 编码</strong>（最小概率合并法）：高频指令给短码，低频给长码，平均码长 <code>Σ pᵢ·lᵢ</code> 理论最短（课件例 2.20 位）；缺点是码长不规整、硬件译码难。</li>
              <li><strong>扩展编码法（如 2-4 扩展）</strong>：折衷方案，只用有限几种码长（2 位与 4 位），兼具较高压缩率（2.30 位）与规整译码！</li>
            </ul>
          </div>
        </div>

        <OpcodeHuffmanLab />
      </ConceptSection>

      <ConceptSection id="m3-addressing" title="3. 编址单位与 9 种基本数据寻址方式" slideRef="W3 · P28–P50">
        <div className="prose">
          <p>
            <strong>寻址</strong>分为<strong>指令寻址</strong>（顺序寻址 <code>(PC)+1</code> 与跳跃寻址）和<strong>数据寻址</strong>（将指令中的形式地址 <code>A</code> 变换为有效地址 <code>EA</code>）。编址单位常见有字编址、字节编址（通常编址单位 &lt; 主存访问单位以拓宽频带）与位编址；寻址方式的标识可分为<strong>显式（专用 MOD 字段）</strong>和<strong>隐式（由 OP 约定）</strong>，双操作数指令的源与目的可各自采用不同寻址方式（如 <code>MOV AX, (BX)</code>）。
          </p>
        </div>

        <FormulaBox
          label="9 种数据寻址方式速度排序（由快到慢 · 课件 P48 重点）"
          formula={`立即寻址 ＞ 寄存器寻址 ＞ 直接寻址 ＞ 寄存器间接寻址 ＞ 页面寻址 ＞ 变址 / 基址 / 相对寻址 ＞ 一级间接寻址 ＞ 多级间接寻址`}
          note="记忆逻辑：不访存 (立即/寄存器) > 1次访存且无需ALU加法 (直接/寄间/页面拼接) > 1次访存且需ALU加法 (变址/基址/相对) > 2次及以上访存 (间接/多级间接)。"
        />

        <AddressingModesLab />
      </ConceptSection>

      <ConceptSection id="m3-stack-types" title="4. 堆栈机制、指令类型与子程序嵌套/递归" slideRef="W3 · P51–P74">
        <div className="compare-grid">
          <div className="compare-panel">
            <h4>硬堆栈 vs 软堆栈（P52–P56）</h4>
            <ul>
              <li><strong>寄存器堆栈（硬堆栈）</strong>：专用寄存器组，栈顶固定，压入/弹出时内部数据自动推移；速度快、容量受限。</li>
              <li><strong>存储器堆栈（软堆栈）</strong>：主存划出区域，栈底固定（高地址），栈顶浮动，由栈指针 <code>SP</code> 指向栈顶满单元。</li>
              <li><strong>规则</strong>：<code>PUSH</code> 先 <code>(SP)-1→SP</code> 再写入；<code>POP</code> 先弹出再 <code>(SP)+1→SP</code>。</li>
            </ul>
          </div>
          <div className="compare-panel">
            <h4>四大类机器指令（P57–P74）</h4>
            <ul>
              <li><strong>数据传送</strong>：MOV（单向复制）、PUSH/POP、数据交换 XCHG。</li>
              <li><strong>运算类</strong>：算术（影响 CF/OF/ZF/SF/PF 标志）、逻辑（AND 按位测、XOR 按位取反修改）、移位（算术/逻辑/大小循环）。</li>
              <li><strong>程序控制</strong>：转移 JMP（无返回，同程序内）vs 子程序调用 CALL/RET（必存返回地址，程序间）。</li>
              <li><strong>I/O 类</strong>：独立编址（专用 <code>IN/OUT</code>，独立端口空间）vs 统一编址（外设占部分主存地址，直接用 <code>MOV</code> 访问）。</li>
            </ul>
          </div>
        </div>

        <StackSubroutineLab />
      </ConceptSection>

      <ConceptSection id="m3-cisc-risc" title="5. 指令系统发展：CISC、RISC、VLIW 与 EPIC" slideRef="W3 · P75–P79">
        <DatasheetTable
          headers={['比较维度', 'CISC (复杂指令系统，如早期 x86)', 'RISC (精简指令系统，如 ARM / MIPS / RISC-V)']}
          rows={[
            ['指令数量与“20%-80%律”', '指令极多（80%复杂指令仅占 20%执行频度）', '指令少而精，专注高频 20% 简单指令'],
            ['指令长度与格式', '变长指令字，格式与寻址方式繁多', '定长指令字，格式规整，寻址方式极少'],
            ['访存方式', '大量指令可直接读写主存，周期长', 'Load / Store 架构，运算大多为寄存器-寄存器 (RR)'],
            ['控制器实现', '多采用微程序控制（方便实现复杂指令）', '主要采用组合逻辑（硬布线）控制，极易流水线化'],
          ]}
        />
        <WorkedExample title="指令级 / 线程级 / 芯片级并行（P78–P79）">
          <strong>VLIW（超长指令字）</strong>与衍生出的 <strong>EPIC（显式并行指令代码）</strong>由编译器静态把多条独立简单指令打包进一条超长指令字，同时派发给多个执行单元，属于<strong>指令级并行</strong>；超线程（HT）是<strong>线程级并行</strong>；多内核是<strong>芯片级并行</strong>。
        </WorkedExample>
        <QuizBlock questions={M3_QUIZ} />
      </ConceptSection>

      <ModuleFooterNav
        moduleId="m3"
        isDone={isDone}
        onToggleDone={onToggleDone}
        prev={{ id: 'm2', label: '模块二：数据表示与计算' }}
        next={{ id: 'm4', label: '模块四：存储系统' }}
        onNavigate={onNavigate}
      />
    </div>
  );
}

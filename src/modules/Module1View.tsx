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
import VonNeumannExecLab from '../labs/m1/VonNeumannExecLab';
import CpuPerfCalculatorLab from '../labs/m1/CpuPerfCalculatorLab';
import type { QuizQuestion, RouteId } from '../types/course';

const M1_QUIZ: QuizQuestion[] = [
  {
    id: 'm1-q1',
    question: '下列关于冯·诺依曼“存储程序”概念的说法中，错误的是？',
    options: [
      '硬件由运算器、存储器、控制器、输入设备和输出设备五大部件组成',
      '计算机内部采用二进制表示指令和数据',
      '指令和数据必须分别存放在完全隔离的两个物理存储器中',
      '事先将编好的程序和原始数据存入存储器，再启动计算机自动执行',
    ],
    answerIndex: 2,
    explanation: '冯·诺依曼体系的典型特征是指令和数据以同等地位存放在同一主存储器中（区别于哈佛结构），靠时序与阶段加以区分。',
  },
  {
    id: 'm1-q2',
    question: '某处理器主频为 500MHz，每 4 个时钟周期组成一个机器周期，执行一条指令需要 3 个机器周期，则其 CPI 与平均执行速度分别为？',
    options: ['CPI=4, 125 MIPS', 'CPI=12, 41.67 MIPS', 'CPI=3, 166.7 MIPS', 'CPI=12, 83.3 MIPS'],
    answerIndex: 1,
    explanation: '课件 P36 原题：时钟周期 T=2ns，机器周期=4T=8ns，CPI=3×4=12；MIPS = 主频(MHz)/CPI = 500/12 ≈ 41.67 MIPS。',
  },
  {
    id: 'm1-q3',
    question: '关于系列机的软件兼容性，“某新出的高档机能够直接运行早期旧型号低档机上编写的软件”，这体现了？',
    options: ['向下兼容 & 向后兼容', '向上兼容 & 向前兼容', '向上兼容 & 向后兼容', '向下兼容 & 向前兼容'],
    answerIndex: 2,
    explanation: '按机器档次：低档机软件可在高档机运行称为“向上兼容”（✓）；按时间先后：旧机器软件可在新机器运行称为“向后兼容”（✓，课件 P16 重点）。',
  },
];

export default function Module1View({
  isDone,
  onToggleDone,
  onNavigate,
}: {
  isDone: boolean;
  onToggleDone: (id: string) => void;
  onNavigate: (id: RouteId) => void;
}) {
  const meta = MODULES[0];

  return (
    <div>
      <ModuleHeader meta={meta} />

      <ConceptSection id="m1-stored-program" title="1. 存储程序概念与冯·诺依曼体系" slideRef="W1 · P2–P8">
        <div className="prose">
          <p>
            《计算机组成与结构》聚焦软硬件之间的核心交界——<strong>指令集体系结构（ISA）</strong>与<strong>微体系结构</strong>（CPU 通用结构、存储系统与整机系统）。现代绝大多数计算机都建立在冯·诺依曼等人在 1945 年 6 月提出的<strong>存储程序（Stored Program）</strong>概念之上。
          </p>
        </div>

        <div className="compare-grid">
          <div className="compare-panel">
            <h4>冯·诺依曼存储程序三核心</h4>
            <ul>
              <li><strong>五大基本硬件部件</strong>：运算器、存储器、控制器、输入设备、输出设备。</li>
              <li><strong>二进制表示</strong>：计算机内部统一用二进制表示指令与数据。</li>
              <li><strong>存储程序控制</strong>：将编好的程序与原始数据事先存入存储器，再启动计算机逐条自动取指执行。</li>
            </ul>
          </div>
          <div className="compare-panel">
            <h4>历史里程碑对比</h4>
            <ul>
              <li><strong>ENIAC（1946.2）</strong>：世界第一台电子数字计算机，采用<strong>十进制</strong>、开关手动编程、18,000 个电子管、重 30 吨、耗电 170KW、5,000 次/秒加法。</li>
              <li><strong>EDSAC（1949）</strong>：历史上<strong>事实上的第一台存储程序计算机</strong>。</li>
            </ul>
          </div>
        </div>
      </ConceptSection>

      <ConceptSection id="m1-sys-composition" title="2. 系统组成、编程语言翻译与软件兼容" slideRef="W1 · P9–P16">
        <div className="prose">
          <p>
            <strong>计算机系统 = 硬件系统 + 软件系统</strong>。硬件是物质基础，软件是灵魂；两者之间的分界线是浮动的，对程序设计者而言<strong>硬件与软件在逻辑上是等价的</strong>。
          </p>
          <ul>
            <li><strong>固件（Firmware）</strong>：存储在能永久保存信息的器件（如 ROM）中的程序，是<strong>具有软件功能的硬件</strong>。</li>
            <li><strong>硬件层次划分</strong>：<code>CPU = 运算器 + 控制器</code>；<code>主机 = CPU + 主存储器</code>；主机以外称为外部设备（含辅助存储器、I/O 设备）；各部件通过<strong>系统总线（地址总线、数据总线、控制总线）</strong>互联。</li>
          </ul>
        </div>

        <DatasheetTable
          headers={['层次 / 翻译程序', '输入 → 输出', '核心特点与优缺点']}
          rows={[
            ['机器语言', '0/1 二进制指令序列', '机器直接识别执行；书写阅读极难，插删指令须重算全部转移地址。'],
            ['汇编程序 (Assembler)', '汇编语言 → 机器语言', '助记符表示操作码/寄存器、标号表示位置，与机器指令一一对应，增减指令无需重算地址。'],
            ['编译程序 (Compiler)', '高级语言 → 机器级目标程序', '整段翻译生成目标文件，运行时直接启动目标程序，执行效率高。'],
            ['解释程序 (Interpreter)', '高级语言 → 逐条翻译并立即执行', '不生成目标文件，边翻译边执行，跨平台灵活但运行较慢。'],
          ]}
        />

        <h3 className="sub-h3">系列机与软件兼容四象限（P16 必考区分）</h3>
        <div className="prose">
          <p>
            <strong>系列机</strong>是指同一厂家生产、具有<strong>相同系统结构（ISA 统一）</strong>，但具有不同组成和实现的一系列不同型号机器。
          </p>
        </div>
        <DatasheetTable
          headers={['维度', '兼容方向', '含义', '工业界基本要求']}
          rows={[
            ['按机器档次', '向上兼容', '低档机编写的软件不加修改即可在高档机上运行', '✓ 必须保证'],
            ['按机器档次', '向下兼容', '高档机编写的软件能在低档机上运行', '一般不要求'],
            ['按时间先后', '向后兼容', '旧型号机器编写的软件能在之后推出的新型号机器上运行', '✓ 必须保证'],
            ['按时间先后', '向前兼容', '新型号机器编写的软件能在早期旧型号机器上运行', '一般不要求'],
          ]}
        />
      </ConceptSection>

      <ConceptSection id="m1-work-process" title="3. 计算机的工作过程（计算 a + b - c）" slideRef="W1 · P18–P23">
        <div className="prose">
          <p>
            设 <code>a, b, c</code> 分别存放在主存 <code>005~007</code> 单元，结果写入 <code>008</code> 单元。程序 5 条指令（<code>LOAD 005</code>、<code>ADD 006</code>、<code>SUB 007</code>、<code>STORE 008</code>、<code>HALT</code>）顺序存放于 <code>000~004</code> 单元。启动后，控制器按 PC 逐条取指并驱动主存、数据总线、MDR、ALU 与累加器协同工作：
          </p>
        </div>
        <VonNeumannExecLab />
      </ConceptSection>

      <ConceptSection id="m1-performance" title="4. 计算机主要性能指标与量化计算" slideRef="W1 · P24–P36">
        <DatasheetTable
          headers={['性能指标', '核心定义与关键细节']}
          rows={[
            ['机器字长', '参与运算的数的基本位数（由加法器、寄存器、数据总线位数决定）。注意系列机中“字”固定，如 80x86 中 1字=16位，IBM303X 中 1字=32位。'],
            [
              '数据通路宽度',
              '外部数据总线一次能并行传送的位数。① 外部=内部：Intel 8086 / 80286 / 80486；② 外部＜内部：8088 / 80386SX；③ 外部＞内部：Pentium。',
            ],
            [
              '主存容量',
              '① 字节编址：按字节数（1K=2¹⁰, 1M=2²⁰, 1G=2³⁰, 1T=2⁴⁰）；② 字编址：字数×字长（如 4096×16 表示 4096 个 16 位单元）。',
            ],
            ['吞吐量 & 响应时间', '吞吐量 = 单位时间处理请求数；响应时间 = CPU 时间 + 等待时间（磁盘、访存、I/O、OS 开销）。'],
            ['主频 & 时钟周期', '主频 f 是时钟脉冲振荡频率；时钟周期 T = 1/f，是 CPU 最小时间元素（如 4.0GHz → T=250ps）。主频高不直接等于运算能力强！'],
            ['CPI & IPC', 'CPI = 每条指令平均时钟周期数 = CPU时钟周期数 / IC = Σ(CPIᵢ × Iᵢ / IC)；并行处理器常用 IPC = 1/CPI。注意：给定 CPU 时 CPI 仍随程序变化。'],
          ]}
        />

        <FormulaBox
          label="核心性能公式（CPU 铁律 · P32–P35）"
          formula={`CPU 执行时间 = CPU 时钟周期数 / 时钟频率 = (指令数 IC × CPI) / 时钟频率 f = IC × CPI × 时钟周期 T
MIPS（每秒百万条指令）= IC / (执行时间 × 10⁶) = f / (CPI × 10⁶)
MFLOPS（每秒百万次浮点运算）= 浮点操作次数 / (执行时间 × 10⁶)
浮点算力量级：M(10⁶) → G(10⁹) → T(10¹²) → P(10¹⁵) → E(10¹⁸) → Z(10²¹)`}
          note="三个决定要素：主频 f 取决于工艺与组织；CPI 取决于指令系统与微结构；IC 取决于 ISA、算法与编译优化。"
        />

        <WorkedExample title="课件经典例题（P36）：时钟周期、机器周期、CPI 与 MIPS 联算">
          <div className="mono" style={{ fontSize: 13.5, lineHeight: 1.75 }}>
            <div>题：主频 f = 500 MHz，每 4 个时钟周期 = 1 个机器周期，执行 1 条指令需 3 个机器周期。</div>
            <div>解：① 时钟周期 T = 1 / 500MHz = 2 ns；② 机器周期 = 4T = 8 ns；</div>
            <div>③ CPI = 3 × 4 = 12；④ MIPS = 500 / 12 ≈ 41.67 MIPS ≈ 42 MIPS。</div>
          </div>
        </WorkedExample>

        <CpuPerfCalculatorLab />
      </ConceptSection>

      <ConceptSection id="m1-history" title="5. 计算机发展历程与本模块自测" slideRef="W1 · P38">
        <DatasheetTable
          headers={['代际', '核心电子器件', '代表特征']}
          rows={[
            ['第一代 (1946~1957)', '电子管', '体积庞大、功耗高、速度慢，采用机器语言与汇编语言'],
            ['第二代 (1958~1964)', '晶体管', '功耗体积大降，出现高级语言（FORTRAN/COBOL）与批处理系统'],
            ['第三代 (1965~1970)', '中小规模集成电路 (SSI/MSI)', '出现操作系统、系列机概念（如 IBM S/360）与半导体内存'],
            ['第四代 (1971~至今)', '大规模/超大规模集成电路 (LSI/VLSI)', '微处理器诞生、个人电脑、多核并行与 AI 专用加速器'],
          ]}
        />
        <ExamTip>
          模块一核心考法集中在三处：① 系列机“向上/向后兼容”方向辨析；② 外部数据通路宽度与内部字长对比实例（8088/Pentium）；③ 用 CPU 性能公式比较两台不同主频和 CPI 机器的相对加速比。
        </ExamTip>
        <QuizBlock questions={M1_QUIZ} />
      </ConceptSection>

      <ModuleFooterNav
        moduleId="m1"
        isDone={isDone}
        onToggleDone={onToggleDone}
        next={{ id: 'm2', label: '模块二：数据表示与计算' }}
        onNavigate={onNavigate}
      />
    </div>
  );
}

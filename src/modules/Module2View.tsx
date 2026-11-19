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
import TwosComplementLab from '../labs/m2/TwosComplementLab';
import Ieee754Lab from '../labs/m2/Ieee754Lab';
import ClaAdderRaceLab from '../labs/m2/ClaAdderRaceLab';
import BoothDivLab from '../labs/m2/BoothDivLab';
import type { QuizQuestion, RouteId } from '../types/course';

const M2_QUIZ: QuizQuestion[] = [
  {
    id: 'm2-q1',
    question: '当机器字长为 8 位（含 1 位符号位）时，下列关于补码的说法错误的是？',
    options: [
      '补码定点整数的表示范围是 -128 ~ +127',
      '真值 0 的补码表示唯一，为 00000000',
      '同一真值的补码与偏置为 2⁷ 的移码完全相同',
      '补码加减运算时符号位可直接参与运算，将减法转化为加法',
    ],
    answerIndex: 2,
    explanation: '同一真值的补码与移码（偏置 2ⁿ）“除最高位相反外，其余各位完全相同”，并非完全相同！',
  },
  {
    id: 'm2-q2',
    question: '将十进制数 (100.25)₁₀ 转换为 IEEE 754 32位单精度短浮点数，其十六进制编码为？',
    options: ['42C84000H', '42C88000H', '42488000H', 'C2C88000H'],
    answerIndex: 1,
    explanation: '课件 P21 原题：100.25 = (1100100.01)₂ = 1.10010001×2⁶，阶码 127+6=133=10000101，拼接得 0;10000101;10010001000... = 42C88000H。',
  },
  {
    id: 'm2-q3',
    question: '某编码的最小码距 L = 4，若要求该编码能纠正 1 位错误（C=1），则它最多能检测出几位错误（D）？',
    options: ['1 位', '2 位', '3 位', '4 位'],
    answerIndex: 1,
    explanation: '课件 P29 公式：L - 1 = D + C 且 D ≥ C。代入 L=4, C=1，得 D = 4 - 1 - 1 = 2 位。',
  },
  {
    id: 'm2-q4',
    question: '在采用双符号位补码的浮点加减运算中，若尾数相加得到 01.0110，下一步应当？',
    options: [
      '立刻报正溢出中断并停机',
      '尾数右规 1 位、阶码加 1，再由阶码判断真正溢出',
      '尾数左规 1 位、阶码减 1',
      '直接按机器零处理',
    ],
    answerIndex: 1,
    explanation: '课件 P53–P54 超级易错点！浮点尾数出现 01.xxx 或 10.xxx 不是真正溢出，只需右规（最多一次）且阶码 +1，最后由阶码的双符号位（01 上溢、10 下溢）决定是否溢出！',
  },
];

export default function Module2View({
  isDone,
  onToggleDone,
  onNavigate,
}: {
  isDone: boolean;
  onToggleDone: (id: string) => void;
  onNavigate: (id: RouteId) => void;
}) {
  const meta = MODULES[1];

  return (
    <div>
      <ModuleHeader meta={meta} />

      <ConceptSection id="m2-numeric" title="1. 数值数据三要素与原/反/补/移码" slideRef="W2 · P4–P14, P18–P19">
        <div className="prose">
          <p>
            仅看到一串二进制机器数（如 <code>01011001</code>）无法直接确定它的值！必须同时明确<strong>数值数据表示三要素</strong>：① 进位记数制（D/B/Q/H）；② 定/浮点表示（小数点位置）；③ 编码方式（无符号 / 原码 / 反码 / 补码 / 移码）。
          </p>
        </div>

        <DatasheetTable
          headers={['编码方式', '正数规则', '负数规则', '0 的表示', 'n+1位整数范围', 'n+1位纯小数范围']}
          rows={[
            ['无符号数', '全位为数值位', '—', '唯一 (全0)', '0 ~ 2ⁿ⁺¹ - 1', '—'],
            ['原码', '符号0 + 绝对值', '符号1 + 绝对值', '+0(00..0), -0(10..0)', '-(2ⁿ - 1) ~ +(2ⁿ - 1)', '-(1 - 2⁻ⁿ) ~ +(1 - 2⁻ⁿ)'],
            ['反码', '同原码', '符号1 + 数值位取反', '+0(00..0), -0(11..1)', '-(2ⁿ - 1) ~ +(2ⁿ - 1)', '-(1 - 2⁻ⁿ) ~ +(1 - 2⁻ⁿ)'],
            ['补码', '同原码', '除符号位取反加1（或自低位向高位首个1及右0不变，左取反）', '唯一 (00..0)', '-2ⁿ ~ +(2ⁿ - 1)（多1个负数）', '-1 ~ +(1 - 2⁻ⁿ)'],
            ['移码 (偏置2ⁿ)', '[X]移 = 2ⁿ + X', '最高位0表负、1表正；与补码仅最高位相反', '唯一 (10..0)', '全0最小(-2ⁿ)，全1最大(2ⁿ-1)', '常用于浮点阶码'],
          ]}
        />

        <ExamTip title="为什么现代计算机普遍采用补码和移码？">
          <strong>补码三大优势</strong>：① 模运算使减法变加法，符号位参与运算；② 0 表示唯一；③ 比原/反码多表示一个最小负数（如 8 位可表 -128）。
          <br />
          <strong>移码作浮点阶码两大优势</strong>：① 移码映射至正数域，可直接按无符号数比较浮点数大小；② 阶码全 0 且尾数全 0 即为机器零，简化判零电路。
        </ExamTip>

        <TwosComplementLab />
      </ConceptSection>

      <ConceptSection id="m2-float" title="2. 浮点数规格化表示与 IEEE 754 标准" slideRef="W2 · P15–P21">
        <div className="prose">
          <p>
            浮点数形式为 <code>N = M × r^E</code>（通常基数 <code>r = 2</code>），由带符号的<strong>阶码 E</strong>（决定数值范围）和<strong>尾数 M</strong>（决定有效精度）组成。为充分利用尾数有效位，规定规格化满足 <code>1/r ≤ |M| &lt; 1</code>（r=2 时即 <code>1/2 ≤ |M| &lt; 1</code>）：
          </p>
          <ul>
            <li><strong>原码尾数规格化</strong>：最高数值位恒为 1，形如 <code>Xs.1xx…x</code>。</li>
            <li><strong>补码尾数规格化</strong>：符号位与最高数值位必须相异（<code>mₛ ⊕ m₁ = 1</code>），正数形如 <code>0.1xx…x</code>，负数形如 <code>1.0xx…x</code>。</li>
            <li><strong>机器零</strong>：一般尾数为 0 即作机器零；标准格式为尾数全 0 且阶码为绝对值最大的负数（移码全 0）。</li>
          </ul>
        </div>

        <DatasheetTable
          headers={['IEEE 754 类型', '数符 mₛ', '阶码 E (移码)', '尾数 m (原码纯小数)', '总位数', '偏置值']}
          rows={[
            ['短浮点数 (float)', '1 位', '8 位', '23 位（隐含整数位 1. → 实际24位）', '32 位', '127 (7FH)'],
            ['长浮点数 (double)', '1 位', '11 位', '52 位（隐含整数位 1. → 实际53位）', '64 位', '1023 (3FFH)'],
            ['临时浮点数', '1 位', '15 位', '64 位', '80 位', '16383 (3FFFH)'],
          ]}
        />

        <Ieee754Lab />
      </ConceptSection>

      <ConceptSection id="m2-non-numeric" title="3. 非数值数据（ASCII / 汉字）与数据校验码" slideRef="W2 · P23–P33">
        <div className="compare-grid">
          <div className="compare-panel">
            <h4>ASCII 与汉字三种编码</h4>
            <ul>
              <li><strong>ASCII 码</strong>：7 位二进制共 128 个字符（10 数字 + 52 大小写字母 + 34 专用符 + 32 控制符），数字和字母顺序连续排列。</li>
              <li><strong>汉字输入码</strong>：如区位码（GB2312 共 6763 汉字分 94 区×94 位，01~94）。</li>
              <li><strong>国标码 &amp; 汉字机内码</strong>（双字节，最高位置 1 防与 ASCII 冲突）：
                <br /><code>国标码 = 区位码(Hex) + 2020H</code>
                <br /><code>机内码 = 国标码 + 8080H = 区位码(Hex) + A0A0H</code>
              </li>
              <li><strong>汉字字形码（字模点阵）</strong>：输出用。如 <code>16×16</code> 点阵占 <code>16×16/8 = 32B</code>，<code>24×24</code> 占 <code>72B</code>；矢量轮廓如 TrueType。</li>
            </ul>
          </div>
          <div className="compare-panel">
            <h4>数据校验码与最小码距</h4>
            <ul>
              <li><strong>最小码距 L</strong>：合法代码集中任意两合法码之间最少不同位数。</li>
              <li><strong>核心关系公式</strong>：<code>L - 1 = D + C （要求 D ≥ C）</code>，D 为检错位数，C 为纠错位数。</li>
              <li><strong>奇偶校验码</strong>：码距 <code>L = 2</code>，仅能检出奇数位错（1 位错），不能纠错。奇校验使全部 1 的个数为奇数，偶校验为偶数。</li>
              <li><strong>交叉奇偶校验</strong>：横向 + 纵向二维校验，能发现同一字节 2 位同时出错，且能定位纠正 1 位错（见上方 Lab 2.1 第三标签页）。</li>
              <li><strong>拓展校验码</strong>：海明码（L=3/4，分组偶校验直接定位纠 1 位错）、CRC 循环冗余码（模 2 除法生成多项式检突发错）。</li>
            </ul>
          </div>
        </div>
      </ConceptSection>

      <ConceptSection id="m2-adder" title="4. 定点补码加减溢出与超前进位加法器（CLA）" slideRef="W2 · P36–P45">
        <FormulaBox
          label="补码加减法与三种硬件溢出检测公式（P36–P39）"
          formula={`[X + Y]补 = [X]补 + [Y]补    |    [X - Y]补 = [X]补 + [-Y]补 （[-Y]补 为 [Y]补 连同符号位按位取反末位+1）
方法一（单符号位）：V = Xs·Ys·~Ss + ~Xs·~Ys·Ss     （同号相加得异号即溢出）
方法二（进位判别）：V = Cs ⊕ C1                   （符号位进位 Cs ≠ 最高数值位进位 C1）
方法三（变形补码/双符号位）：V = Ss1 ⊕ Ss2         （00正无溢，11负无溢，01正溢，10负溢；Ss1 永远是真符！）`}
          note="存储时仍存单符号位，仅在 ALU 运算时扩充成双符号位（本质是把模扩大了一倍）。"
        />

        <div className="prose">
          <h3 className="sub-h3">1 位全加器与进位加速原理（P40–P45）</h3>
          <p>
            1 位全加器逻辑：<code>Sᵢ = Aᵢ ⊕ Bᵢ ⊕ Cᵢ₋₁</code>，<code>Cᵢ = AᵢBᵢ + (Aᵢ⊕Bᵢ)Cᵢ₋₁ = Gᵢ + PᵢCᵢ₋₁</code>。其中 <code>Gᵢ = AᵢBᵢ</code> 为<strong>进位产生函数</strong>，<code>Pᵢ = Aᵢ⊕Bᵢ</code> 为<strong>进位传递函数</strong>。
          </p>
        </div>

        <DatasheetTable
          headers={['加法器结构', '进位组织方式', '16位总进位延迟（不计 G/P 形成）', '特点']}
          rows={[
            ['行波进位加法器 (RCA)', '逐位串行传递', '2n·tᵧ = 32 tᵧ', '结构最简单，但字长越长延迟线性恶化'],
            ['全超前进位 (CLA)', '所有进位直接由 C0 和 G/P 展开', '2 tᵧ（理论常数）', '位数增多后扇入数爆炸，工程上按 4 位分组'],
            ['单级先行进位 (4×4位CLA)', '组内并行、组间串行', '4 × 2tᵧ = 8 tᵧ', '每 4 位产生 C4/C8/C12/C16 后串行送下一组'],
            ['多级/两级先行进位 (BCLA+74182)', '组内并行、组间并行', '2tᵧ(组内1 & G*/P*) + 2tᵧ(C4~C16) + 2tᵧ(高3组内) = 6 tᵧ', '大幅提速且扇入可控，现代 32/64 位 ALU 基础'],
          ]}
        />

        <ClaAdderRaceLab />
      </ConceptSection>

      <ConceptSection id="m2-mul-div-float" title="5. 定点乘除法（Booth / 加减交替）与规格化浮点运算" slideRef="W2 · P46–P55">
        <div className="compare-grid">
          <div className="compare-panel">
            <h4>Booth 补码一位乘法规则（P46–P48）</h4>
            <ul>
              <li>3 个寄存器：<strong>A</strong>（部分积/高位积，初值0，双符号位）、<strong>B</strong>（被乘数 <code>[X]补</code>）、<strong>C</strong>（乘数 <code>[Y]补</code>，末位后加附加位 <code>Yₙ₊₁=0</code>）。</li>
              <li>判位 <code>YₙYₙ₊₁</code>：<code>00 / 11</code> → +0；<code>01</code> → <code>+[X]补</code>；<code>10</code> → <code>+[-X]补</code>。</li>
              <li>按补码算术右移 1 位；共做 <strong>n+1 次累加、n 次移位（第 n+1 次不移位）</strong>。</li>
            </ul>
          </div>
          <div className="compare-panel">
            <h4>补码加减交替除法规则（P49–P51）</h4>
            <ul>
              <li>公式：<code>[rᵢ₊₁]补 = 2[rᵢ]补 + (1 - 2Qᵢ)[Y]补</code>。</li>
              <li>第一步：<code>[X]补</code> 与 <code>[Y]补</code> <strong>同号减除数</strong>（<code>+[-Y]补</code>），<strong>异号加除数</strong>（<code>+[Y]补</code>）。</li>
              <li>上商与后续：余数与除数 <strong>同号上商 1</strong>（下步左移减除数），<strong>异号上商 0</strong>（下步左移加除数）；最后一位采用<strong>末位恒置 1</strong> 舍入。</li>
            </ul>
          </div>
        </div>

        <BoothDivLab />

        <h3 className="sub-h3">规格化浮点加减与乘除运算流程（P52–P55）</h3>
        <DatasheetTable
          headers={['浮点运算步骤', '具体规则与必考细节']}
          rows={[
            ['① 对阶', '原则：小阶向大阶看齐！阶小者尾数每右移 1 位，阶码加 1，直到两阶相等（避免高位有效数字丢失）。'],
            ['② 尾数加减', '按定点双符号位补码执行 M_A ± M_B → M_C。'],
            ['③ 尾数规格化（6种情况）', '00.1xx / 11.0xx：已规格化；00.0xx / 11.1xx：需左规（左移1位阶码-1，可多次）；01.xxx / 10.xxx：需右规（右移1位阶码+1，最多1次）。'],
            ['④ 溢出判断（看阶码！）', '阶码双符号位 [Ec]补 = 01,xx 为上溢（真溢出，中断处理）；10,xx 为下溢（趋于 0，按机器零处理，不报错）。'],
            ['⑤ 浮点乘除', '尾数作定点乘除，阶码作定点加减。阶码用移码时：乘法相加后须减 1 个偏置值 2ⁿ；除法相减后须加 1 个偏置值 2ⁿ，最后规格化。'],
          ]}
        />
      </ConceptSection>

      <ConceptSection id="m2-alu" title="6. 运算器总线结构与 74181 / 74182 芯片" slideRef="W2 · P56–P66">
        <div className="prose">
          <ul>
            <li><strong>运算器内部总线结构</strong>：单总线结构完成一次双操作数运算需 <strong>3 步</strong>；双总线需 <strong>2 步</strong>；三总线仅需 <strong>1 步</strong>。</li>
            <li><strong>74181 四位 ALU 芯片</strong>：又称多功能函数发生器，<code>M=0</code> 算术操作（16种），<code>M=1</code> 逻辑操作（16种），<code>S0~S3</code> 功能选择，输出组进位产生 <code>G*</code> 与组进位传递 <code>P*</code>。</li>
            <li><strong>74182 先行进位部件</strong>：接收 4 片 74181 的 <code>G*, P*</code> 并行生成 <code>Cn+x, Cn+y, Cn+z</code> 及大组 <code>G**, P**</code>；例如 <strong>8 片 74181 + 2 片 74182</strong> 可组成 32 位两级先行进位 ALU（组内组间两级并行，两个 16 位大组间串行）。</li>
          </ul>
        </div>
        <QuizBlock questions={M2_QUIZ} />
      </ConceptSection>

      <ModuleFooterNav
        moduleId="m2"
        isDone={isDone}
        onToggleDone={onToggleDone}
        prev={{ id: 'm1', label: '模块一：计算机系统概论' }}
        next={{ id: 'm3', label: '模块三：指令系统' }}
        onNavigate={onNavigate}
      />
    </div>
  );
}

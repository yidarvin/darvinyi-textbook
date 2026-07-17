import { useTocSections } from '../../components/layout/TocContext';
import { buildCitations } from '../../data/citations';
import SectionTitle from '../../components/shared/SectionTitle';
import ChapterLede from '../../components/shared/ChapterLede';
import Citations from '../../components/shared/Citations';
import InlineMath from '../../components/shared/InlineMath';
import MathBlock from '../../components/shared/MathBlock';
import ExerciseCard from '../../components/shared/ExerciseCard';
import ComplexityCurves from '../../components/diagrams/ch17/ComplexityCurves';
import SSMDuality from '../../components/widgets/ch17/SSMDuality';
import SelectiveScan from '../../components/widgets/ch17/SelectiveScan';
import ComplexityRace from '../../components/widgets/ch17/ComplexityRace';
import HybridLayerMixer from '../../components/widgets/ch17/HybridLayerMixer';

const prose = { fontFamily: "'Inter', sans-serif", fontSize: 'var(--prose-size, 15px)', fontWeight: 400, color: '#b8c4cc', lineHeight: 'var(--prose-line-height, 1.75)', margin: '0 0 var(--prose-margin-bottom, 20px)' };
const CITATIONS = buildCitations([
  { title: 'Efficiently Modeling Long Sequences with Structured State Spaces', authors: 'Gu, Goel, Ré', venue: 'ICLR', year: '2022', tag: 'seminal' },
  { title: 'Mamba: Linear-Time Sequence Modeling with Selective State Spaces', authors: 'Gu, Dao', venue: 'COLM', year: '2024', tag: 'seminal' },
  { title: 'Transformers are RNNs: Fast Autoregressive Transformers with Linear Attention', authors: 'Katharopoulos, Vyas, Pappas, Fleuret', venue: 'ICML', year: '2020', tag: 'paper' },
  { title: 'RWKV: Reinventing RNNs for the Transformer Era', authors: 'Peng et al.', venue: 'EMNLP Findings', year: '2023', tag: 'paper' },
  { title: 'Jamba: A Hybrid Transformer-Mamba Language Model', authors: 'Lieber et al.', venue: 'arXiv', year: '2024', tag: 'paper' },
  { title: 'Griffin: Mixing Gated Linear Recurrences with Local Attention for Efficient Language Models', authors: 'De et al.', venue: 'arXiv', year: '2024', tag: 'paper' },
  { title: 'Transformers are SSMs: Generalized Models and Efficient Algorithms Through Structured State Space Duality', authors: 'Dao, Gu', venue: 'ICML', year: '2024', tag: 'paper' },
]);
const TOC_SECTIONS = [
  { id: 'the-cost-of-attention', label: 'The Cost of Attention' },
  { id: 'state-space-models', label: 'S4 to Mamba' },
  { id: 'rwkv-and-linear-attention', label: 'RWKV & Linear Attention' },
  { id: 'hybrids-in-production', label: 'Hybrids in Production' },
];

export default function StateSpaceModels() {
  useTocSections(TOC_SECTIONS);
  return <article style={{ maxWidth: 'var(--chapter-max-width, 740px)', margin: '0 auto', padding: 'var(--chapter-padding, 52px 44px 100px)' }}>
    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 'var(--chapter-meta-size, 10.5px)', letterSpacing: '.1em', color: 'var(--accent)', opacity: .7, textTransform: 'uppercase', marginBottom: 12 }}>Chapter 17 · Part IV — Beyond the Transformer</div>
    <h1 style={{ fontFamily: "'Crimson Pro', serif", fontSize: 'var(--h1-size, 42px)', fontWeight: 600, color: 'var(--text)', margin: 0, lineHeight: 'var(--h1-line-height, 1.15)' }}>State-Space Models & Attention Alternatives</h1>
    <ChapterLede>Attention lets every token inspect every earlier token, but that useful freedom becomes expensive on long sequences. This chapter follows the competing idea: compress the past into a running state, or reformulate attention so that it can be updated once per token. These alternatives change the costs of long-context models and clarify why a few attention layers still remain valuable.</ChapterLede>

    <div id="the-cost-of-attention"><SectionTitle>The Cost of Attention</SectionTitle></div>
    <p style={prose}>Self-attention compares each query with each key in a sequence. For a sequence of length <InlineMath>{'T'}</InlineMath>, that creates a <InlineMath>{'T \\times T'}</InlineMath> score matrix during the prompt-processing, or prefill, pass. Chapter 9 introduced those scores and Chapter 11 explained why autoregressive decoding also keeps a key-value cache. Both costs become material when a document grows from thousands to hundreds of thousands of tokens.</p>
    <MathBlock>{'$$S = QK^\\top / \\sqrt{d_k}, \\qquad S \\in \\mathbb{R}^{T \\times T}$$'}</MathBlock>
    <p style={prose}>Here <InlineMath>{'Q'}</InlineMath> and <InlineMath>{'K'}</InlineMath> hold one query and key vector per token, <InlineMath>{'d_k'}</InlineMath> is a head's key dimension, and <InlineMath>{'S'}</InlineMath> contains one comparison for every ordered token pair. The projection widths and hardware determine the constants, but the number of comparisons grows quadratically with <InlineMath>{'T'}</InlineMath>.</p>
    <p style={prose}>The figure separates that growth law from a benchmark claim. A linear scan still has to process every token, but it does not materialize every pair. That distinction buys much lower memory pressure at long context, not automatic superiority on every language task.</p>
    <ComplexityCurves />

    <div id="state-space-models"><SectionTitle>State-Space Models: S4 to Mamba</SectionTitle></div>
    <p style={prose}>A state-space model, or SSM, carries a compact vector forward through a sequence. In its continuous form it describes a driven dynamical system. Sampling it at token intervals gives a recurrence: a learned transition preserves or transforms the prior state, the current input writes new information, and a readout produces an output. Gu et al. (2022) [1] made this family practical for long sequences with S4, a structured parameterization that permits efficient computation.</p>
    <MathBlock>{'$$\\frac{d x(t)}{dt} = A x(t) + B u(t), \\qquad y(t) = Cx(t) + Du(t)$$'}</MathBlock>
    <p style={prose}>Here <InlineMath>{'x(t)'}</InlineMath> is the continuous state, <InlineMath>{'u(t)'}</InlineMath> the continuous input, <InlineMath>{'y(t)'}</InlineMath> the output, and <InlineMath>{'A,B,C,D'}</InlineMath> learned maps. Hold each token input constant for a step of duration <InlineMath>{'\\Delta'}</InlineMath>. Zero-order-hold discretization then gives <InlineMath>{'\\bar A=e^{\\Delta A}'}</InlineMath> and <InlineMath>{'\\bar B=\\int_0^{\\Delta}e^{\\tau A}B\\,d\\tau'}</InlineMath>.</p>
    <MathBlock>{'$$x_t = \\bar A x_{t-1} + \\bar B u_t, \\qquad y_t = Cx_t + Du_t, \\qquad x_{-1}=0$$'}</MathBlock>
    <p style={prose}>Here <InlineMath>{'u_t'}</InlineMath> is the token input at zero-based position <InlineMath>{'t'}</InlineMath>, <InlineMath>{'x_t'}</InlineMath> is the sampled persistent state, and the barred maps are the transition and input maps produced by the step size <InlineMath>{'\\Delta'}</InlineMath>. The pre-input state is <InlineMath>{'x_{-1}=0'}</InlineMath>, so the first token produces <InlineMath>{'x_0'}</InlineMath>. When the maps stay fixed across positions, unrolling gives <InlineMath>{'y_t=\\sum_{\\ell=0}^{t}K_{\\ell}u_{t-\\ell}+Du_t'}</InlineMath>, where <InlineMath>{'K_{\\ell}=C\\bar A^{\\ell}\\bar B'}</InlineMath>. That is the causal convolution kernel.</p>
    <p style={prose}>The same fixed SSM therefore has two exact views: update one state at a time, or apply its kernel to the whole input. The widget uses the same zero-based convention and scalar case <InlineMath>{'\\bar A=a'}</InlineMath>, <InlineMath>{'\\bar B=C=1'}</InlineMath>, and <InlineMath>{'D=0'}</InlineMath>, so <InlineMath>{'K_{\\ell}=a^{\\ell}'}</InlineMath>. With <InlineMath>{'x_{-1}=0'}</InlineMath>, <InlineMath>{'a = 0.75'}</InlineMath>, and inputs <InlineMath>{'[1, 0, 0]'}</InlineMath>, both computations give <InlineMath>{'[1, 0.75, 0.5625]'}</InlineMath>.</p>
    <p style={prose}>Choose the pulse preset, then raise the decay toward 0.95. Notice that both output panels remain identical while the kernel holds information for more positions.</p>
    <SSMDuality tryThis={{ do: 'Choose pulse and raise the decay toward 0.95.', notice: 'the recurrent scan and causal convolution stay numerically identical, while the kernel keeps a longer memory of the pulse.' }} />
    <p style={prose}>Fixed dynamics are efficient, but they cannot decide that one token is worth remembering while the next should erase a state. Mamba makes selected SSM parameters functions of the input, so a token can alter how strongly state is propagated or written. Gu and Dao (2024) [2] call this selectivity; it loses the simple fixed convolution but retains a parallel, hardware-aware scan algorithm.</p>
    <p style={prose}>Switch from remember state to replace state. Notice how the low retention gate removes the old value before the later query reads the state.</p>
    <SelectiveScan tryThis={{ do: 'Switch between remember state and replace state.', notice: 'the new-fact token changes its retention gate, so the same recurrence either preserves an earlier value or rapidly overwrites it.' }} />

    <div id="rwkv-and-linear-attention"><SectionTitle>RWKV & Linear Attention</SectionTitle></div>
    <p style={prose}>Linear attention begins from a different direction. It replaces the exponential softmax similarity with a feature map <InlineMath>{'\\phi'}</InlineMath> whose dot products can be regrouped. Instead of retaining all previous keys and values, the model carries two running sums. Katharopoulos et al. (2020) [3] showed that this associativity makes an autoregressive attention layer look like an RNN.</p>
    <MathBlock>{'$$S_t = S_{t-1} + \\phi(k_t)v_t^\\top, \\quad z_t = z_{t-1} + \\phi(k_t), \\quad o_t = \\frac{\\phi(q_t)^\\top S_t}{\\phi(q_t)^\\top z_t}$$'}</MathBlock>
    <p style={prose}>Here <InlineMath>{'q_t,k_t,v_t'}</InlineMath> are the current query, key, and value, <InlineMath>{'S_t'}</InlineMath> accumulates key-value statistics, <InlineMath>{'z_t'}</InlineMath> normalizes them, and <InlineMath>{'o_t'}</InlineMath> is the output. The recurrence is exact for the chosen kernelized attention rule, but it is not the same function as softmax attention. That change can affect which token-level relationships the model can represent.</p>
    <p style={prose}>RWKV combines a time-mixing recurrence with transformer-style training parallelism. Its authors describe a parallelizable training form and a constant-memory recurrent inference form, reporting competitive dense models at the time of publication [4]. This makes it a useful reminder that the boundary between RNN and attention is algebraic, not a fixed taxonomy.</p>
    <p style={prose}>Drag the sequence length through several powers of two. Notice that the attention bar accelerates away from the scan, while the linear-attention row also reveals its width-dependent <InlineMath>{'d^2'}</InlineMath> accumulator.</p>
    <ComplexityRace tryThis={{ do: 'Move the length slider from 256 to 262,144 tokens.', notice: 'pairwise attention grows fastest, while a scan keeps fixed state; linear attention is linear in T but its feature accumulator still scales with width.' }} />

    <div id="hybrids-in-production"><SectionTitle>Hybrids in Production</SectionTitle></div>
    <p style={prose}>Replacing every attention layer is not the only option. A hybrid allocates cheap recurrent or state-space layers to most positions, then uses selected attention layers where direct token-to-token lookup is valuable. Jamba interleaves transformer and Mamba blocks with mixture-of-experts layers [5]. Griffin combines gated linear recurrences with local attention [6]. Both designs treat architecture as a resource allocation problem rather than a referendum on attention.</p>
    <MathBlock>{'$$\\text{hybrid KV state per generated token} \\propto L_{\\mathrm{attn}}\\,d,\\qquad \\text{SSM recurrent state} \\propto L_{\\mathrm{scan}}\\,dN$$'}</MathBlock>
    <p style={prose}>Here <InlineMath>{'L_{\\mathrm{attn}}'}</InlineMath> and <InlineMath>{'L_{\\mathrm{scan}}'}</InlineMath> count attention and scan layers, <InlineMath>{'d'}</InlineMath> is the layer width, and <InlineMath>{'N'}</InlineMath> is the SSM state dimension per channel. Each attention layer adds a key and value for every earlier token; a scan layer instead carries a fixed, but not dimension-free, recurrent state of roughly <InlineMath>{'dN'}</InlineMath> values.</p>
    <p style={prose}>This choice has real limits. A compact state has to decide what to preserve before it knows every future question, whereas an attention head can directly compare a late query with a specific earlier token still in its cache. The Mamba-2 analysis makes the connection even closer, relating structured SSMs and attention through structured matrix classes [7], but equivalence of some forms does not erase the different inductive biases or implementation trade-offs.</p>
    <p style={prose}>Start with attention-heavy, then choose scan-heavy. Notice the cache proxy fall sharply; the recall index falls too because this deliberately simple score assigns direct global lookup to attention layers.</p>
    <HybridLayerMixer tryThis={{ do: 'Compare the attention-heavy and scan-heavy presets, then build a hybrid.', notice: 'fewer attention layers cut the per-token cache proxy, but the disclosed direct-recall heuristic falls unless some attention remains.' }} />

    <SectionTitle>What carries forward</SectionTitle>
    <p style={prose}>Long-sequence architectures are defined by the information they carry forward and the work they repeat at each position. SSMs preserve a learned state, selective scans make that preservation content-dependent, and linear attention rewrites an attention-like operation as a recurrence. Hybrids retain attention where direct retrieval is worth its cache while using cheaper layers elsewhere. Chapter 23 returns to one reason transformers remain compelling: their residual streams and attention patterns provide unusually concrete objects for interpretability.</p>
    <div style={{ marginTop: 28, marginBottom: 12, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '.08em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Exercises</div>
    <ExerciseCard number="01">For the scalar SSM <InlineMath>{'x_t = 0.8x_{t-1} + u_t'}</InlineMath> with <InlineMath>{'x_{-1}=0'}</InlineMath> and inputs <InlineMath>{'[1,0,0]'}</InlineMath>, compute the three states. Then write its first three convolution-kernel values and verify the same output.</ExerciseCard>
    <ExerciseCard number="02">At <InlineMath>{'T=32,768'}</InlineMath>, estimate the ratio between <InlineMath>{'T^2d'}</InlineMath> attention-score products and <InlineMath>{'Td'}</InlineMath> SSM updates for the same head width. Which assumptions does that ratio leave out?</ExerciseCard>
    <ExerciseCard number="03">Design an eight-layer hybrid for a task that needs exact access to a few far-away identifiers but mostly reads local prose. Mark where you would place attention layers and defend the memory-versus-retrieval trade-off.</ExerciseCard>
    <Citations citations={CITATIONS} />
  </article>;
}

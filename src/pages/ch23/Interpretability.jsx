import { useTocSections } from '../../components/layout/TocRail';
import { buildCitations } from '../../data/citations';
import SectionTitle from '../../components/shared/SectionTitle';
import ChapterLede from '../../components/shared/ChapterLede';
import Citations from '../../components/shared/Citations';
import InlineMath from '../../components/shared/InlineMath';
import MathBlock from '../../components/shared/MathBlock';
import ExerciseCard from '../../components/shared/ExerciseCard';
import MechanisticEvidenceLadder from '../../components/diagrams/ch23/MechanisticEvidenceLadder';
import ProbingPlayground from '../../components/widgets/ch23/ProbingPlayground';
import SuperpositionExplorer from '../../components/widgets/ch23/SuperpositionExplorer';
import InductionHeadTracer from '../../components/widgets/ch23/InductionHeadTracer';
import SAEFeatureBrowser from '../../components/widgets/ch23/SAEFeatureBrowser';
import SteeringDemo from '../../components/widgets/ch23/SteeringDemo';

const prose = { fontFamily: "'Inter', sans-serif", fontSize: 'var(--prose-size, 15px)', fontWeight: 400, color: '#b8c4cc', lineHeight: 'var(--prose-line-height, 1.75)', margin: '0 0 var(--prose-margin-bottom, 20px)' };
const CITATIONS = buildCitations([
  { title: 'Understanding Intermediate Layers Using Linear Classifier Probes', authors: 'Alain, Bengio', venue: 'ICLR Workshop', year: '2017', tag: 'paper' },
  { title: 'Toy Models of Superposition', authors: 'Elhage et al.', venue: 'Transformer Circuits Thread', year: '2022', tag: 'seminal' },
  { title: 'In-context Learning and Induction Heads', authors: 'Olsson et al.', venue: 'Transformer Circuits Thread', year: '2022', tag: 'seminal' },
  { title: 'Towards Monosemanticity: Decomposing Language Models With Dictionary Learning', authors: 'Bricken et al.', venue: 'Transformer Circuits Thread', year: '2023', tag: 'seminal' },
  { title: 'Scaling Monosemanticity: Extracting Interpretable Features from Claude 3 Sonnet', authors: 'Templeton et al.', venue: 'Transformer Circuits Thread', year: '2024', tag: 'paper' },
  { title: 'Steering Language Models With Activation Engineering', authors: 'Turner et al.', venue: 'arXiv', year: '2023', tag: 'paper' },
]);

const TOC_SECTIONS = [
  { id: 'understanding-a-model', label: 'What Is Understanding?' },
  { id: 'features-and-superposition', label: 'Features & Superposition' },
  { id: 'circuits-and-induction', label: 'Circuits & Induction Heads' },
  { id: 'sparse-autoencoders', label: 'Sparse Autoencoders' },
  { id: 'steering-and-limits', label: 'Steering & Limits' },
];

export default function Interpretability() {
  useTocSections(TOC_SECTIONS);
  return <article style={{ maxWidth: 'var(--chapter-max-width, 740px)', margin: '0 auto', padding: 'var(--chapter-padding, 52px 44px 100px)' }}>
    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 'var(--chapter-meta-size, 10.5px)', letterSpacing: '.1em', color: 'var(--accent)', opacity: .7, textTransform: 'uppercase', marginBottom: 12 }}>Chapter 23 · Part VI — Evaluation &amp; Understanding</div>
    <h1 style={{ fontFamily: "'Crimson Pro', serif", fontSize: 'var(--h1-size, 42px)', fontWeight: 600, color: 'var(--text)', margin: 0, lineHeight: 'var(--h1-line-height, 1.15)' }}>Interpretability</h1>
    <ChapterLede>A model can produce a correct answer while leaving us unable to say how it got there. Interpretability turns internal activations, attention patterns, and causal interventions into evidence about the computation between prompt and output. That evidence can guide debugging and safety work, but it demands more than a compelling visualization.</ChapterLede>

    <div id="understanding-a-model"><SectionTitle>Understanding Requires a Claim and Evidence</SectionTitle></div>
    <p style={prose}>Behavioral understanding predicts what a system does: it may tell us that a model completes a repeated pattern, recognizes a concept, or fails a robustness test. Mechanistic understanding makes a sharper claim about how an internal computation produces that behavior. The distinction matters because a model can contain information about a concept without using that information on the decision we care about.</p>
    <MathBlock>{'$$\\hat{y}=\\operatorname{sign}(w^\\top h^{(\\ell)}+b)$$'}</MathBlock>
    <p style={prose}>Here <InlineMath>{'h^{(\\ell)}'}</InlineMath> is the hidden state at layer <InlineMath>{'\\ell'}</InlineMath>, and <InlineMath>{'w'}</InlineMath> and <InlineMath>{'b'}</InlineMath> are the weight and bias of a linear probe, a small readout trained to recover a target label. Alain and Bengio (2017) [1] framed probes as a way to study intermediate representations. A high probe score establishes that the target is decodable from that state; it does not show that the original model reads the same direction or that the direction causes its output.</p>
    <p style={prose}>Read the evidence ladder, then move the probe across layers. Notice that a rising accuracy curve is evidence of accessible information, while a targeted intervention would test a more direct causal prediction.</p>
    <MechanisticEvidenceLadder />
    <ProbingPlayground tryThis={{ do: 'Move from layer 1 to layer 5 and inspect the fitted boundary.', notice: 'the label becomes easier to decode before the final layer, but the toy probe alone cannot establish that a downstream computation uses it.' }} />
    <p style={prose}>Treat interpretability results as measurements with a scope. State the model, layer, dataset, metric, and intervention; test a hypothesis that could fail; and compare against sensible controls. A readable label assigned after looking at a handful of examples is a starting hypothesis, not a completed explanation.</p>

    <div id="features-and-superposition"><SectionTitle>Features Can Share a Representation</SectionTitle></div>
    <p style={prose}>A feature is a useful direction or pattern in an activation space, such as a semantic property, a token relation, or a computational intermediate. One neuron need not equal one feature. When a network has more useful features than convenient dimensions, it can encode several features in nearly independent directions and accept some interference when they co-occur.</p>
    <MathBlock>{'$$h=\\sum_{i=1}^{m} a_i f_i,\\qquad r_j=f_j^\\top h$$'}</MathBlock>
    <p style={prose}>Here <InlineMath>{'f_i'}</InlineMath> is a feature direction, <InlineMath>{'a_i'}</InlineMath> is its activation, <InlineMath>{'h'}</InlineMath> is the shared representation, and <InlineMath>{'r_j'}</InlineMath> is a dot-product readout. If directions are not orthogonal, the readout for feature <InlineMath>{'j'}</InlineMath> also receives contributions from other active features. Elhage et al. (2022) [2] used small networks to show how this superposition trade-off can arise.</p>
    <p style={prose}>Increase the feature count while keeping the representation two-dimensional. Notice that the inactive directions acquire nonzero readouts when two chosen directions overlap, which is the concrete cost of packing more features into the same space.</p>
    <SuperpositionExplorer tryThis={{ do: 'Set the feature count to 8, then choose several different first active features.', notice: 'the active features remain readable, but the mean inactive cross-talk rises because the directions cannot all stay orthogonal in two dimensions.' }} />
    <p style={prose}>This geometry is a reason to be cautious with neuron-level stories. A feature can be distributed across many neurons, a neuron can participate in several features, and a sparse method may recover a more useful basis without proving that it is unique or complete.</p>

    <div id="circuits-and-induction"><SectionTitle>Circuits Connect Features Into Computations</SectionTitle></div>
    <p style={prose}>Chapter 10 introduced the residual stream as the shared channel that attention heads and MLPs read from and write to. A circuit is a small, testable account of connected components using that channel to implement a behavior. It is more demanding than noticing an interesting activation because it predicts which paths matter, at which positions, and what happens when they are changed.</p>
    <MathBlock>{'$$\\operatorname{Attn}(Q,K,V)=\\operatorname{softmax}\\!\\left(\\frac{QK^\\top}{\\sqrt{d_k}}\\right)V$$'}</MathBlock>
    <p style={prose}>Here <InlineMath>{'Q'}</InlineMath>, <InlineMath>{'K'}</InlineMath>, and <InlineMath>{'V'}</InlineMath> are query, key, and value matrices, and <InlineMath>{'d_k'}</InlineMath> is the per-head key dimension. An induction head is a canonical two-stage example: one head makes prior-token identity available at a later position, and a second head uses a repeated token to retrieve what followed its earlier occurrence. Olsson et al. (2022) [3] identified this pattern in attention-only transformers and connected it to in-context learning behavior.</p>
    <p style={prose}>Step through the repeated-token sequence. Notice that the final A does not simply attend to an earlier A: the first head makes the key at B carry A, letting the second head retrieve B as the predicted continuation.</p>
    <InductionHeadTracer tryThis={{ do: 'Select step 2, then step 3.', notice: 'the previous-token head changes the keys available to the induction head, so the final A can retrieve B rather than merely copy A.' }} />
    <p style={prose}>The tracer is deliberately tiny. Real circuit work tests attention and MLP pathways across many prompts, uses ablation or activation patching, and checks whether the intervention changes the predicted behavior while matched controls do not. A named circuit is useful only to the extent that those causal tests hold.</p>

    <div id="sparse-autoencoders"><SectionTitle>Dictionary Learning Searches for Sparse Features</SectionTitle></div>
    <p style={prose}>Sparse autoencoders, or SAEs, are dictionary-learning models trained to represent an activation using a small number of learned feature directions. The encoder maps a model activation into a wide feature space; the decoder reconstructs the original activation. The sparsity pressure encourages only a few features to be active for any one token, making it possible to inspect top activating contexts feature by feature.</p>
    <MathBlock>{'$$\\mathcal{L}_{\\mathrm{SAE}}=\\lVert x-Dz\\rVert_2^2+\\lambda\\lVert z\\rVert_1,\\qquad z\\ge0$$'}</MathBlock>
    <p style={prose}>Here <InlineMath>{'x'}</InlineMath> is a model activation, <InlineMath>{'D'}</InlineMath> is a learned decoder dictionary, <InlineMath>{'z'}</InlineMath> is the sparse feature code, and <InlineMath>{'\\lambda'}</InlineMath> sets the reconstruction-versus-sparsity trade-off. Bricken et al. (2023) [4] introduced a dictionary-learning approach to decomposing transformer activations. Templeton et al. (2024) [5] reported SAEs with up to 34 million features on a middle residual stream of Claude 3 Sonnet, along with interpretable examples and substantial dead-feature and coverage limitations.</p>
    <p style={prose}>Choose the type-mismatch input and select its type-signature feature. Notice that the coordinate-descent solution uses a few dictionary vectors to reconstruct the activation, while the feature browser ranks toy inputs by the same coefficient rather than by a scripted label.</p>
    <SAEFeatureBrowser tryThis={{ do: 'Choose input 3 and select f3, type signature.', notice: 'the sparse code assigns f3 a large coefficient and the same coefficient ranks the type-mismatch context near the top.' }} />
    <p style={prose}>Frontier-scale feature dictionaries are promising instruments, not complete model maps. A reconstruction score can hide missing or split features; automated explanations can overstate specificity; and a feature that correlates with a behavior still needs an intervention test. Current work continues to improve training, feature search, and evaluation, so claims about coverage should name the model and method rather than treating an SAE as ground truth.</p>

    <div id="steering-and-limits"><SectionTitle>Intervention Is Useful and Easy to Overread</SectionTitle></div>
    <p style={prose}>Activation steering adds a chosen direction to an internal state during inference, then lets the remaining layers generate from the altered state. It turns a representation hypothesis into a causal experiment: if an appropriately constructed vector shifts an intended behavior under controls, the direction participates in that computation at the selected layer. It also offers a lightweight control mechanism, but a successful shift is not a guarantee of safety, robustness, or semantic precision.</p>
    <MathBlock>{'$$h^{(\\ell)}_{\\mathrm{steered}}=h^{(\\ell)}+\\alpha v$$'}</MathBlock>
    <p style={prose}>Here <InlineMath>{'h^{(\\ell)}'}</InlineMath> is a residual-stream state at layer <InlineMath>{'\\ell'}</InlineMath>, <InlineMath>{'v'}</InlineMath> is a steering direction, and <InlineMath>{'\\alpha'}</InlineMath> is its strength. Turner et al. (2023) [6] used contrast-prompt activation differences for inference-time activation additions. The intervention can alter off-target behavior as well, and its effect can change with layer, context, decoding, model version, and scale.</p>
    <p style={prose}>Push warmth to a positive strength, then reverse it. Notice that the toy decoder's probabilities follow the explicit vector addition and softmax, while a large move also changes every output logit, not only the desired one.</p>
    <SteeringDemo tryThis={{ do: 'Choose warmth and move λ from +1.0 to −1.0.', notice: 'the warm-answer probability shifts in the intended direction, but the same intervention also redistributes probability across the other answers.' }} />
    <p style={prose}>Interpretability is strongest when it joins descriptive evidence to falsifiable causal tests and operational evaluation. It remains incomplete on polysemantic features, distributed computation, long chains of interaction, and the gap between a locally understood mechanism and a global safety claim. The honest result is often a bounded explanation with known blind spots.</p>

    <SectionTitle>What carries forward</SectionTitle>
    <p style={prose}>A probe tells us what a representation makes accessible, while a circuit and an intervention test more specific claims about computation. Superposition explains why features need not line up with individual neurons; SAEs provide a practical, imperfect way to search for a sparse feature basis at scale. Steering makes the causal ambition visible, but it also shows why a behavior change alone is not a complete explanation. Chapter 24 carries this discipline into agent systems, where model internals meet tools, memory, permissions, and long-running trajectories.</p>
    <div style={{ marginTop: 28, marginBottom: 12, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '.08em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Exercises</div>
    <ExerciseCard number="01">A linear probe reaches 94% accuracy for a sentiment label at layer 12. Give one reason this does not establish that the model uses the probe direction to produce its answer. Describe one intervention or control that would test a stronger claim.</ExerciseCard>
    <ExerciseCard number="02">In a two-dimensional representation, take <InlineMath>{'f_1=(1,0)'}</InlineMath>, <InlineMath>{'f_2=(0,1)'}</InlineMath>, and <InlineMath>{'f_3=(1,1)/\\sqrt{2}'}</InlineMath>. If <InlineMath>{'h=f_1+f_3'}</InlineMath>, compute <InlineMath>{'f_2^\\top h'}</InlineMath>. What does its nonzero value illustrate about interference?</ExerciseCard>
    <ExerciseCard number="03">Write a causal test for a proposed SAE feature that appears to track code type errors. Name the prompt set, the intervention, a matched control, and the behavioral metric that would count against your hypothesis.</ExerciseCard>
    <Citations citations={CITATIONS} />
  </article>;
}

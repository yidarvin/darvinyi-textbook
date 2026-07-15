import { useTocSections } from '../../components/layout/TocRail';
import { buildCitations } from '../../data/citations';
import SectionTitle from '../../components/shared/SectionTitle';
import ChapterLede from '../../components/shared/ChapterLede';
import Citations from '../../components/shared/Citations';
import InlineMath from '../../components/shared/InlineMath';
import MathBlock from '../../components/shared/MathBlock';
import ExerciseCard from '../../components/shared/ExerciseCard';
import ContaminationPathways from '../../components/diagrams/ch22/ContaminationPathways';
import PerplexityVsAccuracy from '../../components/widgets/ch22/PerplexityVsAccuracy';
import PassAtKCalculator from '../../components/widgets/ch22/PassAtKCalculator';
import JudgeAgreementExplorer from '../../components/widgets/ch22/JudgeAgreementExplorer';
import AgentTrajectoryScorer from '../../components/widgets/ch22/AgentTrajectoryScorer';

const prose = { fontFamily: "'Inter', sans-serif", fontSize: 'var(--prose-size, 15px)', fontWeight: 400, color: '#b8c4cc', lineHeight: 'var(--prose-line-height, 1.75)', margin: '0 0 var(--prose-margin-bottom, 20px)' };
const CITATIONS = buildCitations([
  { title: 'Evaluating Large Language Models Trained on Code', authors: 'Chen et al.', venue: 'arXiv', year: '2021', tag: 'seminal' },
  { title: 'Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena', authors: 'Zheng et al.', venue: 'NeurIPS', year: '2023', tag: 'seminal' },
  { title: 'Rethinking Benchmark and Contamination for Language Models with Rephrased Samples', authors: 'Yang, Chiang, Zheng, Gonzalez, Stoica', venue: 'arXiv', year: '2023', tag: 'paper' },
  { title: 'SWE-bench: Can Language Models Resolve Real-World GitHub Issues?', authors: 'Jimenez et al.', venue: 'ICLR', year: '2024', tag: 'seminal' },
  { title: 'WebArena: A Realistic Web Environment for Building Autonomous Agents', authors: 'Zhou et al.', venue: 'ICLR', year: '2024', tag: 'paper' },
]);
const TOC_SECTIONS = [
  { id: 'perplexity-vs-task-performance', label: 'Perplexity vs Task Perf.' },
  { id: 'pass-at-k', label: 'pass@k' },
  { id: 'llm-as-judge', label: 'LLM-as-Judge' },
  { id: 'contamination-and-hygiene', label: 'Contamination' },
  { id: 'evaluating-agents', label: 'Evaluating Agents' },
];

export default function EvaluatingLLMsAndAgents() {
  useTocSections(TOC_SECTIONS);
  return <article style={{ maxWidth: 'var(--chapter-max-width, 740px)', margin: '0 auto', padding: 'var(--chapter-padding, 52px 44px 100px)' }}>
    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 'var(--chapter-meta-size, 10.5px)', letterSpacing: '.1em', color: 'var(--accent)', opacity: .7, textTransform: 'uppercase', marginBottom: 12 }}>Chapter 22 · Part VI — Evaluation &amp; Understanding</div>
    <h1 style={{ fontFamily: "'Crimson Pro', serif", fontSize: 'var(--h1-size, 42px)', fontWeight: 600, color: 'var(--text)', margin: 0, lineHeight: 'var(--h1-line-height, 1.15)' }}>Evaluating LLMs &amp; Agents</h1>
    <ChapterLede>A model score is a measurement, not the capability itself. This chapter turns evaluation into an object of study: match a metric to the decision it will support, make sampling and judges explicit, and protect the test from the system being measured. These choices matter even more for agents, whose final answer hides a costly trajectory through tools and environments.</ChapterLede>

    <div id="perplexity-vs-task-performance"><SectionTitle>Perplexity Measures Predictive Fit</SectionTitle></div>
    <p style={prose}>Perplexity asks how surprised an autoregressive language model is by the next token in a held-out text distribution. Token-average negative log loss, or cross-entropy, is strictly proper for that distribution. Perplexity is its exponential, an effective-branching-factor presentation that is useful for comparing language-model fit under a controlled tokenizer, corpus, and evaluation protocol. It is not a general measure of whether a system follows instructions, writes a working program, or uses a tool safely, because those are different conditional distributions and decisions.</p>
    <MathBlock>{'$$\operatorname{PPL}(x_{1:N}) = \exp\!\left(-\frac{1}{N}\sum_{t=1}^{N}\log p_\theta(x_t\mid x_{<t})\right)$$'}</MathBlock>
    <p style={prose}>Here <InlineMath>{'x_{1:N}'}</InlineMath> is a sequence of <InlineMath>{'N'}</InlineMath> tokens, <InlineMath>{'p_\theta'}</InlineMath> is the model's next-token distribution, and the average negative log probability is converted back from nats into an effective branching factor. If a four-token sequence receives probabilities <InlineMath>{'[0.5, 0.5, 0.25, 0.5]'}</InlineMath>, its mean negative log probability is <InlineMath>{'-(\log .5+\log .5+\log .25+\log .5)/4\approx0.87'}</InlineMath>, so its perplexity is about <InlineMath>{'e^{0.87}\approx2.38'}</InlineMath>. That number says nothing by itself about a coding test or an agent task.</p>
    <p style={prose}>Move the shared-quality slider toward the top. Notice that the token-weighted perplexity and the rare-decision task score improve on different scales because the toy corpus weights routine tokens at 95%.</p>
    <PerplexityVsAccuracy tryThis={{ do: 'Move model quality from 20 to 90.', notice: 'perplexity follows the token mixture, while task accuracy follows the rare decision token alone.' }} />
    <p style={prose}>The practical response is not to discard perplexity. Use it for distributional fit, then add task evaluations that execute the relevant action and report the conditions that make results comparable. Chapter 21 surveys benchmark families; this chapter focuses on what their reported numbers mean.</p>

    <div id="pass-at-k"><SectionTitle>Sampling Changes What Success Means</SectionTitle></div>
    <p style={prose}>A generative model can produce several candidate programs for one prompt. For an executable coding task, pass@<InlineMath>{'k'}</InlineMath> asks whether at least one of <InlineMath>{'k'}</InlineMath> sampled completions passes the tests. Chen et al. (2021) [1] introduced the estimator used with HumanEval, where a fixed pool of generated completions lets us estimate the probability of finding one correct sample without spending an equal number of executions on every value of <InlineMath>{'k'}</InlineMath>.</p>
    <MathBlock>{'$$\operatorname{pass@}k = 1 - \frac{\binom{n-c}{k}}{\binom{n}{k}}$$'}</MathBlock>
    <p style={prose}>Here <InlineMath>{'n'}</InlineMath> is the number of generated completions, <InlineMath>{'c'}</InlineMath> is the number that pass the test suite, and the fraction is the chance that a size-<InlineMath>{'k'}</InlineMath> subset contains no correct completion. With <InlineMath>{'n=20'}</InlineMath>, <InlineMath>{'c=3'}</InlineMath>, and <InlineMath>{'k=10'}</InlineMath>, the chance of missing all three correct programs is <InlineMath>{'\binom{17}{10}/\binom{20}{10}\approx0.105'}</InlineMath>, so pass@10 is about 89.5%.</p>
    <p style={prose}>Set three correct completions in a pool of twenty, then compare pass@1 with pass@10 and pass@100. Notice that <InlineMath>{'k'}</InlineMath> is a compute budget and a reliability choice, not a cosmetic suffix on accuracy.</p>
    <PassAtKCalculator tryThis={{ do: 'Set n = 20 and c = 3, then compare pass@1 and pass@10.', notice: 'sampling more candidates can raise the chance of finding a working one even when the underlying pool has not changed.' }} />
    <p style={prose}>Report the sampling temperature, maximum attempts, test harness, and selection rule with pass@<InlineMath>{'k'}</InlineMath>. A deployment that can afford one candidate is better described by pass@1; a system that retries and verifies candidates should also report the cost, latency, and failure behavior of that loop.</p>

    <div id="llm-as-judge"><SectionTitle>Judges Need Calibration, Not Mystique</SectionTitle></div>
    <p style={prose}>Open-ended outputs often lack a single executable answer. An LLM-as-judge is then a model prompted with a rubric to compare or score candidate responses. Pairwise comparisons usually ask a narrower question than an absolute 1-to-10 grade, and repeated comparisons can be aggregated with a Bradley-Terry or Elo-style model. Zheng et al. (2023) [2] found that strong judges can agree substantially with people on their evaluation sets, while also documenting position, verbosity, self-enhancement, and reasoning limitations.</p>
    <MathBlock>{'$$P(A \succ B) = \sigma\!\left(q_A-q_B+b_{\mathrm{position}}+b_{\mathrm{length}}\right)$$'}</MathBlock>
    <p style={prose}>Here <InlineMath>{'q_A-q_B'}</InlineMath> is a latent quality difference, <InlineMath>{'\sigma'}</InlineMath> is the logistic function, and the two <InlineMath>{'b'}</InlineMath> terms stand for systematic judge effects that can favor a displayed position or a response length. A real evaluation estimates and audits such effects with human reference judgments, randomized order, rubric tests, and disagreement slices. It should never treat one judge prompt as an oracle.</p>
    <p style={prose}>Set first-position bias to +1.00, then set the length coefficient to +1.00. This deliberately unrandomized sample shows A first four times and makes A longer in every row, so the expected A win rate and Elo-style aggregate rise even though the fixed quality margins do not change.</p>
    <JudgeAgreementExplorer tryThis={{ do: 'Set first-position bias and the length coefficient to +1.00.', notice: 'the expected A win rate and Elo-style A rating rise even though the synthetic quality margins stay fixed.' }} />
    <p style={prose}>Use judges where they are validated against the target human decision, retain raw judgments and rubric versions, and reserve human review for high-stakes or ambiguous cases. Agreement is evidence about a measurement procedure, not proof that the procedure measures every quality we care about.</p>

    <div id="contamination-and-hygiene"><SectionTitle>Keep the Test Ahead of the Training Loop</SectionTitle></div>
    <p style={prose}>Benchmark contamination is exposure to evaluation material, its answers, or close variants before measurement. At web scale, material can enter pretraining through a crawl, supervised fine-tuning through copied examples, or iterative development through public leaderboard feedback. Exact n-gram matching is useful but incomplete: Yang et al. (2023) [3] showed that rephrased samples can evade simple overlap checks and reported overlap in widely used code data.</p>
    <p style={prose}>Read the routes from a public benchmark to a reported score. Notice that no single control closes every path: a training-data cutoff does not undo benchmark-tuning feedback, and a private test does not make its scoring rubric automatically valid.</p>
    <ContaminationPathways />
    <p style={prose}>A credible report states the data cutoff, matching or decontamination procedure, evaluation release date, model-development exposure, and any private or dynamically generated items. Canary strings, deliberately planted uncommon text, can test whether a pipeline or model reproduces known material, but their absence is not a certificate that a benchmark is clean. Fresh, private, or dynamically instantiated tasks narrow exposure opportunities, while independent replication and multiple benchmark families reduce reliance on one brittle number.</p>

    <div id="evaluating-agents"><SectionTitle>Evaluate the Trajectory and the Outcome</SectionTitle></div>
    <p style={prose}>An agent is a model embedded in a loop of observations, tool calls, state updates, and actions. A final outcome can be checked automatically, such as whether a patch passes a test suite or whether a web environment reaches a target state. SWE-bench frames software repair around repository issues and executable tests [4]; WebArena supplies reproducible websites and task-completion evaluators [5]. Both make the environment and evaluator part of the benchmark, rather than treating a final text string as the whole system.</p>
    <MathBlock>{'$$\operatorname{score}_{\mathrm{agent}} = \left(\operatorname{success},\; \operatorname{cost},\; \operatorname{latency},\; \operatorname{reliability},\; \operatorname{trajectory\ audit}\right)$$'}</MathBlock>
    <p style={prose}>Here success is task completion under a stated evaluator, cost includes model and tool usage, latency is elapsed completion time, reliability is performance across repeated runs or tasks, and a trajectory audit examines intermediate actions such as unsafe writes or unnecessary external calls. For repeated full runs, <InlineMath>{'\operatorname{pass}^k'}</InlineMath> means that all <InlineMath>{'k'}</InlineMath> independent attempts succeed, whereas pass@<InlineMath>{'k'}</InlineMath> means at least one succeeds. They answer opposite operational questions.</p>
    <p style={prose}>Reveal the canned repair trace one step at a time. Notice that outcome-only scoring stays at zero until the end, while the visible trajectory rubric gives partial credit and penalizes the unrelated edit.</p>
    <AgentTrajectoryScorer tryThis={{ do: 'Reveal all five steps, then reset after the unrelated edit.', notice: 'a final pass is valuable but cannot show which intermediate actions a process rubric would reward or penalize.' }} />
    <p style={prose}>Evaluate agents under the permissions, tools, budgets, retries, and environment versions they will actually face. Report failure modes alongside a headline success rate. A capable agent that succeeds only after expensive retries, or that reaches the goal with unsafe side effects, has not earned the same deployment claim as a reliable, bounded one.</p>

    <SectionTitle>What carries forward</SectionTitle>
    <p style={prose}>Evaluation begins by naming the decision and the distribution, then choosing a metric that makes its assumptions visible. Perplexity measures next-token fit; pass@<InlineMath>{'k'}</InlineMath> measures sampled opportunity; judge agreement measures a calibrated proxy for human preference; and agent evaluation must include the environment, trajectory, and resource budget. Contamination controls protect a score from known exposure routes but do not replace a broader evidence portfolio. Chapter 23 turns from behavior to mechanism: it asks what internal representations and causal interventions can reveal about why a model produces a result.</p>
    <div style={{ marginTop: 28, marginBottom: 12, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '.08em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Exercises</div>
    <ExerciseCard number="01">A model assigns probabilities <InlineMath>{'[0.8,0.4,0.5,0.25]'}</InlineMath> to four held-out next tokens. Compute its mean negative log probability and perplexity. Name one useful capability this score still does not test.</ExerciseCard>
    <ExerciseCard number="02">For <InlineMath>{'n=10'}</InlineMath> generated programs with <InlineMath>{'c=2'}</InlineMath> correct, compute pass@1 and pass@5 from the estimator. Which number would you report for a product that only permits one execution attempt?</ExerciseCard>
    <ExerciseCard number="03">Write a three-criterion rubric for a customer-support agent that must resolve a refund request. Separate outcome checks from trajectory checks, then identify one cost or safety metric that the rubric still misses.</ExerciseCard>
    <Citations citations={CITATIONS} />
  </article>;
}

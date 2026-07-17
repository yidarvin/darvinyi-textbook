// Chapter 14 — Efficient Inference & Deployment. Build + Integrate complete
// (queue item N14, context/V2_PLAN.md Appendix C). All seven widgets are
// wired in reading order: SoftmaxTemperature (14.1), SamplingPlayground
// (14.2), ServingSimulator (14.3), QuantizationExplorer (14.4),
// SpeculativeRace (14.5), LoRADecomposition (14.6), LoRARankExplorer (14.7).
// The two MOVED-FROM sections (Section 1's softmax-temperature material,
// originally old ch07/new ch09 Attention, and Section 5's LoRA/QLoRA
// material, originally old ch04/new ch05 Training Techniques) predate this
// pass and are preserved as-is, expanded with new material rather than
// replaced. Chapter is `live: true` in src/data/chapters.js.
import { useTocSections } from "../../components/layout/TocRail";
import { buildCitations } from "../../data/citations";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import InlineMath from "../../components/shared/InlineMath";
import MathBlock from "../../components/shared/MathBlock";
import SoftmaxTemperature from "../../components/widgets/ch14/SoftmaxTemperature";
import SamplingPlayground from "../../components/widgets/ch14/SamplingPlayground";
import ServingSimulator from "../../components/widgets/ch14/ServingSimulator";
import QuantizationExplorer from "../../components/widgets/ch14/QuantizationExplorer";
import SpeculativeRace from "../../components/widgets/ch14/SpeculativeRace";
import LoRADecomposition from "../../components/widgets/ch14/LoRADecomposition";
import LoRARankExplorer from "../../components/widgets/ch14/LoRARankExplorer";
import LoRAMatrixShapes from "../../components/diagrams/ch14/LoRAMatrixShapes";

const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "var(--prose-size, 15px)",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: "var(--prose-line-height, 1.75)",
  margin: "0 0 var(--prose-margin-bottom, 20px)",
};

const CITATIONS = buildCitations([
  { title: "The Curious Case of Neural Text Degeneration", authors: "Holtzman, Buys, Du, Forbes, Choi", venue: "ICLR", year: "2020", tag: "paper" },
  "pagedattention",
  { title: "LLM.int8(): 8-bit Matrix Multiplication for Transformers at Scale", authors: "Dettmers, Lewis, Belkada, Zettlemoyer", venue: "NeurIPS", year: "2022", tag: "paper" },
  { title: "GPTQ: Accurate Post-Training Quantization for Generative Pre-trained Transformers", authors: "Frantar, Ashkboos, Hoefler, Alistarh", venue: "ICLR", year: "2023", tag: "paper" },
  { title: "AWQ: Activation-aware Weight Quantization for On-Device LLM Compression and Acceleration", authors: "Lin, Tang, Tang, Yang, Chen, Wang, Xiao, Dang, Gan, Han", venue: "MLSys", year: "2024", tag: "paper" },
  { title: "Fast Inference from Transformers via Speculative Decoding", authors: "Leviathan, Kalman, Matias", venue: "ICML", year: "2023", tag: "paper" },
  { title: "Accelerating Large Language Model Decoding with Speculative Sampling", authors: "Chen, Borgeaud, Irving, Lespiau, Sifre, Jumper", venue: "arXiv", year: "2023", tag: "paper" },
  { title: "LoRA: Low-Rank Adaptation of Large Language Models", authors: "Hu, Shen, Wallis, Allen-Zhu, Li, Wang, Wang, Chen", venue: "ICLR", year: "2022", tag: "seminal" },
  { title: "QLoRA: Efficient Finetuning of Quantized LLMs", authors: "Dettmers, Pagnoni, Holtzman, Zettlemoyer", venue: "NeurIPS", year: "2023", tag: "paper" },
  { title: "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks", authors: "Lewis, Perez, Piktus, Petroni, Karpukhin, Goyal, Küttler, Lewis, Yih, Rocktäschel, Riedel, Kiela", venue: "NeurIPS", year: "2020", tag: "seminal" },
]);

const TOC_SECTIONS = [
  { id: "decoding-and-sampling",   label: "Decoding & Sampling" },
  { id: "kv-cache-and-batching",   label: "KV Cache & Batching" },
  { id: "quantization",            label: "Quantization" },
  { id: "speculative-decoding",    label: "Speculative Decoding" },
  { id: "lora-and-peft",           label: "LoRA, QLoRA & Retrieval" },
];

export default function EfficientInference() {
  useTocSections(TOC_SECTIONS);

  return (
    <article
      style={{
        maxWidth: "var(--chapter-max-width, 740px)",
        margin: "0 auto",
        padding: "var(--chapter-padding, 52px 44px 100px)",
      }}
    >
      {/* Chapter header */}
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "var(--chapter-meta-size, 10.5px)",
          fontWeight: 400,
          letterSpacing: "0.1em",
          color: "var(--accent)",
          opacity: 0.7,
          textTransform: "uppercase",
          marginBottom: "12px",
        }}
      >
        Chapter 14 · Part III — Large Language Models
      </div>

      <h1
        style={{
          fontFamily: "'Crimson Pro', serif",
          fontSize: "var(--h1-size, 42px)",
          fontWeight: 600,
          color: "var(--text)",
          margin: "0 0 0",
          lineHeight: "var(--h1-line-height, 1.15)",
        }}
      >
        Efficient Inference & Deployment
      </h1>

      <ChapterLede>
        A trained LLM is only useful once it runs cheaply, at scale, and can be
        adapted to new tasks without retraining from scratch. This chapter covers
        how a model turns its next-token distribution into actual text, how a
        serving system manages the memory and compute costs of serving many
        simultaneous users, and how it gets adapted cheaply to new tasks instead
        of being fully retrained. Every technique here trades a fixed resource —
        latency, memory, GPU-hours, or training data — for quality, and getting
        that trade-off right is most of what separates a demo from a product.
      </ChapterLede>

      {/* ── Section 1: Decoding & Sampling ───────────────────────────────── */}
      <div id="decoding-and-sampling">
        <SectionTitle>Decoding & Sampling</SectionTitle>
      </div>

      <p style={prose}>
        At every step of generation, a language model produces a probability
        distribution over its entire vocabulary — tens of thousands of
        candidate next tokens, each with an associated probability. Decoding is
        the procedure that turns that distribution into an actual choice: which
        single token gets appended to the sequence before the next forward
        pass. Greedy decoding, beam search, and sampling strategies such as
        top-k, top-p, and temperature-scaled sampling are the standard menu,
        and they trade off determinism against diversity in different ways.
        None of them is free: the choice changes not just how repetitive or
        creative the output feels, but how many forward passes a strategy
        needs and how reproducible a response is across runs.
      </p>

      <p style={prose}>
        The simplest strategy is greedy decoding: at each step, take the
        model's raw output — one real-valued score, called a logit, for every
        entry in the vocabulary — pass it through softmax to get a probability
        distribution, and pick whichever token that distribution rates most
        probable. Greedy decoding is fast and fully deterministic: the same
        prompt always produces exactly the same output, with no extra
        bookkeeping beyond the model's own forward pass. But it compounds
        locally optimal choices into globally mediocre ones — a token that
        looks best right now can foreclose a much better continuation two
        steps later — and applied to open-ended generation it tends to
        produce flat, repetitive text that loops on itself.
      </p>

      <MathBlock>{"$$\\hat{y}_t = \\operatorname*{arg\\,max}_{v \\in V}\\ P(v \\mid y_{<t})$$"}</MathBlock>

      <p style={prose}>
        Here <InlineMath>{"V"}</InlineMath> is the model's vocabulary,{" "}
        <InlineMath>{"y_{<t}"}</InlineMath> the tokens already generated, and{" "}
        <InlineMath>{"\\hat{y}_t"}</InlineMath> the single token greedy
        decoding commits to at step <InlineMath>{"t"}</InlineMath> — whichever
        candidate the distribution currently rates highest.
      </p>

      {/* MOVED-FROM ch09 (Attention), Section 4 "Softmax Temperature" —
          originally the closing section of the Attention chapter; it belongs
          here as the anchor for decoding strategy, not attention mechanics. */}
      <p style={prose}>
        Dividing logits by a scalar <InlineMath>{"T"}</InlineMath> before applying softmax controls the
        sharpness of the output distribution. As <InlineMath>{"T \\to 0"}</InlineMath> the distribution collapses
        toward argmax — a single deterministic winner, same as greedy decoding
        above. At <InlineMath>{"T = 1"}</InlineMath> it is the standard
        softmax. As <InlineMath>{"T \\to \\infty"}</InlineMath> it flattens toward uniform.
      </p>

      <MathBlock>{"$$\\text{softmax}(z/T)_i = \\frac{\\exp(z_i / T)}{\\sum_j \\exp(z_j / T)}$$"}</MathBlock>

      <p style={prose}>
        <InlineMath>{"z"}</InlineMath> is the vector of logits over the
        vocabulary at this step, <InlineMath>{"i"}</InlineMath> indexes one
        specific candidate token, and <InlineMath>{"T"}</InlineMath> is the
        temperature introduced above — the same knob that collapses the
        distribution toward argmax as it shrinks toward 0 and flattens it
        toward uniform as it grows.
      </p>

      <p style={prose}>
        This is one of the most reused tricks in deep learning. In the
        knowledge-distillation literature, a student is trained to match a
        teacher's softmax outputs at high <InlineMath>{"T"}</InlineMath>, which exposes the teacher's relative
        confidences across non-top classes — the so-called dark knowledge that a
        plain one-hot label cannot transmit. In language model sampling,{" "}
        <InlineMath>{"T"}</InlineMath> controls the trade-off between deterministic and creative
        generation:{" "}
        <InlineMath>{"T < 1"}</InlineMath> makes outputs sharper and more predictable, <InlineMath>{"T > 1"}</InlineMath> wilder. In
        contrastive learning — CLIP, SimCLR, and their descendants — the
        temperature on the contrastive softmax is a tuned hyperparameter that
        controls how strongly negatives are pushed away from the anchor.
      </p>

      <p style={prose}>
        Drag the temperature slider below from <InlineMath>{"T = 0.1"}</InlineMath> up past{" "}
        <InlineMath>{"T = 3"}</InlineMath>, then try the four preset buttons in
        order; notice the top city's probability fall from near-certainty
        toward the others as <InlineMath>{"T"}</InlineMath> rises, while the
        entropy readout climbs in lockstep.
      </p>

      <SoftmaxTemperature
        tryThis={{
          do: "Drag the temperature slider from T = 0.1 up past T = 3, then try the four preset buttons in order.",
          notice: "the top city's probability falls from near-certainty toward the others as T rises, and the entropy readout climbs in lockstep — sharp, confident distributions have low entropy, flat ones approach the 2.585-bit maximum for these 6 candidates.",
        }}
      />

      <p style={prose}>
        Temperature reshapes the whole distribution but never removes any
        candidate from consideration — even at low <InlineMath>{"T"}</InlineMath>, a token with near-zero
        probability still has some chance of being sampled, and over a long
        enough generation that chance eventually gets exercised. Top-k
        sampling addresses this by hard-cutting the candidate pool: keep only
        the <InlineMath>{"k"}</InlineMath> highest-probability tokens,
        renormalize their probabilities to sum to 1, and sample from that
        truncated set. A small <InlineMath>{"k"}</InlineMath> (5–10) keeps
        generation focused; a large one approaches unrestricted sampling. The
        drawback is that a fixed <InlineMath>{"k"}</InlineMath> is a blunt
        instrument: some next-token distributions are extremely peaked (only
        one or two tokens are plausible, and a large <InlineMath>{"k"}</InlineMath> needlessly admits garbage)
        while others are genuinely flat (many tokens are plausible, and the
        same <InlineMath>{"k"}</InlineMath> needlessly excludes good ones).
      </p>

      <MathBlock>{"$$V_k = \\{\\,k\\text{ tokens with highest } P(v \\mid y_{<t})\\,\\}, \\qquad P'(v) = \\frac{P(v)}{\\sum_{v' \\in V_k} P(v')} \\ \\text{for } v \\in V_k$$"}</MathBlock>

      <p style={prose}>
        <InlineMath>{"V_k"}</InlineMath> is the top-
        <InlineMath>{"k"}</InlineMath> candidate set at this step, and{" "}
        <InlineMath>{"P'(v)"}</InlineMath> is each surviving token's
        renormalized probability once every token outside{" "}
        <InlineMath>{"V_k"}</InlineMath> has been zeroed out.
      </p>

      <p style={prose}>
        Top-p sampling — also called nucleus sampling — fixes top-k's
        rigidity by choosing the cutoff adaptively. Instead of a fixed
        candidate count, keep the smallest set of highest-probability tokens
        whose cumulative probability just exceeds a threshold{" "}
        <InlineMath>{"p"}</InlineMath>, then renormalize and sample from that
        set. Holtzman et al. (2020) [1] introduced nucleus sampling after
        showing that greedy decoding and beam search — the two
        maximization-based strategies — produce text that is fluent but
        degenerate: bland, repetitive, and stuck in loops, because always
        picking the highest-probability continuation is not actually how
        coherent human text is distributed. A peaked distribution yields a
        small nucleus; a flat one yields a large nucleus automatically — the
        cutoff adapts per step in a way a fixed <InlineMath>{"k"}</InlineMath>{" "}
        cannot.
      </p>

      <MathBlock>{"$$V_p = \\text{smallest set of highest-probability tokens with } \\sum_{v \\in V_p} P(v \\mid y_{<t}) \\ge p, \\qquad P'(v) = \\frac{P(v)}{\\sum_{v' \\in V_p} P(v')}\\ \\text{for } v \\in V_p$$"}</MathBlock>

      <p style={prose}>
        <InlineMath>{"V_p"}</InlineMath> — the nucleus — is built by adding
        tokens in decreasing probability order until their cumulative mass
        crosses the threshold <InlineMath>{"p"}</InlineMath>, and{" "}
        <InlineMath>{"P'(v)"}</InlineMath> renormalizes over just that set,
        exactly as top-k does over <InlineMath>{"V_k"}</InlineMath> above.
      </p>

      <p style={prose}>
        Beam search abandons sampling altogether and searches directly for a
        single high-scoring sequence. It maintains <InlineMath>{"B"}</InlineMath>{" "}
        partial sequences at once (the beam); at each step it considers every
        possible next token for each of the <InlineMath>{"B"}</InlineMath>{" "}
        sequences, scores all the resulting continuations by cumulative
        log-probability, and keeps only the top <InlineMath>{"B"}</InlineMath>{" "}
        for the next step. Because probabilities multiply along a sequence —
        equivalently, log-probabilities add — longer sequences accumulate more
        negative log-probability by default, so production systems divide the
        score by a length-normalization term to avoid a systematic bias toward
        short outputs. Beam search reaches a higher-probability sequence than
        greedy decoding ever could, which is exactly what closed-answer tasks
        like translation and transcription want; but the same finding that
        motivated nucleus sampling above cuts against it for open-ended
        generation too — a beam search's near-maximal sequence inherits the
        same flat, generic quality as greedy decoding, just reached by a wider
        search instead of a narrower one.
      </p>

      <MathBlock>{"$$\\text{score}(y_{1:t}) = \\sum_{i=1}^{t} \\log P(y_i \\mid y_{<i}), \\qquad \\text{keep the top } B \\text{ of } B \\cdot |V| \\text{ candidates at each step}$$"}</MathBlock>

      <p style={prose}>
        <InlineMath>{"y_{1:t}"}</InlineMath> is one candidate partial
        sequence, the sum is its cumulative log-probability, and{" "}
        <InlineMath>{"B"}</InlineMath> is the beam width — how many partial
        sequences survive each round of pruning.
      </p>

      <p style={prose}>
        The widget below fixes one illustrative next-token distribution — a
        toy set of candidate tokens with assigned probabilities, not the
        output of any real model — and lets greedy, temperature, top-k, and
        top-p all run against that same distribution side by side. Switch
        between strategies and watch which tokens are selected or made
        eligible under each; for the stochastic ones, draw a batch of samples
        and watch the resulting token-selection histogram, built from the
        widget's own random draws, take shape.
      </p>

      <SamplingPlayground
        tryThis={{
          do: "Switch to top-p and drag p down toward 0.3, then back up toward 0.99, then switch to top-k and compare its eligible-token count at a similar setting.",
          notice: "top-p's nucleus shrinks and grows continuously with p, while top-k's eligible count is pinned at exactly k regardless of how peaked or flat the underlying distribution is — the adaptive cutoff Holtzman et al. (2020) motivated with the degeneration finding above; draw a batch of samples afterward and the histogram lands on the eligible tokens in roughly their renormalized proportions.",
        }}
      />

      <p style={prose}>
        In practice, decoding strategy is just a request parameter. Chat-oriented
        inference APIs expose temperature and top_p directly to the caller
        (top_k has become less common as a first-class parameter now that
        top_p covers its use case adaptively), and most production defaults
        combine a moderate temperature with a top-p cutoff around 0.9 rather
        than committing to either alone. Beam search survives mainly in tasks
        with one correct answer — machine translation, speech transcription —
        where the degeneration finding above doesn't bite the same way, since
        there genuinely is a best sequence to search for rather than a
        distribution of equally valid continuations.
      </p>

      {/* ── Section 2: KV Cache & Batching ───────────────────────────────── */}
      <div id="kv-cache-and-batching">
        <SectionTitle>The Memory Bill: KV Cache & Batching</SectionTitle>
      </div>

      <p style={prose}>
        Chapter 11 covers the KV cache in depth: keys and values — the
        per-token vectors each attention layer projects from that token's
        hidden state — from every previous token are cached per layer so
        each generation step only computes the new token's contribution, and
        the resulting memory
        footprint — worked out there with real Llama numbers — is what
        actually limits how many requests a GPU can serve at once. This
        chapter picks up from that memory bill. Prefill fills the cache once
        per request in a single parallel pass over the prompt; decode then
        reads the entire, still-growing cache on every subsequent step, one
        token at a time. Everything below is about serving many such requests
        on the same hardware without wasting the GPU's time or the cache's
        memory.
      </p>

      <p style={prose}>
        The obvious way to serve many requests at once is static batching:
        collect a batch of <InlineMath>{"B"}</InlineMath> requests, pad every
        prompt and generation to the length of the longest one in the batch,
        and run all <InlineMath>{"B"}</InlineMath> through the model in
        lockstep — one shared forward pass per step for the whole batch. The
        problem is that requests rarely finish at the same time: the batch as
        a whole isn't done until its slowest member is, so a request that
        finishes early sits occupying a slot, producing nothing, until every
        other request in the batch also finishes. Static batching also turns
        "add a new request to fill idle capacity" into an all-or-nothing
        decision — a new request can only join at the start of the next
        batch, never mid-flight — so a GPU serving bursty, variable-length
        traffic spends much of its time either overcommitted or idling.
      </p>

      <MathBlock>{"$$\\text{utilization} = \\frac{\\sum_i T_i}{B \\cdot \\max_i T_i}$$"}</MathBlock>

      <p style={prose}>
        <InlineMath>{"T_i"}</InlineMath> is the number of decode steps
        request <InlineMath>{"i"}</InlineMath> actually needs, and the
        denominator is every slot's step budget once the batch is forced to
        advance in lockstep with its slowest member. Concretely: a batch of 8
        requests where one needs 500 decode steps and the other seven need 50
        each has utilization <InlineMath>{"(500 + 7 \\cdot 50) / (8 \\cdot 500) = 850/4000 \\approx 21\\%"}</InlineMath>{" "}
        under static batching — the GPU spends four-fifths of its allocated
        slot-steps advancing sequences that have nothing left to say.
      </p>

      <p style={prose}>
        Continuous batching (also called dynamic or in-flight batching)
        removes the lockstep constraint by scheduling at the level of
        individual generation steps rather than whole requests. At every
        step, the server checks which sequences in the current batch have
        finished — hit an end-of-sequence token or their length limit —
        evicts them, and immediately admits new requests waiting in the queue
        to fill the freed slots; the batch's membership changes continuously
        rather than only at fixed batch boundaries. A request that finishes
        early frees its slot to a new request within a single step instead of
        within a whole generation's worth of steps, so utilization approaches
        the ceiling above as long as the queue has enough waiting requests to
        backfill freed slots — exactly how close depends on arrival timing,
        which the simulator below actually computes rather than assumes.
      </p>

      <p style={prose}>
        Continuous batching still needs somewhere to put each request's
        growing KV cache, and the naive answer — pre-allocate one big
        contiguous buffer per request, sized for the maximum possible
        generation length — wastes most of that memory on sequences that
        finish long before they hit the limit, and fragments what's left over
        time as requests of different lengths come and go. Kwon et al. (2023)
        [2] introduced PagedAttention to fix this with the same idea operating
        systems use for virtual memory: split the KV cache into small
        fixed-size pages, allocate pages to a request on demand as it
        generates new tokens instead of reserving a worst-case block up
        front, and keep a lightweight page table mapping each sequence's
        logical positions to the physical pages holding them. Because pages
        are cheap to allocate and free, a server can pack far more concurrent
        requests into the same GPU memory, and pages can even be shared
        between requests — an identical system-prompt prefix across many
        concurrent requests only has to be stored once. vLLM, the serving
        system built around PagedAttention, reported multi-fold throughput
        improvements over naive contiguous-buffer serving purely from this
        memory-management change, with no change to the model itself.
      </p>

      <p style={prose}>
        The simulator below runs a real, simplified discrete-event simulation
        of both batching policies against the same randomly generated stream
        of incoming requests — same arrival times, same prompt and generation
        lengths under either policy — so any utilization gap traces to the
        batching policy itself, not to different traffic. It isolates the
        scheduling half of the memory story; PagedAttention's page-level
        allocation underneath either policy is a separate mechanism the
        simulator doesn't model, so treat vLLM's reported throughput multiple
        above as the cited paper's own result rather than something
        reproduced here. Step or play through the timeline and watch the
        Gantt view and the utilization-over-time chart for both policies,
        then generate a new random request stream and check that the same
        gap reappears.
      </p>

      <ServingSimulator
        tryThis={{
          do: "Play or step through the same request stream in static slot-detail view, then switch to continuous, then click 'New scenario' a couple of times.",
          notice: "the continuous-batching curve on the utilization chart stays high through the gaps where the static curve drops toward zero waiting for the batch's slowest member — the static view's Gantt chart shows this directly as red padding cells where a finished request's slot sits idle-but-held — and the utilization gap in the stat strip stays positive across freshly generated scenarios, not just this one seed.",
        }}
      />

      <p style={prose}>
        One further lever compounds with both batching strategies: storing the
        cache itself at lower precision — FP8 or INT8 instead of FP16 —
        roughly halves its memory footprint again, letting either policy fit
        more concurrent sequences in the same GPU memory. That's the same
        quantization idea the next section applies to the model's weights,
        not just its cache.
      </p>

      {/* ── Section 3: Quantization ───────────────────────────────────────── */}
      <div id="quantization">
        <SectionTitle>Quantization</SectionTitle>
      </div>

      <p style={prose}>
        A model's weights are normally stored as 16-bit floating-point numbers
        (FP16 or BF16) — roughly 2 bytes per parameter, so a 70-billion-parameter
        model needs about 140 GB just to hold its weights, before any KV cache
        or activation memory. Quantization — representing those same weight
        values with fewer bits, typically by mapping the original range onto a
        small, evenly spaced grid of discrete levels — cuts that footprint
        directly: INT8 quantization roughly halves it, INT4 roughly quarters
        it. The premise is that weight matrices are highly redundant; a matrix
        of billions of nearly-continuous values doesn't need a full 16 bits of
        resolution per entry to preserve the function it computes, so most of
        the memory savings comes at a quality cost far smaller than the bit
        reduction alone would suggest. INT8 and INT4 use an evenly spaced
        integer grid, exactly as the formula below defines; production stacks
        on newer hardware also quantize weights to FP8, a floating-point
        format whose exponent lets grid spacing vary with magnitude instead
        of staying fixed, trading a little precision for more native dynamic
        range at a similar bit width. The rest of this section works through
        the integer case, but the outlier problem and the per-channel fix
        below apply to either format.
      </p>

      <MathBlock>{"$$q = \\text{round}\\!\\left(\\frac{x}{s}\\right), \\qquad \\hat{x} = q \\cdot s, \\qquad s = \\frac{\\max|x|}{2^{b-1}-1}$$"}</MathBlock>

      <p style={prose}>
        <InlineMath>{"x"}</InlineMath> is an original weight value,{" "}
        <InlineMath>{"s"}</InlineMath> the scale that maps the tensor's range
        onto the <InlineMath>{"b"}</InlineMath>-bit integer grid,{" "}
        <InlineMath>{"q"}</InlineMath> the resulting integer code actually
        stored, and <InlineMath>{"\\hat{x}"}</InlineMath> the dequantized
        value recovered at inference time — the gap between{" "}
        <InlineMath>{"x"}</InlineMath> and <InlineMath>{"\\hat{x}"}</InlineMath>{" "}
        is the quantization error.
      </p>

      <p style={prose}>
        That premise breaks down for a small number of dimensions. Dettmers et
        al. (2022) [3] found that across nearly every layer of a trained LLM,
        a handful of <em>activation</em> channels — sometimes fewer than 1% of
        the total — carry values 10 to 100 times larger than the rest,
        consistently, across almost every input the model sees. Those
        activation outliers need a different fix than weight quantization
        entirely: LLM.int8() isolates them into a separate 16-bit matrix
        multiplication rather than forcing them onto the same low-bit grid as
        everything else, since more than 99.9% of the remaining values still
        quantize cleanly. Weight matrices have a milder version of the same
        unevenness, without true outliers: individual output channels — a row
        or column of the matrix — can simply have a larger typical magnitude
        than their neighbors. A single scale <InlineMath>{"s"}</InlineMath>{" "}
        computed from the whole tensor's maximum absolute value, as in the
        formula above, has to stretch to cover whichever channel has the
        widest range, which pushes every other channel's grid spacing wider
        than it needs — the resolution that should have gone to representing
        that channel's own normal variation gets spent covering a range it
        never uses.
      </p>

      <p style={prose}>
        The direct fix is to stop using one scale for an entire weight matrix.
        Per-channel quantization computes a separate scale for each output
        channel (row or column of the matrix) instead of one global scale for
        the whole tensor, so a channel with an outlier gets its own wide grid
        while every other channel keeps a tight one sized to its own actual
        range. Per-group quantization goes further, computing a separate
        scale for every small group of consecutive weights (64 or 128 at a
        time) within a channel, trading a little extra bookkeeping for
        resolution that tracks local variation even more closely. Both are
        strictly more expensive than a single global scale — more scale
        factors to store and apply — but the added cost is a small fraction
        of the savings quantization already bought.
      </p>

      <p style={prose}>
        Frantar et al. (2023) [4] pushed further with GPTQ, which treats
        quantization as an optimization problem rather than independent
        per-weight rounding. GPTQ quantizes one layer at a time — and within a
        layer, one column at a time — and after rounding each weight to its
        grid it uses the layer's Hessian (the matrix of second derivatives
        that captures how sensitive the layer's output is to each weight) to
        compute how much error that rounding just introduced and nudge every
        not-yet-quantized weight in the same layer to compensate, so the
        layer's overall output stays close to what the unquantized layer would
        have produced instead of just minimizing each weight's individual
        rounding error. The result is accurate 4-bit (and usable 3-bit)
        quantization of models up to hundreds of billions of parameters — the
        original paper quantized OPT-175B and BLOOM-176B in about four
        GPU-hours on a single A100.
      </p>

      <p style={prose}>
        Lin et al. (2024) [5] took a different angle with AWQ, observing that
        GPTQ's expensive per-layer reconstruction isn't actually necessary if
        the right weights are protected in the first place. AWQ identifies
        the small fraction of weight channels that matter most — not by
        looking at weight magnitude, but by looking at which channels see the
        largest activation magnitudes during a short calibration pass, since a
        channel multiplied by large activations contributes disproportionately
        to the layer's output regardless of how large the weight itself is. It
        then scales those salient channels up before quantizing (and scales
        the corresponding activations down to compensate, leaving the matrix
        product unchanged), so the protected channels land on a finer part of
        the quantization grid without needing any weight updates or
        backpropagation at all. AWQ is cheaper to run than GPTQ and, because it
        never touches the weights beyond a per-channel rescaling, tends to
        generalize better to inputs unlike its calibration set.
      </p>

      <p style={prose}>
        The widget below quantizes an illustrative weight distribution — a
        synthetic histogram shaped like real LLM weights (roughly Gaussian,
        with a thin outlier tail), not weights pulled from an actual model —
        at whichever bit-width is selected, using the real round-and-rescale
        math above, and reports the actual mean-squared reconstruction error
        between the original and dequantized values. Drop the bit-width from 8
        down to 2 and watch the error climb, then turn on per-channel handling
        and notice how much of that error the outlier tail alone was
        responsible for.
      </p>

      <QuantizationExplorer
        tryThis={{
          do: "Set bit-width to 4, note the reconstruction error, then toggle per-channel/outlier-aware handling on and off at the same bit-width, then repeat the comparison at 3 bits and again at 2 bits.",
          notice: "the reconstruction error drops noticeably with per-channel handling switched on — the same bit-width buys much more fidelity once outlier channels stop dragging down every other channel's resolution — but the gap is largest around 3-4 bits and narrows again at 2 bits, where both schemes are simply out of usable levels to represent anything precisely.",
        }}
      />

      {/* ── Section 4: Speculative Decoding ───────────────────────────────── */}
      <div id="speculative-decoding">
        <SectionTitle>Speculative Decoding</SectionTitle>
      </div>

      <p style={prose}>
        Section 2 established that decode is memory-bandwidth-bound:
        generating one token means streaming the entire model's weights (and
        the growing KV cache) out of HBM (high-bandwidth memory), and the
        matrix multiplications themselves are cheap by comparison. A useful
        consequence follows directly: scoring several candidate tokens at once
        costs barely more than scoring one, because the expensive part —
        moving the weights — happens exactly once either way, the same reason
        prefill can process an entire prompt in one pass. Autoregressive
        decoding never exploits this, since it only ever asks the model to
        score one token per forward pass. Speculative decoding exploits it
        directly.
      </p>

      <p style={prose}>
        The recipe, proposed independently by Leviathan et al. (2023) [6] and
        Chen et al. (2023) [7] within months of each other, uses two models: a
        small, fast draft model that proposes several tokens in a row,
        generated autoregressively exactly like normal decoding, and the
        original, larger target model whose output quality is the one
        actually being served. Once the draft model has proposed{" "}
        <InlineMath>{"k"}</InlineMath> tokens, the target model scores all{" "}
        <InlineMath>{"k"}</InlineMath> proposed positions plus the next one in
        a single forward pass — the same parallel-scoring trick that makes
        prefill cheap per token, applied here to a short speculative
        continuation instead of a known prompt. That one parallel pass
        yields, for every drafted position, the target model's own
        probability for the token the draft model guessed.
      </p>

      <p style={prose}>
        Those target probabilities drive an accept/reject rule built on
        rejection sampling — a way of drawing exact samples from a target
        distribution using proposals from a cheaper one. At each drafted
        position, accept the draft's token with probability equal to the ratio
        of the target's probability to the draft's probability for that same
        token (capped at 1); if the draft assigned the token more probability
        than the target actually would have, sometimes reject it and resample
        instead, from a corrected residual distribution that removes exactly
        the excess mass the draft over-assigned. The first rejection in a
        round stops the round — everything the draft proposed after that
        point is discarded, since it was generated conditioned on a token the
        target didn't actually accept — but every accepted token before it is
        a free token, produced without an extra full target forward pass.
      </p>

      <MathBlock>{"$$P(\\text{accept } x) = \\min\\!\\left(1, \\frac{p_{\\text{target}}(x)}{p_{\\text{draft}}(x)}\\right), \\qquad \\text{on reject: resample from}\\ \\max(0,\\ p_{\\text{target}} - p_{\\text{draft}})\\ \\text{(renormalized)}$$"}</MathBlock>

      <p style={prose}>
        <InlineMath>{"p_{\\text{target}}"}</InlineMath> and{" "}
        <InlineMath>{"p_{\\text{draft}}"}</InlineMath> are the two models'
        probabilities for the same drafted token <InlineMath>{"x"}</InlineMath>{" "}
        at a given position; this rule is what guarantees the accepted output
        is distributed exactly as if the target model had generated every
        token on its own, with no quality loss from drafting.
      </p>

      <p style={prose}>
        The speedup follows directly from how many tokens survive per round.
        If every drafted token is accepted independently with probability{" "}
        <InlineMath>{"\\alpha"}</InlineMath> (an idealized simplification —
        real acceptance correlates position to position, but the intuition
        holds), the expected number of tokens produced by one round of{" "}
        <InlineMath>{"k"}</InlineMath> drafts plus one verification pass is a
        geometric-style sum: each additional token requires every token
        before it to have already been accepted.
      </p>

      <MathBlock>{"$$\\mathbb{E}[\\text{tokens per round}] = \\sum_{i=0}^{k} \\alpha^{i} = \\frac{1 - \\alpha^{k+1}}{1 - \\alpha}$$"}</MathBlock>

      <p style={prose}>
        <InlineMath>{"\\alpha"}</InlineMath> is the per-token acceptance
        probability, <InlineMath>{"k"}</InlineMath> the number of drafted
        tokens per round, and the sum counts the guaranteed target-generated
        token that closes out every round (<InlineMath>{"i=0"}</InlineMath>)
        plus however many of the <InlineMath>{"k"}</InlineMath> drafts
        survive.
      </p>

      <p style={prose}>
        At <InlineMath>{"\\alpha = 0.8"}</InlineMath> and{" "}
        <InlineMath>{"k = 5"}</InlineMath>, that expectation is{" "}
        <InlineMath>{"(1 - 0.8^{6})/(1 - 0.8) \\approx 3.7"}</InlineMath>{" "}
        tokens per round — nearly four tokens for the cost of one target
        forward pass plus the much cheaper draft generations, close to a 4×
        speedup on the decode phase before accounting for the draft model's
        own runtime. But the expression also explains why drafting more
        tokens per round has diminishing, then negative, returns: at low
        acceptance rates a long draft chain almost always gets cut short
        early, so the extra drafted tokens beyond the first rejection are
        wasted compute, and the optimal <InlineMath>{"k"}</InlineMath> grows
        only slowly as <InlineMath>{"\\alpha"}</InlineMath> improves. The
        technique costs nothing in output quality by construction — the
        accept/reject rule above guarantees the same distribution as ordinary
        decoding from the target model alone — the only thing purchased is
        wall-clock speed, and only when the draft model is cheap enough and
        aligned enough with the target to keep <InlineMath>{"\\alpha"}</InlineMath>{" "}
        reasonably high.
      </p>

      <p style={prose}>
        The widget below runs many simulated rounds of draft-then-verify using
        a seeded random number generator for each token's accept/reject
        outcome at a chosen acceptance rate, so the tokens/sec counter it
        reports is accumulated from actual simulated outcomes, not the
        closed-form expectation above stated as fact. Set the acceptance rate
        and draft length, run a batch of rounds, and compare the resulting
        throughput against a non-speculative baseline running the same number
        of simulated target forward passes.
      </p>

      <SpeculativeRace
        tryThis={{
          do: "Set the acceptance rate to around 0.5, run a batch of rounds, then raise it to 0.9 and run another batch at the same draft length k.",
          notice: "the accept/reject animation keeps far more of each round's drafted tokens once acceptance rises, and the simulated tokens/sec counter tracks that change directly — it's built from the accumulated accept/reject outcomes across the whole run, not asserted from the formula above.",
        }}
      />

      {/* ── Section 5: LoRA, QLoRA & Retrieval ───────────────────────────── */}
      <div id="lora-and-peft">
        <SectionTitle>Adapting Cheaply: LoRA, QLoRA & Retrieval</SectionTitle>
      </div>

      {/* MOVED-FROM ch05 (Training Techniques), Section 5 "LoRA & Parameter-
          Efficient Fine-Tuning" — belongs with deployment/adaptation, not
          general training technique, now that this chapter exists. */}
      <p style={prose}>
        Fine-tuning all parameters of a large pretrained model is expensive
        and often unnecessary. LoRA and QLoRA, covered below, adapt a model
        by training a small low-rank update instead of touching the frozen
        original weights at all.
      </p>

      <MathBlock>{"$$h = W_0 x + \\Delta W x = W_0 x + BAx \\quad\\text{where}\\quad B \\in \\mathbb{R}^{d \\times r},\\ A \\in \\mathbb{R}^{r \\times k},\\ r \\ll \\min(d, k)$$"}</MathBlock>

      <p style={prose}>
        <InlineMath>{"B"}</InlineMath> and <InlineMath>{"A"}</InlineMath> are
        the low-rank factors being learned, with rank{" "}
        <InlineMath>{"r"}</InlineMath> far smaller than either matrix
        dimension <InlineMath>{"d"}</InlineMath> or{" "}
        <InlineMath>{"k"}</InlineMath>, applied to the same input{" "}
        <InlineMath>{"x"}</InlineMath> that flows through the frozen{" "}
        <InlineMath>{"W_0"}</InlineMath>.
      </p>

      <LoRAMatrixShapes />

      <p style={prose}>
        Hu et al. (2022) [8] start from an empirical observation: when a
        large pretrained model is fine-tuned, the matrix of weight changes{" "}
        <InlineMath>{"\\Delta W"}</InlineMath> tends to have very
        low intrinsic rank — often a rank of 8 or 16 captures nearly all of the
        update signal. LoRA exploits this directly: freeze the pretrained <InlineMath>{"W_0"}</InlineMath> and
        parameterize the update as <InlineMath>{"\\Delta W = BA"}</InlineMath>, with <InlineMath>{"B \\in \\mathbb{R}^{d \\times r}"}</InlineMath>, <InlineMath>{"A \\in \\mathbb{R}^{r \\times k}"}</InlineMath>, and{" "}
        <InlineMath>{"r \\ll \\min(d, k)"}</InlineMath>. Only <InlineMath>{"B"}</InlineMath> and <InlineMath>{"A"}</InlineMath> are trained. For a 7B-parameter model,
        fine-tuning at rank 8 adds well under 0.1% additional trainable
        parameters — a smaller share than the ~0.4% the diagram above shows
        for one 4096×4096 matrix alone, since a real deployment applies LoRA
        to only a subset of the model's weight matrices (typically the
        attention projections), not to every matrix the model has.
        At inference time, <InlineMath>{"BA"}</InlineMath> can be folded back into <InlineMath>{"W_0 + BA"}</InlineMath> so there is no latency
        cost.
      </p>

      <p style={prose}>
        QLoRA (Dettmers et al. 2023) [9] pushed this further by quantizing the
        frozen <InlineMath>{"W_0"}</InlineMath> to 4 bits — the same round-and-rescale idea this
        chapter's quantization section covers in more depth — while keeping the LoRA
        adapters themselves in higher precision. The frozen weights take a fraction of the
        memory; the trainable adapters fit comfortably alongside. QLoRA made it
        possible to fine-tune a 65B-parameter model on a single 48GB GPU — a
        configuration that would otherwise need a multi-GPU setup. The technique is
        the de facto standard for fine-tuning open-source LLMs today.
      </p>

      <p style={prose}>
        Real LoRA implementations also scale the update by{" "}
        <InlineMath>{"\\alpha/r"}</InlineMath>, a hyperparameter from Hu et
        al.'s original recipe: <InlineMath>{"h = W_0 x + \\tfrac{\\alpha}{r}BAx"}</InlineMath>,
        with <InlineMath>{"\\alpha"}</InlineMath> held fixed so the effective
        scale shrinks as rank grows — otherwise swapping in a higher-rank
        adapter would silently change the size of the update as well as its
        capacity. The visualization below builds{" "}
        <InlineMath>{"W_{\\text{eff}} = W_0 + \\tfrac{\\alpha}{r}BA"}</InlineMath>{" "}
        live from actual matrix values — a fixed random 8×8 stand-in for{" "}
        <InlineMath>{"W_0"}</InlineMath>, and <InlineMath>{"B"}</InlineMath>,{" "}
        <InlineMath>{"A"}</InlineMath> recomputed at whatever rank and
        initialization the controls select — so every heatmap cell is a real
        number from that arithmetic, not a placeholder. Click Randomize B,
        then step the rank buttons through 1, 2, 4, and 8.
      </p>

      <LoRADecomposition
        tryThis={{
          do: "Click Randomize B, then step the rank buttons through 1, 2, 4, and 8.",
          notice: "the ΔW heatmap goes from all-zero (B starts at zero, exactly like real LoRA training) to a visibly structured pattern once B is randomized, and the param-reduction stat hits exactly 0% at rank 4 and goes negative by rank 8 — this toy matrix is only 8×8, so at high rank LoRA's B and A matrices cost more parameters than the original W₀ itself. Real weight matrices are thousands of dimensions wide, which is why rank 8 saves over 99% of parameters there instead.",
        }}
      />

      <p style={prose}>
        Rank sets more than just LoRA's parameter count — it sets a hard
        ceiling on how well any low-rank matrix can approximate a fixed target
        matrix at all, a fact that goes well beyond LoRA and applies to any
        weight matrix a serving system might want to compress or approximate.
        Truncating a matrix's singular value decomposition (SVD) — a
        factorization of any matrix into a rotation, a diagonal scaling, and a
        second rotation, with the scaling values (the singular values)
        ordered from largest to smallest — to its <InlineMath>{"r"}</InlineMath>{" "}
        largest singular values produces the best possible rank-
        <InlineMath>{"r"}</InlineMath> approximation to that matrix in
        Frobenius norm (the matrix analogue of Euclidean length: the square
        root of the sum of every entry squared). This is the Eckart–Young
        theorem, and it's the same low-intrinsic-rank intuition LoRA leans on
        for <InlineMath>{"\\Delta W"}</InlineMath> above, just applied to any
        matrix rather than specifically a fine-tuning update.
      </p>

      <MathBlock>{"$$W \\approx U_r \\Sigma_r V_r^\\top, \\qquad \\lVert W - W_r \\rVert_F^2 = \\sum_{i > r} \\sigma_i^2$$"}</MathBlock>

      <p style={prose}>
        <InlineMath>{"U_r"}</InlineMath> and <InlineMath>{"V_r"}</InlineMath>{" "}
        hold the <InlineMath>{"r"}</InlineMath> leading left- and
        right-singular vectors, <InlineMath>{"\\Sigma_r"}</InlineMath> the{" "}
        <InlineMath>{"r"}</InlineMath> largest singular values on its
        diagonal, and the reconstruction error is exactly the sum of the
        squared singular values that got truncated away — the ones the
        rank-<InlineMath>{"r"}</InlineMath> approximation had to leave out.
      </p>

      <p style={prose}>
        The widget below runs a real truncated SVD on a fixed illustrative
        matrix — not <InlineMath>{"W_0"}</InlineMath> from above, but a
        separate small pattern chosen so its singular values decay at
        different rates, disclosed as illustrative rather than a real model's
        weights — and recomputes the reconstruction error directly from the
        formula above every time the rank slider moves. Start at{" "}
        <InlineMath>{"r=1"}</InlineMath> and step the slider up one at a time,
        watching the reconstruction-error readout.
      </p>

      <LoRARankExplorer
        tryThis={{
          do: "Start at r=1 and step the rank slider up one at a time, watching the reconstruction-error readout.",
          notice: "the error only ever decreases, never bounces back up, as r grows — consistent with the Eckart–Young guarantee that a higher rank can only improve the best-possible reconstruction — and most of the error disappears within the first few ranks if the underlying matrix's singular values decay quickly, which is exactly the situation LoRA is betting real ΔW updates are in.",
        }}
      />

      <p style={prose}>
        Retrieval offers a deployment-side alternative to adapting weights at
        all — one that sidesteps rank and reconstruction error entirely.
        LoRA and QLoRA above change what the model itself knows or how it
        behaves, at the cost of a training run. Retrieval-augmented generation
        (RAG; Lewis et al. 2020 [10]) sidesteps that cost entirely: instead of
        updating any weights, a serving system looks up relevant text at
        request time — from a vector database, an index built for fast
        nearest-neighbor search over embedding vectors — and prepends the
        results to the prompt, so the model conditions on fresh or private
        information it was never trained on. Chapter 24 covers RAG's
        mechanics in depth as part of an agent's memory system: chunking
        documents, embedding passages, similarity search, reranking. This
        chapter's angle is narrower and specifically about deployment — RAG
        is a piece of serving infrastructure with its own latency and cost
        budget, sitting in the request path alongside everything else this
        chapter covers.
      </p>

      <p style={prose}>
        Every RAG request pays for an extra round trip before generation even
        starts: embed the query, search the vector index, and fetch the
        matching passages — typically single-digit to a few tens of
        milliseconds for a well-tuned approximate-nearest-neighbor index,
        growing with corpus size and index complexity — and that cost stacks
        in front of the prefill and decode latency the rest of this chapter
        is about. It also taxes the same memory bill Section 2 built:
        retrieved passages are ordinary text prepended to the prompt, so
        retrieving three 200-token passages adds roughly 600 tokens of
        prefill work and 600 more entries for the KV cache to hold through
        that request's entire decode — not a new cost model, just more
        tokens flowing through the one this chapter already derived. It also
        adds an entire piece of infrastructure — the vector database itself —
        that has to be built, kept in sync with the underlying documents, and
        scaled independently of the model-serving fleet. What RAG buys in
        exchange is the thing LoRA and QLoRA cannot: knowledge that updates
        the moment the underlying documents change, with no training run, no
        GPU-hours spent on fine-tuning, and no risk of a fine-tune degrading
        the base model's general capability. The practical choice is rarely
        either-or — production systems commonly combine a fine-tuned or
        LoRA-adapted model, for behavior, format, and style, with retrieval,
        for facts that change faster than any retraining cadence could track.
      </p>

      {/* ── What Carries Forward ─────────────────────────────────────────── */}
      <SectionTitle>What Carries Forward</SectionTitle>

      <p style={prose}>
        What carries forward from this chapter is less any single technique
        than the shape of the trade-off underneath all of them: decoding
        strategy trades determinism for diversity, batching trades scheduling
        complexity for GPU utilization, quantization trades bits for
        reconstruction error, speculative decoding trades draft compute for
        wall-clock latency, and LoRA and RAG both trade a training run for
        something cheaper at the cost of extra inference-time machinery.
        Production serving stacks rarely pick just one of these — a real
        deployment layers continuous batching, a quantized KV cache,
        speculative decoding, and a LoRA-adapted or retrieval-grounded model
        on top of each other, with the KV cache mechanics from Chapter 11
        sitting underneath every one of them as the resource that ultimately
        gets spent. Chapter 15 turns from cost to capability: multimodal
        networks extend the same transformer backbone, the same KV cache, and
        the same decoding strategies built here to inputs and outputs that
        are no longer just text.
      </p>

      {/* ── Citations ─────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}

// ─── Single source of truth for chapter navigation ──────────────────────────
// Consumed by Sidebar (parts + chapter list) and Topbar (breadcrumb + prev/next).
//
// V2 curriculum (25 chapters, 7 parts) — see context/V2_PLAN.md and
// context/CURRICULUM.md.

export const PARTS = [
  {
    label: "Part I — Foundations",
    color: "var(--accent)",
    chapters: [
      { num: "01", title: "Probability & Information for Machine Learning", widgets: 4, live: true, sections: [{ id: "uncertainty-as-distributions", label: "Distributions" }, { id: "fitting-distributions-mle", label: "MLE & MAP" }, { id: "entropy-cross-entropy-kl", label: "Entropy & KL" }, { id: "judging-classifiers", label: "Judging Classifiers" }] },
      { num: "02", title: "Statistical Learning", widgets: 4, live: true, sections: [{ id: "the-learning-problem", label: "The Learning Problem" }, { id: "linear-and-logistic-regression", label: "Linear & Logistic Regression" }, { id: "bias-variance-tradeoff", label: "Bias-Variance Tradeoff" }, { id: "the-classical-toolbox", label: "The Classical Toolbox" }, { id: "regularization", label: "Regularization" }, { id: "decision-boundaries", label: "Decision Boundaries" }] },
      { num: "03", title: "Neural Networks", widgets: 4, live: true, sections: [{ id: "forward-pass", label: "The Forward Pass" }, { id: "backpropagation", label: "Backpropagation" }, { id: "activation-functions", label: "Activation Functions" }, { id: "loss-functions", label: "Loss Functions" }] },
      { num: "04", title: "Optimization", widgets: 5, live: true, sections: [{ id: "gradient-descent", label: "Gradient Descent" }, { id: "momentum-adaptive", label: "Momentum & Adaptive" }, { id: "loss-landscapes", label: "Loss Landscapes" }, { id: "lr-schedules", label: "LR Schedules" }, { id: "adam-internals", label: "Adam Internals" }] },
      { num: "05", title: "Training Techniques", widgets: 6, live: true, sections: [{ id: "normalization", label: "Normalization" }, { id: "dropout-regularization", label: "Dropout" }, { id: "weight-initialization", label: "Initialization" }, { id: "knowledge-distillation", label: "Distillation" }, { id: "gradient-clipping", label: "Gradient Clipping" }] },
      { num: "06", title: "Convolutional Networks", widgets: 7, live: true, sections: [{ id: "the-convolution-operation", label: "The Convolution" }, { id: "receptive-fields", label: "Receptive Fields" }, { id: "architecture-evolution", label: "Architecture Evolution" }, { id: "residual-learning", label: "Residual Learning" }, { id: "depthwise-separable-dilated", label: "Separable & Dilated" }, { id: "capsule-networks-detour", label: "Capsules: A Detour" }] },
    ],
  },
  {
    label: "Part II — Language & Sequence",
    color: "var(--purple)",
    chapters: [
      { num: "07", title: "Word Embeddings & Tokenization", widgets: 6, live: true, sections: [{ id: "from-tokens-to-vectors", label: "Tokens to Vectors" }, { id: "word2vec-skip-gram", label: "Word2Vec" }, { id: "semantic-arithmetic", label: "Semantic Arithmetic" }, { id: "glove-and-fasttext", label: "GloVe & fastText" }, { id: "contextual-embeddings", label: "Contextual Embeddings" }, { id: "tokenization-bpe", label: "Tokenization & BPE" }] },
      { num: "08", title: "Recurrent Networks & LSTMs", widgets: 4, live: true, sections: [{ id: "the-recurrent-architecture", label: "The RNN" }, { id: "vanishing-exploding-gradients", label: "Vanishing Gradients" }, { id: "long-short-term-memory", label: "LSTM" }, { id: "gated-recurrent-unit", label: "GRU" }] },
      { num: "09", title: "Attention", widgets: 4, live: true, sections: [{ id: "the-bottleneck-problem", label: "The Bottleneck" }, { id: "scaled-dot-product-attention", label: "Dot-Product Attention" }, { id: "self-cross-attention-and-masking", label: "Cross-Attention & Masking" }, { id: "multi-head-attention", label: "Multi-Head Attention" }] },
      { num: "10", title: "Transformers", widgets: 4, live: true, sections: [{ id: "transformer-block-anatomy", label: "Block Anatomy" }, { id: "assembling-the-full-model", label: "Full-Model Assembly" }, { id: "positional-encoding", label: "Positional Encoding" }, { id: "the-residual-stream", label: "Residual Stream" }, { id: "scaling-laws", label: "Scaling Laws" }] },
    ],
  },
  {
    label: "Part III — Large Language Models",
    color: "#a78bfa",
    chapters: [
      { num: "11", title: "LLM Architectures", widgets: 5, live: true, sections: [{ id: "three-paradigms", label: "Three Paradigms" }, { id: "kv-cache", label: "KV Cache" }, { id: "attention-variants", label: "Attention Variants" }, { id: "rotary-embeddings", label: "RoPE" }, { id: "mixture-of-experts", label: "Mixture of Experts" }] },
      { num: "12", title: "Reinforcement Learning", widgets: 6, live: true, sections: [{ id: "mdps-and-the-bellman-equation", label: "MDPs & Bellman" }, { id: "q-learning-and-dqn", label: "Q-Learning & DQN" }, { id: "policy-gradients", label: "Policy Gradients" }, { id: "proximal-policy-optimization", label: "PPO" }, { id: "rlhf-and-rlvr", label: "RLHF, RLEF & RLVR" }] },
      { num: "13", title: "LLM Training & Alignment", widgets: 6, live: true, sections: [{ id: "the-training-pipeline", label: "Training Pipeline" }, { id: "instruction-tuning", label: "Instruction Tuning" }, { id: "preference-optimization", label: "Preference Optimization" }, { id: "constitutional-ai", label: "Constitutional AI" }, { id: "tool-calling", label: "Tool Calling" }, { id: "safety-and-refusal", label: "Safety & Refusal" }, { id: "reasoning-and-test-time-compute", label: "Reasoning Models & Test-Time Compute" }] },
      { num: "14", title: "Efficient Inference & Deployment", widgets: 7, live: true, sections: [{ id: "decoding-and-sampling", label: "Decoding & Sampling" }, { id: "kv-cache-and-batching", label: "KV Cache & Batching" }, { id: "quantization", label: "Quantization" }, { id: "speculative-decoding", label: "Speculative Decoding" }, { id: "lora-and-peft", label: "LoRA, QLoRA & Retrieval" }] },
      { num: "15", title: "Multimodal Networks", widgets: 4, live: true, sections: [{ id: "contrastive-learning", label: "Contrastive Learning" }, { id: "embedding-space", label: "Embedding Space" }, { id: "vision-transformers", label: "Vision Transformers" }, { id: "cross-modal-retrieval", label: "Cross-Modal Retrieval" }, { id: "audio-modality", label: "Audio as a Modality" }] },
    ],
  },
  {
    label: "Part IV — Beyond the Transformer",
    color: "var(--green)",
    chapters: [
      { num: "16", title: "Graph Neural Networks", widgets: 4, live: true, sections: [{ id: "graphs-and-message-passing", label: "Message Passing" }, { id: "graph-convolutional-networks", label: "GCN" }, { id: "graph-attention-networks", label: "GAT" }, { id: "tasks-and-applications", label: "Tasks & Applications" }, { id: "graph-vs-grid", label: "Graph vs Grid" }] },
      { num: "17", title: "State-Space Models & Attention Alternatives", widgets: 4, live: true, sections: [{ id: "the-cost-of-attention", label: "The Cost of Attention" }, { id: "state-space-models", label: "S4 to Mamba" }, { id: "rwkv-and-linear-attention", label: "RWKV & Linear Attention" }, { id: "hybrids-in-production", label: "Hybrids in Production" }] },
    ],
  },
  {
    label: "Part V — Generative Models",
    color: "var(--orange)",
    chapters: [
      { num: "18", title: "Variational Autoencoders", widgets: 4, live: true, sections: [{ id: "autoencoders-and-their-limits", label: "Autoencoders" }, { id: "the-variational-lower-bound", label: "The ELBO" }, { id: "the-reparameterization-trick", label: "Reparameterization" }, { id: "latent-space-exploration", label: "Latent Space" }, { id: "beta-vae-disentanglement", label: "beta-VAE" }] },
      { num: "19", title: "GANs & Image-to-Image Translation", widgets: 10, live: true, sections: [{ id: "the-minimax-game", label: "The Minimax Game" }, { id: "training-dynamics", label: "Training Dynamics" }, { id: "mode-collapse", label: "Mode Collapse & WGAN" }, { id: "decision-boundary-evolution", label: "Architecture Lineage & Boundary" }, { id: "latent-space-editing", label: "Latent Space & GAN Inversion" }, { id: "conditional-generation", label: "Conditional Generation" }, { id: "pix2pix", label: "pix2pix: Paired Translation" }, { id: "cyclegan", label: "CycleGAN: Unpaired Translation" }, { id: "spade", label: "SPADE (Brief)" }] },
      { num: "20", title: "Diffusion Models", widgets: 4, live: true, sections: [{ id: "forward-diffusion", label: "Forward Process" }, { id: "reverse-denoising", label: "Reverse Denoising" }, { id: "noise-schedules", label: "Noise Schedules" }, { id: "score-functions", label: "Score Functions" }, { id: "video-and-world-models", label: "Video & World Models" }] },
    ],
  },
  {
    label: "Part VI — Evaluation & Understanding",
    color: "var(--green)",
    chapters: [
      { num: "21", title: "Datasets & Benchmarks", widgets: 3, live: true, sections: [{ id: "the-scale-of-modern-datasets", label: "Dataset Scale" }, { id: "what-a-benchmark-measures", label: "What a Benchmark Measures" }, { id: "benchmarks-drive-progress", label: "Benchmarks" }, { id: "dataset-bias-and-responsibility", label: "Bias & Responsibility" }] },
      { num: "22", title: "Evaluating LLMs & Agents", widgets: 4, live: true, sections: [{ id: "perplexity-vs-task-performance", label: "Perplexity vs Task Perf." }, { id: "pass-at-k", label: "pass@k" }, { id: "llm-as-judge", label: "LLM-as-Judge" }, { id: "contamination-and-hygiene", label: "Contamination" }, { id: "evaluating-agents", label: "Evaluating Agents" }] },
      { num: "23", title: "Interpretability", widgets: 5, live: true, sections: [{ id: "understanding-a-model", label: "What Is Understanding?" }, { id: "features-and-superposition", label: "Features & Superposition" }, { id: "circuits-and-induction", label: "Circuits & Induction Heads" }, { id: "sparse-autoencoders", label: "Sparse Autoencoders" }, { id: "steering-and-limits", label: "Steering & Limits" }] },
    ],
  },
  {
    label: "Part VII — AI Agents",
    color: "#38bdf8",
    chapters: [
      { num: "24", title: "AI Agents", widgets: 5, live: true, sections: [{ id: "react-reasoning-and-acting", label: "ReAct" }, { id: "tool-use-and-function-calling", label: "Tool Use" }, { id: "memory-architecture", label: "Memory" }, { id: "multi-agent-systems", label: "Multi-Agent" }, { id: "failure-modes-and-reliability", label: "Failure Modes" }] },
      { num: "25", title: "Agent Harnesses", widgets: 6, live: true, sections: [{ id: "taxonomy", label: "Harness Design Space" }, { id: "cli-coding-agents", label: "CLI Coding Agents" }, { id: "composition-libraries", label: "Composition Libraries" }, { id: "state-machines", label: "State Machines" }, { id: "multi-agent-frameworks", label: "Multi-Agent Frameworks" }] },
    ],
  },
];

// Part label with the "Part N — " prefix stripped, e.g. "Sequence & Attention".
function shortPartLabel(label) {
  return label.replace(/^Part [IVX]+ — /, "");
}

export function chapterPath(num) {
  return `/ch/${num}`;
}

// Flattened, ordered list of every LIVE chapter with its route path and part
// metadata — the shape Topbar's prev/next and breadcrumb logic needs. Not-yet-
// built chapters (live: false) are excluded here since they have no route.
export const CHAPTERS = PARTS.flatMap(part =>
  part.chapters
    .filter(ch => ch.live)
    .map(ch => ({
      ...ch,
      path: chapterPath(ch.num),
      part: shortPartLabel(part.label),
      partLabel: part.label,
      partColor: part.color,
    }))
);

export function findChapterByPath(pathname) {
  return CHAPTERS.find(c => pathname === c.path || pathname.startsWith(c.path + "/"));
}

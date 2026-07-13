# Curriculum (V2 target — 25 chapters, 7 parts)

This is the authoritative chapter list. The migration from the prior 22-chapter structure is in progress via `prompts/queue.md` (items S1/S2, then N1/N14/N17/N22/N23 for the new chapters, then C-items for content passes on every chapter). Until `src/data/chapters.js` exists (queue item E1) and the renumbering migration lands (queue item S1), the live site still uses the old 22-chapter numbering — see git history / `context/V2_PLAN.md` for the old→new mapping.

## Part I — Foundations
- Ch01: Probability & Information for Machine Learning — **new**
- Ch02: Statistical Learning
- Ch03: Neural Networks
- Ch04: Optimization
- Ch05: Training Techniques
- Ch06: Convolutional Networks (incl. a historical sidebar on Capsule Networks)

## Part II — Language & Sequence
- Ch07: Word Embeddings & Tokenization
- Ch08: Recurrent Networks & LSTMs
- Ch09: Attention
- Ch10: Transformers

## Part III — Large Language Models
- Ch11: LLM Architectures
- Ch12: Reinforcement Learning
- Ch13: LLM Training & Alignment
- Ch14: Efficient Inference & Deployment — **new**
- Ch15: Multimodal Networks

## Part IV — Beyond the Transformer
- Ch16: Graph Neural Networks
- Ch17: State-Space Models & Attention Alternatives — **new** (replaces the standalone Capsule Networks chapter)

## Part V — Generative Models
- Ch18: Variational Autoencoders
- Ch19: GANs & Image-to-Image Translation (merged)
- Ch20: Diffusion Models

## Part VI — Evaluation & Understanding
- Ch21: Datasets & Benchmarks
- Ch22: Evaluating LLMs & Agents — **new**
- Ch23: Interpretability — **new**

## Part VII — AI Agents
- Ch24: AI Agents
- Ch25: Agent Harnesses

---

Full rationale (why each move/merge/new-chapter decision was made, and the per-chapter findings driving the content rewrite) lives in [`V2_PLAN.md`](V2_PLAN.md).

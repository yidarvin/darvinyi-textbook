# darvinyi-textbook — Full Curriculum

## Structure: 6 Parts, 17 Chapters, ~75 Widgets, 90+ Citations

---

## Part I — Foundations

### Chapter 1 — Statistical Learning
**Sections:** Learning problem, ERM, bias-variance tradeoff, overfitting, L1/L2 regularization, cross-validation, no free lunch theorem, VC dimension
**Widgets:** Polynomial Fit (W1.1), Bias-Variance Decomposition (W1.2), Regularization Explorer (W1.3), Decision Boundary (W1.4)
**Status:** v1 — build first
**Key citations:**
- [1] Hastie, Tibshirani, Friedman — Elements of Statistical Learning, Springer 2001 [SEMINAL]
- [2] Geman, Bienenstock, Doursat — Bias-Variance Tradeoff, Neural Computation 1992 [SEMINAL]
- [3] Wolpert & Macready — No Free Lunch Theorems, IEEE Trans. Evolutionary Computation 1997 [SEMINAL]
- [4] Blumer et al. — Learnability and VC Dimension, Journal of the ACM 1989 [PAPER]

### Chapter 2 — Neural Networks
**Sections:** Perceptron, multilayer networks, forward pass, universal approximation, backpropagation, activations (sigmoid/tanh/ReLU/GELU/Swish/Mish), loss functions, depth vs width
**Widgets:** Universal Approximation (W2.1), Computation Graph (W2.2), Activation Zoo (W2.3), Loss Function Comparison (W2.4)
**Status:** v1 — build second
**Key citations:**
- [1] Rumelhart, Hinton, Williams — Backpropagation, Nature 1986 [SEMINAL]
- [2] Cybenko — Universal Approximation, Mathematics of Control 1989 [SEMINAL]
- [3] Goodfellow, Bengio, Courville — Deep Learning, MIT Press 2016 [SURVEY]
- [4] Hendrycks & Gimpel — GELUs, arXiv 2016 [PAPER]
- [5] Ramachandran, Zoph, Le — Swish, arXiv 2017 [PAPER]
- [6] Lin et al. — Focal Loss, ICCV 2017 [PAPER]

### Chapter 3 — Optimization
**Sections:** Gradient descent (batch/SGD/mini-batch), momentum, Nesterov, AdaGrad, RMSProp, Adam, AdamW, LR schedules (step/cosine/warmup/OneCycleLR), loss landscapes, second-order methods
**Widgets:** Gradient Descent Navigator (W3.1) [BUILT], Optimizer Race (W3.2), LR Finder (W3.3), LR Schedule Visualizer (W3.4), Adam Internals (W3.5)
**Status:** v1 — build third
**Key citations:**
- [1] Kingma & Ba — Adam, ICLR 2015 [SEMINAL]
- [2] Loshchilov & Hutter — AdamW, ICLR 2019 [PAPER]
- [3] Sutskever et al. — Momentum in Deep Learning, ICML 2013 [SEMINAL]
- [4] Li et al. — Visualizing Loss Landscapes, NeurIPS 2018 [PAPER]
- [5] Loshchilov & Hutter — SGDR, ICLR 2017 [PAPER]
- [6] Duchi, Hazan, Singer — AdaGrad, JMLR 2011 [SEMINAL]

### Chapter 4 — Training Techniques
**Sections:** BatchNorm, LayerNorm, GroupNorm, InstanceNorm, Dropout, DropConnect, Xavier/He/Orthogonal init, gradient clipping, data augmentation (MixUp, CutMix), transfer learning, knowledge distillation, LoRA, QLoRA, prefix tuning, mixed precision (FP16/BF16/FP8), gradient accumulation
**Widgets:** Normalization Comparison (W4.1), Dropout Visualizer (W4.2), Initialization Explorer (W4.3), Knowledge Distillation (W4.4), LoRA Decomposition (W4.5), Gradient Clipping (W4.6)
**Key citations:**
- [1] Ioffe & Szegedy — Batch Normalization, ICML 2015 [SEMINAL]
- [2] Ba, Kiros, Hinton — Layer Normalization, arXiv 2016 [PAPER]
- [3] Srivastava et al. — Dropout, JMLR 2014 [SEMINAL]
- [4] Glorot & Bengio — Xavier Init, AISTATS 2010 [SEMINAL]
- [5] He et al. — He Init, ICCV 2015 [PAPER]
- [6] Hinton, Vinyals, Dean — Knowledge Distillation, NeurIPS Workshop 2015 [SEMINAL]
- [7] Hu et al. — LoRA, ICLR 2022 [SEMINAL]
- [8] Dettmers et al. — QLoRA, NeurIPS 2023 [PAPER]
- [9] Zhang et al. — MixUp, ICLR 2018 [PAPER]

---

## Part II — Architectures

### Chapter 5 — Convolutional Networks
**Sections:** Convolution operation (discrete/strided/dilated), filters/stride/padding, pooling, receptive fields, LeNet→AlexNet→VGG→Inception→ResNet→EfficientNet, skip connections, depthwise separable convolutions
**Widgets:** Convolution Explorer (W5.1), Receptive Field Visualizer (W5.2), Architecture Timeline (W5.3), Skip Connection Demo (W5.4), Dilated Convolution (W5.5)
**Key citations:**
- [1] LeCun et al. — LeNet, Proceedings of IEEE 1998 [SEMINAL]
- [2] Krizhevsky, Sutskever, Hinton — AlexNet, NeurIPS 2012 [SEMINAL]
- [3] He et al. — ResNet, CVPR 2016 [SEMINAL]
- [4] Simonyan & Zisserman — VGG, ICLR 2015 [PAPER]
- [5] Tan & Le — EfficientNet, ICML 2019 [PAPER]

### Chapter 6 — Recurrent Networks & LSTMs
**Sections:** Sequences and memory, vanilla RNN, BPTT, vanishing/exploding gradients, LSTM (cell state, gates), GRU, Seq2Seq
**Widgets:** RNN Unrolled (W6.1), Vanishing Gradient Demo (W6.2), LSTM Gate Inspector (W6.3), GRU vs LSTM (W6.4)
**Key citations:**
- [1] Hochreiter & Schmidhuber — LSTM, Neural Computation 1997 [SEMINAL]
- [2] Bengio, Simard, Frasconi — Vanishing Gradients, IEEE Trans. Neural Networks 1994 [SEMINAL]
- [3] Chung et al. — GRU, NeurIPS Workshop 2014 [PAPER]
- [4] Sutskever, Vinyals, Le — Seq2Seq, NeurIPS 2014 [SEMINAL]

### Chapter 7 — Attention
**Sections:** Seq2Seq bottleneck, Bahdanau attention, scaled dot-product attention, QKV, multi-head attention, self vs cross attention, softmax temperature, Flash Attention
**Widgets:** Attention Heatmap (W7.1), QKV Inspector (W7.2), Multi-Head Attention (W7.3), Softmax Temperature (W7.4)
**Key citations:**
- [1] Bahdanau, Cho, Bengio — Bahdanau Attention, ICLR 2015 [SEMINAL]
- [2] Vaswani et al. — Attention Is All You Need, NeurIPS 2017 [SEMINAL]
- [3] Dao et al. — FlashAttention, NeurIPS 2022 [PAPER]

### Chapter 8 — Transformers
**Sections:** Block anatomy, positional encoding (sinusoidal/learned/RoPE/ALiBi), encoder vs decoder, Pre-LN vs Post-LN, residual streams, gated MLPs, scaling laws, BERT→GPT→T5→Llama
**Widgets:** Transformer Block Walkthrough (W8.1), Positional Encoding (W8.2), Residual Stream (W8.3), Scaling Laws Explorer (W8.4)
**Key citations:**
- [1] Vaswani et al. — Attention Is All You Need, NeurIPS 2017 [SEMINAL]
- [2] Devlin et al. — BERT, NAACL 2019 [SEMINAL]
- [3] Brown et al. — GPT-3, NeurIPS 2020 [SEMINAL]
- [4] Hoffmann et al. — Chinchilla, NeurIPS 2022 [PAPER]
- [5] Su et al. — RoPE, arXiv 2021 [PAPER]

### Chapter 9 — Multimodal Networks
**Sections:** Multimodal learning, contrastive learning (CLIP/SimCLR), vision-language models, image generation from text, ViT, multimodal LLMs (Flamingo/LLaVA), audio (Whisper), embedding spaces
**Widgets:** Contrastive Learning (W9.1), Embedding Space Explorer (W9.2), ViT Patches (W9.3), Cross-Modal Retrieval (W9.4)
**Key citations:**
- [1] Radford et al. — CLIP, ICML 2021 [SEMINAL]
- [2] Dosovitskiy et al. — ViT, ICLR 2021 [SEMINAL]
- [3] Alayrac et al. — Flamingo, NeurIPS 2022 [PAPER]
- [4] Radford et al. — Whisper, ICML 2023 [PAPER]
- [5] Chen et al. — SimCLR, ICML 2020 [PAPER]

### Chapter 10 — Capsule Networks
**Sections:** CNN pooling problem, capsule as pose-preserving entity, dynamic routing, squash function, CapsNet, EM routing, limitations
**Widgets:** Capsule as Vector (W10.1), Dynamic Routing Visualizer (W10.2), CNN vs CapsNet (W10.3)
**Key citations:**
- [1] Sabour, Frosst, Hinton — Dynamic Routing, NeurIPS 2017 [SEMINAL]
- [2] Hinton, Sabour, Frosst — EM Routing, ICLR 2018 [PAPER]
- [3] Hinton, Krizhevsky, Wang — Transforming Auto-encoders, ICANN 2011 [PAPER]

---

## Part III — Generative Models

### Chapter 11 — Variational Autoencoders
**Sections:** Autoencoders recap, latent space intuition, ELBO, reparameterization trick, KL divergence/posterior collapse, β-VAE/disentanglement
**Widgets:** Autoencoder vs VAE (W11.1), Latent Space Explorer (W11.2), KL Divergence (W11.3), ELBO Decomposition (W11.4)
**Key citations:**
- [1] Kingma & Welling — VAE, ICLR 2014 [SEMINAL]
- [2] Rezende, Mohamed, Wierstra — SGVB, ICML 2014 [PAPER]
- [3] Higgins et al. — β-VAE, ICLR 2017 [PAPER]

### Chapter 12 — Generative Adversarial Networks
**Sections:** Minimax game, generator/discriminator, training dynamics, mode collapse, WGAN/gradient penalty, progressive growing, StyleGAN, conditional GANs
**Widgets:** Minimax Game (W12.1), Training Dynamics (W12.2), Mode Collapse Demo (W12.3), Decision Boundary Evolution (W12.4)
**Key citations:**
- [1] Goodfellow et al. — GANs, NeurIPS 2014 [SEMINAL]
- [2] Arjovsky, Chintala, Bottou — WGAN, ICML 2017 [SEMINAL]
- [3] Karras et al. — StyleGAN, CVPR 2019 [PAPER]
- [4] Karras et al. — Progressive Growing, ICLR 2018 [PAPER]

### Chapter 13 — Diffusion Models
**Sections:** Forward diffusion, reverse denoising, noise schedules (linear/cosine), score matching, DDPM, DDIM, classifier-free guidance, latent diffusion
**Widgets:** Forward Diffusion (W13.1), Reverse Denoising (W13.2), Noise Schedule (W13.3), Score Function Field (W13.4)
**Key citations:**
- [1] Ho, Jain, Abbeel — DDPM, NeurIPS 2020 [SEMINAL]
- [2] Song, Meng, Ermon — DDIM, ICLR 2021 [PAPER]
- [3] Song et al. — Score-Based SDE, ICLR 2021 [PAPER]
- [4] Rombach et al. — Latent Diffusion, CVPR 2022 [PAPER]
- [5] Ho & Salimans — Classifier-Free Guidance, NeurIPS Workshop 2021 [PAPER]

---

## Part IV — Advanced Topics

### Chapter 14 — Graph Neural Networks
**Sections:** Graph representation, message passing, GCN, GraphSAGE, GAT, graph pooling, applications
**Widgets:** Message Passing Visualizer (W14.1), Graph Attention Weights (W14.2), Node Classification (W14.3), Graph vs Grid (W14.4)
**Key citations:**
- [1] Kipf & Welling — GCN, ICLR 2017 [SEMINAL]
- [2] Veličković et al. — GAT, ICLR 2018 [PAPER]
- [3] Hamilton, Ying, Leskovec — GraphSAGE, NeurIPS 2017 [PAPER]
- [4] Gilmer et al. — MPNN for Chemistry, ICML 2017 [PAPER]

### Chapter 15 — Datasets & Benchmarks
**Sections:** Why datasets define the field; vision (MNIST/CIFAR/ImageNet/COCO/LAION); language (Wikipedia/BookCorpus/Common Crawl/The Pile/C4); multimodal (COCO Captions/Conceptual Captions/LAION-5B); RL (Atari/MuJoCo/Gym); evaluation benchmarks (GLUE/SuperGLUE/MMLU/HumanEval/BIG-Bench); dataset bias; synthetic data
**Widgets:** Dataset Scale Timeline (W15.1), Benchmark Leaderboard Explorer (W15.2), Dataset Bias Explorer (W15.3)
**Key citations:**
- [1] Russakovsky et al. — ImageNet Challenge, IJCV 2015 [SEMINAL]
- [2] Lin et al. — COCO, ECCV 2014 [SEMINAL]
- [3] Wang et al. — GLUE, ICLR 2019 [PAPER]
- [4] Hendrycks et al. — MMLU, ICLR 2021 [PAPER]
- [5] Schuhmann et al. — LAION-5B, NeurIPS 2022 [PAPER]
- [6] Gao et al. — The Pile, arXiv 2020 [PAPER]

---

## Part V — Reinforcement Learning

### Chapter 16 — Reinforcement Learning
**Sections:** MDP, Bellman equation, Q-learning/SARSA, DQN (experience replay, target networks), policy gradients (REINFORCE), actor-critic (A2C/A3C), PPO, model-based RL/world models, RLHF (reward modeling, PPO fine-tuning), RLEF (code execution reward), RLVR (verifiable rewards), GRPO, DPO
**Widgets:** MDP Explorer (W16.1), Q-Learning in Action (W16.2), Policy Gradient Visualizer (W16.3), PPO Clipping (W16.4), RLHF Pipeline (W16.5), RLVR vs RLHF (W16.6)
**Key citations:**
- [1] Sutton & Barto — RL: An Introduction, MIT Press 1998 [SEMINAL]
- [2] Mnih et al. — DQN, Nature 2015 [SEMINAL]
- [3] Schulman et al. — PPO, arXiv 2017 [SEMINAL]
- [4] Ouyang et al. — InstructGPT/RLHF, NeurIPS 2022 [SEMINAL]
- [5] Rafailov et al. — DPO, NeurIPS 2023 [SEMINAL]
- [6] DeepSeek AI — DeepSeek-R1/GRPO/RLVR, arXiv 2025 [PAPER]
- [7] Mnih et al. — A3C, ICML 2016 [PAPER]
- [8] Ha & Schmidhuber — World Models, NeurIPS 2018 [PAPER]

---

## Part VI — AI Agents

### Chapter 17 — AI Agents
**Sections:** What is an AI agent (perception/planning/action/memory), LLMs as agent core, ReAct (thought-action-observation loops), tool use/function calling, memory types (in-context/vector store/episodic/semantic), RAG, LangChain, LangGraph, multi-agent systems, planning (CoT/ToT/MCTS), agent evaluation/safety, modern architectures, computer use/GUI agents, frontier systems
**Widgets:** ReAct Loop Visualizer (W17.1), Tool Use Flow (W17.2), Memory Architecture (W17.3), LangGraph Workflow (W17.4), Multi-Agent Orchestration (W17.5)
**Key citations:**
- [1] Yao et al. — ReAct, ICLR 2023 [SEMINAL]
- [2] Schick et al. — Toolformer, NeurIPS 2023 [SEMINAL]
- [3] Lewis et al. — RAG, NeurIPS 2020 [SEMINAL]
- [4] Yao et al. — Tree of Thoughts, NeurIPS 2023 [PAPER]
- [5] Wei et al. — Chain-of-Thought, NeurIPS 2022 [SEMINAL]
- [6] Park et al. — Generative Agents, UIST 2023 [PAPER]
- [7] Liu et al. — AgentBench, ICLR 2024 [PAPER]

import { useTocSections } from "../../components/layout/TocContext";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import MathBlock from "../../components/shared/MathBlock";
import InlineMath from "../../components/shared/InlineMath";
import DatasetTimeline from "../../components/widgets/ch21/DatasetTimeline";
import BenchmarkLeaderboard from "../../components/widgets/ch21/BenchmarkLeaderboard";
import DatasetBias from "../../components/widgets/ch21/DatasetBias";
import DatasetScaleLogarithmic from "../../components/diagrams/ch21/DatasetScaleLogarithmic";
import BenchmarkSaturation from "../../components/diagrams/ch21/BenchmarkSaturation";
import DatasheetsFramework from "../../components/diagrams/ch21/DatasheetsFramework";

const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "var(--prose-size, 15px)",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: "var(--prose-line-height, 1.75)",
  margin: "0 0 var(--prose-margin-bottom, 20px)",
};

const CITATIONS = [
  { num: 1, title: "Gradient-Based Learning Applied to Document Recognition", authors: "LeCun, Bottou, Bengio, Haffner", venue: "Proceedings of the IEEE", year: "1998", tag: "seminal" },
  { num: 2, title: "Learning Multiple Layers of Features from Tiny Images (CIFAR-10)", authors: "Krizhevsky", venue: "Technical Report, University of Toronto", year: "2009", tag: "paper" },
  { num: 3, title: "ImageNet: A Large-Scale Hierarchical Image Database", authors: "Deng, Dong, Socher, Li, Li, Fei-Fei", venue: "CVPR", year: "2009", tag: "seminal" },
  { num: 4, title: "ImageNet Large Scale Visual Recognition Challenge", authors: "Russakovsky, Deng, Su, Krause, Satheesh, Ma, Huang, Karpathy, Khosla, Bernstein, Berg, Fei-Fei", venue: "IJCV", year: "2015", tag: "seminal" },
  { num: 5, title: "Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer (C4 / T5)", authors: "Raffel, Shazeer, Roberts, Lee, Narang, Matena, Zhou, Li, Liu", venue: "JMLR", year: "2020", tag: "seminal" },
  { num: 6, title: "The Pile: An 800GB Dataset of Diverse Text for Language Modeling", authors: "Gao, Biderman, Black, Golding, Hoppe, Foster, Phang, He, Thite, Nabeshima, Presser, Leahy", venue: "arXiv", year: "2020", tag: "paper" },
  { num: 7, title: "LAION-5B: An open large-scale dataset for training next generation image-text models", authors: "Schuhmann, Beaumont, Vencu, Gordon, Wightman, Cherti, Coombes, Katta, Mullis, Wortsman, Schramowski, Kundurthy, Crowson, Schmidt, Kaczmarczyk, Jitsev", venue: "NeurIPS", year: "2022", tag: "paper" },
  { num: 8, title: "Dolma: an Open Corpus of Three Trillion Tokens for Language Model Pretraining Research", authors: "Soldaini, Kinney, Bhagia, Schwenk, Atkinson, Authur, Bogin, Chandu, Dumas, Elazar, et al.", venue: "ACL", year: "2024", tag: "paper" },
  { num: 9, title: "The FineWeb Datasets: Decanting the Web for the Finest Text Data at Scale", authors: "Penedo, Kydlíček, Lozhkov, Mitchell, Raffel, Von Werra, Wolf", venue: "NeurIPS (Datasets and Benchmarks)", year: "2024", tag: "paper" },
  { num: 10, title: "Position: Will We Run Out of Data? Limits of LLM Scaling Based on Human-Generated Data", authors: "Villalobos, Ho, Sevilla, Besiroglu, Heim, Hobbhahn", venue: "ICML", year: "2024", tag: "paper" },
  { num: 11, title: "BLEU: a Method for Automatic Evaluation of Machine Translation", authors: "Papineni, Roukos, Ward, Zhu", venue: "ACL", year: "2002", tag: "seminal" },
  { num: 12, title: "GANs Trained by a Two Time-Scale Update Rule Converge to a Local Nash Equilibrium (introduces FID)", authors: "Heusel, Ramsauer, Unterthiner, Nessler, Hochreiter", venue: "NeurIPS", year: "2017", tag: "paper" },
  { num: 13, title: "CLIPScore: A Reference-free Evaluation Metric for Image Captioning", authors: "Hessel, Holtzman, Forbes, Bras, Choi", venue: "EMNLP", year: "2021", tag: "paper" },
  { num: 14, title: "GLUE: A Multi-Task Benchmark and Analysis Platform for Natural Language Understanding", authors: "Wang, Singh, Michael, Hill, Levy, Bowman", venue: "EMNLP", year: "2018", tag: "seminal" },
  { num: 15, title: "SuperGLUE: A Stickier Benchmark for General-Purpose Language Understanding Systems", authors: "Wang, Pruksachatkun, Nangia, Singh, Michael, Hill, Levy, Bowman", venue: "NeurIPS", year: "2019", tag: "paper" },
  { num: 16, title: "Measuring Massive Multitask Language Understanding (MMLU)", authors: "Hendrycks, Burns, Basart, Zou, Mazeika, Song, Steinhardt", venue: "ICLR", year: "2021", tag: "paper" },
  { num: 17, title: "Evaluating Large Language Models Trained on Code (HumanEval)", authors: "Chen, Tworek, Jun, Yuan, de Oliveira Pinto, et al.", venue: "arXiv", year: "2021", tag: "paper" },
  { num: 18, title: "GPQA: A Graduate-Level Google-Proof Q&A Benchmark", authors: "Rein, Hou, Stickland, Petty, Pang, Dirani, Michael, Bowman", venue: "COLM", year: "2024", tag: "paper" },
  { num: 19, title: "SWE-bench: Can Language Models Resolve Real-World GitHub Issues?", authors: "Jimenez, Yang, Wettig, Yao, Pei, Press, Narasimhan", venue: "ICLR", year: "2024", tag: "paper" },
  { num: 20, title: "Measuring Mathematical Problem Solving With the MATH Dataset", authors: "Hendrycks, Burns, Kadavath, Arora, Basart, Tang, Song, Steinhardt", venue: "NeurIPS (Datasets and Benchmarks)", year: "2021", tag: "paper" },
  { num: 21, title: "MMMU: A Massive Multi-discipline Multimodal Understanding and Reasoning Benchmark for Expert AGI", authors: "Yue, Ni, Zhang, Zheng, Liu, Zhang, et al.", venue: "CVPR", year: "2024", tag: "paper" },
  { num: 22, title: "Humanity's Last Exam", authors: "Phan, Gatti, Han, Li, Hu, Zhang, et al.", venue: "arXiv (CAIS & Scale AI)", year: "2025", tag: "paper" },
  { num: 23, title: "Do ImageNet Classifiers Generalize to ImageNet?", authors: "Recht, Roelofs, Schmidt, Shankar", venue: "ICML", year: "2019", tag: "paper" },
  { num: 24, title: "Chatbot Arena: An Open Platform for Evaluating LLMs by Human Preference", authors: "Chiang, Zheng, Sheng, Angelopoulos, Li, Li, et al.", venue: "ICML", year: "2024", tag: "paper" },
  { num: 25, title: "Rank Analysis of Incomplete Block Designs: I. The Method of Paired Comparisons", authors: "Bradley, Terry", venue: "Biometrika", year: "1952", tag: "seminal" },
  { num: 26, title: "Gender Shades: Intersectional Accuracy Disparities in Commercial Gender Classification", authors: "Buolamwini, Gebru", venue: "FAT* (PMLR)", year: "2018", tag: "seminal" },
  { num: 27, title: "Man is to Computer Programmer as Woman is to Homemaker? Debiasing Word Embeddings", authors: "Bolukbasi, Chang, Zou, Saligrama, Kalai", venue: "NeurIPS", year: "2016", tag: "paper" },
  { num: 28, title: "Datasheets for Datasets", authors: "Gebru, Morgenstern, Vecchione, Wortman Vaughan, Wallach, Daumé III, Crawford", venue: "Communications of the ACM", year: "2021", tag: "seminal" },
  { num: 29, title: "Model Cards for Model Reporting", authors: "Mitchell, Wu, Zaldivar, Barnes, Vasserman, Hutchinson, Spitzer, Raji, Gebru", venue: "FAT*", year: "2019", tag: "paper" },
];

const TOC_SECTIONS = [
  { id: "the-scale-of-modern-datasets",     label: "Dataset Scale" },
  { id: "what-a-benchmark-measures",        label: "What a Benchmark Measures" },
  { id: "benchmarks-drive-progress",        label: "Benchmarks" },
  { id: "dataset-bias-and-responsibility",  label: "Bias & Responsibility" },
];

export default function Datasets() {
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
        Chapter 21 · Part VI — Evaluation & Understanding
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
        Datasets &amp; Benchmarks
      </h1>

      <ChapterLede>
        Every major breakthrough in machine learning is inseparable from a dataset: ImageNet made AlexNet possible, Common Crawl made GPT possible. The benchmark a field adopts shapes which architectures get built, which capabilities get measured, and which gaps go unnoticed for years. Understanding the data is not secondary to understanding the model — it is prior to it.
      </ChapterLede>

      {/* ── Section 1: The Scale of Modern Datasets ─────────────────────────── */}
      <div id="the-scale-of-modern-datasets">
        <SectionTitle>The Scale of Modern Datasets</SectionTitle>
      </div>

      <p style={prose}>
        The leap from thousands to billions of training examples changed what was computationally possible. MNIST, which launched the era of learned digit recognition in 1998, fit on a floppy disk. LAION-5B, a 2022 image-text dataset used to train Stable Diffusion, requires petabyte-scale storage. Between them lies a 25-year arc of dataset scaling, during which every order-of-magnitude expansion in data revealed new capabilities that smaller datasets had hidden. The relationship between data scale and model capability is not merely empirical — it is the defining story of modern deep learning.
      </p>

      <p style={prose}>
        A short canon of datasets defined each era. <strong>MNIST</strong> (LeCun et al. 1998 [1]) — 60,000 training images (70,000 including the held-out test set) at roughly 10 MB — was the first widely-shared benchmark and remained the field's default starter problem for two decades. <strong>CIFAR-10</strong> (Krizhevsky 2009 [2]) introduced color images and ten object classes at 60,000 examples. <strong>ImageNet</strong> (Deng et al. 2009 [3], with the canonical benchmark formalized in Russakovsky et al. 2015 [4]) scaled to 1.2 million labeled images across 1,000 categories and became the proving ground where AlexNet's 2012 result kicked off the deep learning era proper. The next leap was unsupervised: <strong>Common Crawl</strong> — a nonprofit web-scrape archive founded in 2007 that began collecting pages in 2008 and has run monthly crawls ever since — and curated derivatives like <strong>C4</strong> (the Colossal Clean Crawled Corpus, roughly 156 billion tokens and 750 GB of filtered text, built for the T5 model; Raffel et al. 2020 [5]) and <strong>The Pile</strong> (Gao et al. 2020 [6], around 300 billion tokens and 800 GB of web text, books, code, papers, and math) became the standard substrate for large language models. <strong>LAION-5B</strong> (Schuhmann et al. 2022 [7]) extended this scaling philosophy to image-text pairs — 5.85 billion image-caption pairs scraped from the open web — and became the training substrate for Stable Diffusion and a generation of open text-to-image models.
      </p>

      <p style={prose}>
        None of these corpora arrive training-ready. Common Crawl's raw pages are noisy — boilerplate, duplicate content, machine-generated spam — and turning a scrape into a corpus worth training on is its own engineering discipline: deduplication (exact matches and near-duplicates found via locality-sensitive hashing techniques like MinHash), quality filtering (heuristic rules or trained classifiers that discard low-quality pages), language identification, and deliberate mixing ratios across sources. <strong>RedPajama</strong> (Together Computer, 2023), <strong>Dolma</strong> (Soldaini et al. 2024 [8]), and <strong>FineWeb</strong> (Penedo et al. 2024 [9]) are the field's canonical open examples of this pipeline — each releases not just a corpus but the filtering code and ablations showing which curation choices actually moved downstream benchmark scores, which is often a bigger lever than raw token count alone.
      </p>

      <p style={prose}>
        Frontier language models in 2024–2026 train on corpora measured in trillions of tokens. Llama 3 trained on approximately 15 trillion tokens; GPT-4 and Claude family models are reported to have trained at similar scales. Growth has been roughly an order of magnitude every two to three years since 2018 — a pace that cannot continue indefinitely. Villalobos et al. (2024) [10] estimated that the stock of high-quality public text data could be effectively exhausted somewhere between 2026 and 2032 at current scaling rates, or earlier if models are trained past today's compute-optimal token budgets. That finding has sharpened the field's interest in synthetic data generation (using current models to produce training data for the next), multimodal data (where image, video, and audio remain orders of magnitude underused relative to their availability), and data efficiency improvements (getting more capability from each token). The dataset scaling story isn't over, but the easy gains from "just scrape more web pages" are visibly ending.
      </p>

      <p style={prose}>
        The plot below places all nine datasets on one log-scale axis; scan left to right and notice how the interval between one order-of-magnitude jump and the next keeps shrinking, from roughly a decade between MNIST and ImageNet down to two or three years by the time language-model corpora take over.
      </p>

      <DatasetScaleLogarithmic />

      <p style={prose}>
        Click through the timeline below from MNIST to LAION-5B; notice how each dataset's jump in scale lines up with a jump in what models trained on it could newly do.
      </p>

      <DatasetTimeline
        tryThis={{
          do: "Switch \"Size dots by\" from Examples to Storage, then click through the dots from MNIST to LAION-5B.",
          notice: "Common Crawl and The Pile swell far larger under Storage than under Examples, since token-based text corpora and image corpora are measured in different units — the two rankings don't agree.",
        }}
      />

      {/* ── Section 2: What a Benchmark Actually Measures ───────────────────── */}
      <div id="what-a-benchmark-measures">
        <SectionTitle>What a Benchmark Actually Measures</SectionTitle>
      </div>

      <p style={prose}>
        Every benchmark score in this chapter reduces a model's behavior on thousands of examples to one number, and the way that reduction happens shapes what the number actually tells you. Classification benchmarks like ImageNet report top-<InlineMath>{"k"}</InlineMath> accuracy; free-text and structured-prediction tasks report precision, recall, and their harmonic mean, F1; and generation tasks — translation, language modeling — report metrics built directly from probability.
      </p>

      <MathBlock>{"$$\\text{top-}k\\text{ accuracy} = \\frac{1}{N}\\sum_{i=1}^{N} \\mathbb{1}\\!\\left[\\, y_i \\in \\text{top-}k\\bigl(f(x_i)\\bigr) \\,\\right]$$"}</MathBlock>

      <p style={prose}>
        For each of the <InlineMath>{"N"}</InlineMath> test examples, the indicator counts a 1 if the true label <InlineMath>{"y_i"}</InlineMath> appears anywhere among the model's <InlineMath>{"k"}</InlineMath> highest-scoring predictions and a 0 otherwise. Top-1 accuracy demands the single best guess be correct; top-5 accuracy only requires the true label to appear somewhere in the model's five best guesses — a much more forgiving bar. Suppose a model is evaluated on 10 images from a 1,000-class dataset and ranks the correct class first for 7 of them: top-1 accuracy is 7/10 = 70%. If 2 more of the remaining 3 have the correct class somewhere in the top five guesses, top-5 accuracy rises to 9/10 = 90%. That 20-point gap is exactly why ImageNet leaderboards reported top-5 for years — it tolerates near-misses among visually similar classes (a fox scored as a wolf) while still requiring genuine recognition.
      </p>

      <p style={prose}>
        When classes are imbalanced, plain accuracy can be misleading — a detector that always says "no" scores well on a rare-event task without finding a single true positive. Precision and recall, first defined in Chapter 1 alongside the confusion matrix they are built from, separate the two ways a classifier can be wrong, and F1 combines them into a single number that punishes ignoring either one.
      </p>

      <MathBlock>{"$$F_1 = 2\\cdot\\frac{\\text{precision}\\cdot\\text{recall}}{\\text{precision}+\\text{recall}}, \\qquad \\text{precision}=\\frac{TP}{TP+FP}, \\qquad \\text{recall}=\\frac{TP}{TP+FN}$$"}</MathBlock>

      <p style={prose}>
        Precision is the fraction of the model's positive predictions that were actually correct; recall is the fraction of the true positives the model actually found. <InlineMath>{"F_1"}</InlineMath>, their harmonic mean rather than their average, stays low unless both are simultaneously high — a model can't compensate for near-zero recall by being very precise about the few positives it does flag.
      </p>

      <p style={prose}>
        Generation tasks score differently, because there is rarely one correct output. Machine translation is traditionally scored with BLEU (Papineni et al. 2002 [11]), which multiplies an n-gram precision — the fraction of the candidate translation's word sequences that also appear in a reference translation — against a brevity penalty that punishes outputs shorter than the reference: roughly <InlineMath>{"\\text{BLEU} = \\text{BP}\\cdot\\exp\\!\\left(\\sum_n w_n \\log p_n\\right)"}</InlineMath>. Language modeling itself is scored with perplexity, which needs no reference text at all — it only asks how surprised the model was by the text it was actually shown.
      </p>

      <MathBlock>{"$$\\text{PPL}(x_{1:T}) = \\exp\\!\\left(-\\frac{1}{T}\\sum_{t=1}^{T}\\log p_\\theta(x_t \\mid x_{<t})\\right)$$"}</MathBlock>

      <p style={prose}>
        Perplexity is the exponentiated average negative log-likelihood the model assigns its own held-out tokens. A model that is perfectly certain of every next token scores a perplexity of 1; an untrained model choosing uniformly among a vocabulary of size <InlineMath>{"V"}</InlineMath> scores a perplexity of roughly <InlineMath>{"V"}</InlineMath>. Lower is better, and — unlike accuracy or F1 — perplexity is defined without any labeled test set, just held-out text, which is why it remains the default metric during pretraining long before a model is fluent enough for task-specific benchmarks to be meaningful.
      </p>

      <p style={prose}>
        <strong>Going deeper: automatic metrics for generative models.</strong> None of the metrics above apply cleanly to a model that generates images rather than labels or text. Diffusion and GAN outputs are typically scored with FID (Fréchet Inception Distance; Heusel et al. 2017 [12]), which compares the statistics of a neural network's internal features on real versus generated images rather than comparing pixels directly, and with CLIP score (Hessel et al. 2021 [13]), which measures how well a generated image's CLIP embedding matches its text prompt's embedding. Both trade the precision of a labeled ground truth for a proxy — an image can score well on FID while still containing a self-evidently wrong number of fingers — which is a limitation worth remembering whenever a generative model's benchmark table looks unusually clean.
      </p>

      {/* ── Section 3: Benchmarks Drive Progress ─────────────────────────────── */}
      <div id="benchmarks-drive-progress">
        <SectionTitle>Benchmarks Drive Progress</SectionTitle>
      </div>

      <p style={prose}>
        A benchmark defines what it means for a model to be "better." ImageNet classification accuracy, BLEU score for translation, GLUE for language understanding — each metric shaped an entire generation of research. The risk is Goodhart's Law: when a measure becomes a target, it ceases to be a good measure. GLUE was saturated within two years of its release, prompting SuperGLUE, which was itself approached within months. Modern benchmarks like MMLU and HumanEval attempt to measure genuine reasoning and coding ability rather than pattern-matchable surface statistics — though this distinction is itself contested.
      </p>

      <p style={prose}>
        Each benchmark generation gets saturated faster than the last. <strong>GLUE</strong> (Wang et al. 2018 [14]) — nine natural-language-understanding (NLU) tasks bundled into one evaluation — was the standard from 2018 to 2019, then approached human-level by BERT and was superseded by SuperGLUE (Wang et al. 2019 [15]) within twelve months. SuperGLUE was in turn saturated by fine-tuned large models within another two years — GPT-3's own few-shot score never cleared the human baseline, but the fine-tuned, larger models that followed did. <strong>MMLU</strong> (Hendrycks et al. 2021 [16]) — 57 multiple-choice subjects from elementary math through professional medicine — became the dominant general-knowledge benchmark almost immediately: GPT-4 scored 86.4% at its March 2023 release, and by September 2024 OpenAI's o1 had crossed the benchmark's estimated human-expert ceiling of 89.8%, effectively saturating it within about four years of publication. <strong>HumanEval</strong> (Chen et al. 2021 [17]) — 164 hand-written Python coding problems with unit tests — was the standard coding benchmark over the same period: Codex's original 28.8% pass@1 gave way to GPT-4's 67.0% by 2023 and GPT-4o's 90.2% by 2024.
      </p>

      <p style={prose}>
        HumanEval scores like these are reported as pass@<InlineMath>{"k"}</InlineMath> rather than plain accuracy, because a model can solve a problem on one random sample and fail it on the next. For each problem, several completions are sampled independently, and pass@<InlineMath>{"k"}</InlineMath> asks: if <InlineMath>{"k"}</InlineMath> of those completions were drawn at random, what is the probability at least one of them passes the unit tests?
      </p>

      <MathBlock>{"$$\\text{pass@}k := \\mathbb{E}_{\\text{problems}}\\!\\left[\\,1 - \\frac{\\binom{n-c}{k}}{\\binom{n}{k}}\\,\\right]$$"}</MathBlock>

      <p style={prose}>
        For each problem, <InlineMath>{"n"}</InlineMath> completions are sampled and <InlineMath>{"c"}</InlineMath> of them pass. This unbiased estimator (Chen et al. 2021 [17]) computes the exact probability that a random draw of <InlineMath>{"k"}</InlineMath> completions from those <InlineMath>{"n"}</InlineMath> would have included at least one passing completion, rather than literally drawing <InlineMath>{"k"}</InlineMath> completions and rerunning — which would need far more samples to control variance. Concretely: with <InlineMath>{"n=10"}</InlineMath> completions and <InlineMath>{"c=3"}</InlineMath> passing, pass@1 <InlineMath>{"= 1 - \\binom{7}{1}/\\binom{10}{1} = 1 - 7/10 = 0.3"}</InlineMath> — identical to the naive <InlineMath>{"c/n"}</InlineMath> ratio at <InlineMath>{"k=1"}</InlineMath> — but pass@5 <InlineMath>{"= 1 - \\binom{7}{5}/\\binom{10}{5} = 1 - 21/252 \\approx 0.92"}</InlineMath>, far higher than <InlineMath>{"5c/n"}</InlineMath> would suggest, because it asks whether any of five draws succeeds, not what fraction of them do.
      </p>

      <p style={prose}>
        The frontier then fragmented into a wave of harder, more specialized benchmarks, each replacing MMLU and HumanEval's role for a narrower slice of capability. <strong>GPQA</strong> (Rein et al. 2024 [18]) arrived first, in November 2023, for graduate-level science questions even domain experts can't easily look up — GPT-4 scored just 39% on its hardest "Diamond" subset at release, well below the roughly 65–74% PhD-level specialists reach. <strong>SWE-bench</strong> (Jimenez et al. 2024 [19]) followed in 2024 for real bug-fix tasks pulled from open-source GitHub issues. <strong>MATH</strong> (Hendrycks et al. 2021 [20]) and <strong>AIME</strong> covered olympiad-level mathematics; <strong>MMMU</strong> (Yue et al. 2024 [21]) added multimodal reasoning. By early 2025, <strong>FrontierMath</strong> (Epoch AI, November 2024) and <strong>Humanity's Last Exam</strong> (Phan et al. 2025 [22], produced jointly by the Center for AI Safety and Scale AI) pushed further still, deliberately targeting questions frontier models could not yet answer.
      </p>

      <p style={prose}>
        The Goodhart's Law concern grows sharper as benchmarks shape ever-larger investments. Two issues have become especially salient. <strong>Contamination</strong>: training data scraped from the web frequently contains benchmark questions and answers, inflating scores in ways that vary across models and are hard to control. The community has moved toward held-out benchmarks (questions written after a model's training cutoff) and rotating versions, but contamination remains a structural problem for any benchmark that survives long enough to matter. Detecting contamination after the fact, and using models themselves as judges of other models' open-ended output, are involved enough methodological problems that Chapter 22 takes them up directly — this chapter's job is cataloging what gets measured, not auditing how cleanly it was measured.
      </p>

      <p style={prose}>
        A second, distinct failure mode has nothing to do with leaked answers. <strong>Adaptive overfitting</strong>: a benchmark's test set is fixed, but the field's choices are not — years of researchers implicitly tuning architectures, hyperparameters, and even data-collection heuristics against the same static test set can inflate reported accuracy relative to true generalization, with no contamination involved at all. Recht et al. (2019) [23] tested this directly on ImageNet: they collected a new test set using the original paper's own collection methodology and found every model's accuracy dropped by roughly 11–14 percentage points relative to its score on the original test set, a gap the dataset's own label noise only partly explains. The lesson generalizes past ImageNet — a benchmark score measures performance against one fixed sample, and how well that sample still represents the distribution a model will actually face erodes a little more with every year the field spends optimizing against it.
      </p>

      <p style={prose}>
        <strong>Open-ended evaluation</strong>: many things people use models for — helpful conversation, creative writing, agentic tool use — have no obvious automatic metric. <strong>Chatbot Arena</strong>, also known as <strong>LMArena</strong> (Chiang et al. 2024 [24]), addresses this by collecting paired human preferences across millions of head-to-head comparisons and converting them into Elo-style rankings — a pairwise rating system borrowed from chess, in which each model gets a single number and the gap between two models' numbers predicts how often one beats the other.
      </p>

      <MathBlock>{"$$P(A \\text{ beats } B) = \\frac{1}{1 + 10^{-(R_A - R_B)/400}}$$"}</MathBlock>

      <p style={prose}>
        <InlineMath>{"R_A"}</InlineMath> and <InlineMath>{"R_B"}</InlineMath> are the two models' current ratings. A 400-point gap predicts roughly a 10:1 win rate (<InlineMath>{"1/(1+10^{-1}) \\approx 0.91"}</InlineMath>); a 200-point gap predicts roughly 76%. LMArena actually fits its ratings with the closely related Bradley–Terry model (Bradley &amp; Terry 1952 [25]), a maximum-likelihood formulation of the same pairwise-comparison idea that also yields confidence intervals from the volume of comparisons collected — which is why arena leaderboards report rating ranges rather than single numbers. The standardized-benchmark and human-preference traditions now run in parallel: benchmarks measure narrow capabilities precisely; arenas measure general capability noisily but holistically. Both have known failure modes, and the field uses them together.
      </p>

      <p style={prose}>
        The trajectories below trace state-of-the-art performance on each benchmark from its release to the present; notice how the time between a benchmark's release and its saturation keeps compressing, and how the GPQA line only becomes a three-benchmark composite once FrontierMath and Humanity's Last Exam actually exist to average in.
      </p>

      <BenchmarkSaturation />

      <p style={prose}>
        Switch between the ImageNet, GLUE, and HumanEval tabs below; notice that only GLUE's progress line actually crosses a directly comparable human baseline — the other two panels flag why their "human" comparison isn't as clean as it looks.
      </p>

      <BenchmarkLeaderboard
        tryThis={{
          do: "Switch between the ImageNet, GLUE, and HumanEval tabs, keeping the Human toggle on.",
          notice: "ImageNet's human line is labeled top-5 and not directly comparable to the top-1 scores plotted, and HumanEval shows no human line at all — only GLUE has a same-metric human baseline the progress line can be honestly said to cross.",
        }}
      />

      {/* ── Section 4: Dataset Bias & Responsibility ──────────────────────────── */}
      <div id="dataset-bias-and-responsibility">
        <SectionTitle>Dataset Bias &amp; Responsibility</SectionTitle>
      </div>

      <p style={prose}>
        Datasets encode the perspectives of their creators and the sources they drew from. ImageNet's class distribution reflects what was photographable and interesting to American and European internet users in 2009. Face recognition datasets historically overrepresented lighter skin tones, leading to measurable performance disparities. Common Crawl's web scrape overrepresents English and underrepresents the languages of the majority of the world's population. These are not edge cases to be corrected after the fact — they are inherent to how datasets are collected, and they propagate into every model trained on them.
      </p>

      <p style={prose}>
        The claim that datasets encode their creators' perspectives isn't abstract — it has been demonstrated repeatedly. Buolamwini &amp; Gebru's <strong>Gender Shades</strong> study (2018) [26] measured commercial face-classification systems across demographic groups and found error rates up to 34 percentage points higher for darker-skinned women than for lighter-skinned men, a gap that traced directly back to training data composition. Bolukbasi et al. (2016) [27] showed analogous patterns in word embeddings: vectors trained on general web text encoded "man:doctor :: woman:nurse"-style associations that propagated into any downstream system using those embeddings. These weren't subtle effects — they were structural, measurable, and widespread. Gebru et al.'s (2021) [28] <em>Datasheets for Datasets</em> proposed a documentation standard: every dataset should ship with a written specification of motivation, composition, collection process, recommended uses, and known limitations — the way every physical component ships with a datasheet. <strong>Model Cards</strong> (Mitchell et al. 2019 [29]) extended the idea to trained models, recommending documentation of intended use cases, performance across demographic groups, and known failure modes. Adoption has been uneven, but the principle — that systems should ship with structured information about their limitations — has become normative across the field.
      </p>

      <p style={prose}>
        The datasheet template below lays out all seven sections at once; notice how directly "Motivation" and "Collection" map onto the exact questions Gender Shades and Bolukbasi et al.'s studies had to reconstruct after the fact, simply because nothing like this existed when ImageNet and early face-recognition datasets were assembled.
      </p>

      <DatasheetsFramework />

      <p style={prose}>
        Dataset bias has expanded from a research concern into a curation discipline. The <strong>LAION-5B</strong> dataset was rescinded in December 2023 after researchers at the Stanford Internet Observatory discovered child sexual abuse material in the scraped image set, and reissued as a cleaned <strong>Re-LAION-5B</strong> in August 2024 — a finding that prompted a broad re-examination of "just scrape the web" as a defensible data strategy. <strong>Copyright</strong> concerns have produced active litigation (the New York Times v. OpenAI suit, the Getty Images v. Stability AI suit, ongoing book-piracy investigations) and have shifted the legal landscape under which large datasets are assembled. Opt-out registries, licensed data deals (publishers selling access to model trainers), and synthetic-data substitution are emerging as alternatives. The trajectory is clear: the era of scraping the open web at scale and asking forgiveness later is closing. What replaces it — paid licensing, synthetic generation, opt-in registries, deliberate curation — is being actively negotiated. The technical capability to train on internet-scale data has, in the span of a few years, produced a corresponding set of legal, ethical, and curatorial questions that the field is still working out.
      </p>

      <p style={prose}>
        Switch to Common Crawl below and toggle the uniform baseline; notice English's 46% share against a uniform share of roughly 0.014% across the world's approximately 7,000 languages — a gap far larger than ImageNet's own geographic skew.
      </p>

      <DatasetBias
        tryThis={{
          do: "Switch to Common Crawl and toggle the uniform baseline on and off.",
          notice: "English holds 46% of the corpus against a uniform share of roughly 0.014% per language across ~7,000 languages — a starker imbalance than ImageNet's geographic distribution shows for images.",
        }}
      />

      <p style={prose}>
        What carries forward from this chapter is less any single benchmark's score than the pattern underneath all of them: scale unlocks capability, a fixed measurement gets adopted and saturates, and the numbers a field reports are only as trustworthy as the data and documentation behind them. The metrics introduced here — top-<InlineMath>{"k"}</InlineMath> accuracy, F1, perplexity, pass@<InlineMath>{"k"}</InlineMath>, Bradley–Terry ratings — are the vocabulary the rest of the book's results tables assume. Chapter 22 turns from which benchmarks exist to how evaluation itself is actually done: perplexity against task performance, pass@<InlineMath>{"k"}</InlineMath> methodology in full, using models themselves as judges, detecting contamination, and scoring agents that take multi-step actions rather than answer single questions.
      </p>

      {/* ── Citations ─────────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}

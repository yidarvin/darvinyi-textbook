import { useTocSections } from "../../components/layout/TocRail";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import DatasetTimeline from "../../components/widgets/ch20/DatasetTimeline";
import BenchmarkLeaderboard from "../../components/widgets/ch20/BenchmarkLeaderboard";
import DatasetBias from "../../components/widgets/ch20/DatasetBias";

const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "15px",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: 1.75,
  margin: "0 0 20px",
};

const CITATIONS = [
  { num: "[1]", title: "ImageNet Large Scale Visual Recognition Challenge", authors: "Russakovsky, Deng, Su, Krause, Satheesh, Ma, Huang, Karpathy, Khosla, Bernstein, Berg, Fei-Fei", venue: "IJCV", year: "2015", tag: "seminal" },
  { num: "[2]", title: "GLUE: A Multi-Task Benchmark and Analysis Platform for Natural Language Understanding", authors: "Wang, Singh, Michael, Hill, Levy, Bowman", venue: "EMNLP", year: "2018", tag: "seminal" },
  { num: "[3]", title: "Measuring Massive Multitask Language Understanding (MMLU)", authors: "Hendrycks, Burns, Basart, Zou, Mazeika, Song, Steinhardt", venue: "ICLR", year: "2021", tag: "paper" },
  { num: "[4]", title: "Evaluating Large Language Models Trained on Code (HumanEval)", authors: "Chen, Tworek, Jun, Yuan, de Oliveira Pinto et al.", venue: "arXiv", year: "2021", tag: "paper" },
  { num: "[5]", title: "LAION-5B: An open large-scale dataset for training next generation image-text models", authors: "Schuhmann, Beaumont, Vencu, Gordon, Wightman, Cherti, Coombes, Katta, Mullis, Wortsman, Schramowski, Kundurthy, Crowson, Schmidt, Beaumont, Jitsev", venue: "NeurIPS", year: "2022", tag: "paper" },
  { num: "[6]", title: "Datasheets for Datasets", authors: "Gebru, Morgenstern, Vecchione, Wortman Vaughan, Wallach, Daume, Crawford", venue: "Communications of the ACM", year: "2021", tag: "paper" },
];

const TOC_SECTIONS = [
  { id: "the-scale-of-modern-datasets",    label: "Dataset Scale" },
  { id: "benchmarks-drive-progress",       label: "Benchmarks" },
  { id: "dataset-bias-and-responsibility", label: "Bias & Responsibility" },
];

export default function Datasets() {
  useTocSections(TOC_SECTIONS);

  return (
    <article
      style={{
        maxWidth: "740px",
        margin: "0 auto",
        padding: "52px 44px 100px",
      }}
    >
      {/* Chapter header */}
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "10.5px",
          fontWeight: 400,
          letterSpacing: "0.1em",
          color: "var(--accent)",
          opacity: 0.7,
          textTransform: "uppercase",
          marginBottom: "12px",
        }}
      >
        Chapter 20 · Part VI — Evaluation
      </div>

      <h1
        style={{
          fontFamily: "'Crimson Pro', serif",
          fontSize: "42px",
          fontWeight: 600,
          color: "var(--text)",
          margin: "0 0 0",
          lineHeight: 1.15,
        }}
      >
        Datasets &amp; Benchmarks
      </h1>

      <ChapterLede>
        Every major breakthrough in machine learning is inseparable from a dataset.
        ImageNet made AlexNet possible. Common Crawl made GPT possible. The benchmark
        a field adopts shapes which architectures get built, which capabilities get
        measured, and which gaps go unnoticed for years. Understanding the data
        is not secondary to understanding the model — it is prior to it.
      </ChapterLede>

      {/* ── Section 1: The Scale of Modern Datasets ─────────────────────────── */}
      <div id="the-scale-of-modern-datasets">
        <SectionTitle>The Scale of Modern Datasets</SectionTitle>
      </div>

      <p style={prose}>
        The leap from thousands to billions of training examples changed what was
        computationally possible. MNIST, which launched the era of learned digit
        recognition in 1998, fit on a floppy disk. LAION-5B, a 2022 image-text
        dataset used to train Stable Diffusion, requires petabyte-scale storage.
        Between them lies a 25-year arc of dataset scaling, during which every
        order-of-magnitude expansion in data revealed new capabilities that smaller
        datasets had hidden. The relationship between data scale and model capability
        is not merely empirical — it is the defining story of modern deep learning.
      </p>

      <DatasetTimeline />

      {/* ── Section 2: Benchmarks Drive Progress ─────────────────────────────── */}
      <div id="benchmarks-drive-progress">
        <SectionTitle>Benchmarks Drive Progress</SectionTitle>
      </div>

      <p style={prose}>
        A benchmark defines what it means for a model to be "better." ImageNet
        classification accuracy, BLEU score for translation, GLUE for language
        understanding — each metric shaped an entire generation of research.
        The risk is Goodhart's Law: when a measure becomes a target, it ceases
        to be a good measure. GLUE was saturated within two years of its release,
        prompting SuperGLUE, which was itself approached by large language models
        within months. Modern benchmarks like MMLU and HumanEval attempt to measure
        genuine reasoning and coding ability rather than pattern-matchable surface
        statistics — though this distinction is itself contested.
      </p>

      <BenchmarkLeaderboard />

      {/* ── Section 3: Dataset Bias & Responsibility ──────────────────────────── */}
      <div id="dataset-bias-and-responsibility">
        <SectionTitle>Dataset Bias &amp; Responsibility</SectionTitle>
      </div>

      <p style={prose}>
        Datasets encode the perspectives of their creators and the sources they
        drew from. ImageNet's class distribution reflects what was photographable
        and interesting to American and European internet users in 2009. Face
        recognition datasets historically overrepresented lighter skin tones,
        leading to measurable performance disparities. Common Crawl's web scrape
        overrepresents English and underrepresents the languages of the majority
        of the world's population. These are not edge cases to be corrected after
        the fact — they are inherent to how datasets are collected, and they
        propagate into every model trained on them.
      </p>

      <DatasetBias />

      {/* ── Citations ─────────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}

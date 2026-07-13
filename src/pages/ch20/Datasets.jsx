import { useTocSections } from "../../components/layout/TocRail";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import DatasetTimeline from "../../components/widgets/ch20/DatasetTimeline";
import BenchmarkLeaderboard from "../../components/widgets/ch20/BenchmarkLeaderboard";
import DatasetBias from "../../components/widgets/ch20/DatasetBias";
import DatasetScaleLogarithmic from "../../components/diagrams/ch20/DatasetScaleLogarithmic";
import BenchmarkSaturation from "../../components/diagrams/ch20/BenchmarkSaturation";
import DatasheetsFramework from "../../components/diagrams/ch20/DatasheetsFramework";

const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "var(--prose-size, 15px)",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: "var(--prose-line-height, 1.75)",
  margin: "0 0 var(--prose-margin-bottom, 20px)",
};

const CITATIONS = [
  { num: 1, title: "ImageNet Large Scale Visual Recognition Challenge", authors: "Russakovsky, Deng, Su, Krause, Satheesh, Ma, Huang, Karpathy, Khosla, Bernstein, Berg, Fei-Fei", venue: "IJCV", year: "2015", tag: "seminal" },
  { num: 2, title: "GLUE: A Multi-Task Benchmark and Analysis Platform for Natural Language Understanding", authors: "Wang, Singh, Michael, Hill, Levy, Bowman", venue: "EMNLP", year: "2018", tag: "seminal" },
  { num: 3, title: "Measuring Massive Multitask Language Understanding (MMLU)", authors: "Hendrycks, Burns, Basart, Zou, Mazeika, Song, Steinhardt", venue: "ICLR", year: "2021", tag: "paper" },
  { num: 4, title: "Evaluating Large Language Models Trained on Code (HumanEval)", authors: "Chen, Tworek, Jun, Yuan, de Oliveira Pinto et al.", venue: "arXiv", year: "2021", tag: "paper" },
  { num: 5, title: "LAION-5B: An open large-scale dataset for training next generation image-text models", authors: "Schuhmann, Beaumont, Vencu, Gordon, Wightman, Cherti, Coombes, Katta, Mullis, Wortsman, Schramowski, Kundurthy, Crowson, Schmidt, Beaumont, Jitsev", venue: "NeurIPS", year: "2022", tag: "paper" },
  { num: 6, title: "Datasheets for Datasets", authors: "Gebru, Morgenstern, Vecchione, Wortman Vaughan, Wallach, Daume, Crawford", venue: "Communications of the ACM", year: "2021", tag: "paper" },
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
        Chapter 20 · Part VI — Evaluation
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

      <p style={prose}>
        A short canon of datasets defined each era. MNIST (LeCun, Bottou, Bengio
        &amp; Haffner 1998) — 70,000 handwritten digits at roughly 10 MB — was the
        first widely-shared benchmark and remained the field's default starter
        problem for two decades. CIFAR-10 (Krizhevsky 2009) introduced color images
        and ten object classes at 60,000 examples. <strong>ImageNet</strong> (Deng,
        Dong, Socher, Li, Li &amp; Fei-Fei 2009, with the canonical benchmark
        formalized in Russakovsky et al. 2015 [1]) scaled to 1.4 million labeled
        images across 1,000 categories and became the proving ground where AlexNet's
        2012 result kicked off the deep learning era proper. The next leap was
        unsupervised: <strong>Common Crawl</strong> (an ongoing web-scrape archive
        started in 2008) and curated derivatives like <strong>C4</strong> (the
        Colossal Clean Crawled Corpus, roughly 750 GB of filtered text) and
        <strong> The Pile</strong> (Gao et al. 2020, around 800 GB of web text,
        books, code, papers, and math) became the standard substrate for large
        language models. <strong>LAION-5B</strong> (Schuhmann, Beaumont, Vencu et
        al. 2022 [5]) extended this scaling philosophy to image-text pairs — 5.85
        billion image-caption pairs scraped from the open web — and became the
        training substrate for Stable Diffusion and a generation of open
        text-to-image models.
      </p>

      <p style={prose}>
        Frontier language models in 2024–2026 train on corpora measured in trillions
        of tokens. Llama 3 trained on approximately 15 trillion tokens; GPT-4 and
        Claude family models are reported to have trained at similar scales.
        Growth has been roughly an order of magnitude every two to three years
        since 2018 — a pace that cannot continue indefinitely. Villalobos, Sevilla,
        Heim, Besiroglu, Hobbhahn &amp; Ho (2024) estimated that the stock of
        high-quality public text data could be effectively exhausted somewhere
        between 2025 and 2032 at current scaling rates. That finding has sharpened
        the field's interest in synthetic data generation (using current models to
        produce training data for the next), multimodal data (where image, video,
        and audio remain orders of magnitude underused relative to their availability),
        and data efficiency improvements (getting more capability from each token).
        The dataset scaling story isn't over, but the easy gains from "just scrape
        more web pages" are visibly ending.
      </p>

      <DatasetScaleLogarithmic />

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

      <p style={prose}>
        Each benchmark generation gets saturated faster than the last.
        <strong> GLUE</strong> (Wang, Singh, Michael, Hill, Levy &amp; Bowman 2018
        [2]) — nine NLU tasks bundled into one evaluation — was the standard from
        2018 to 2019, then approached human-level by BERT and was superseded by
        SuperGLUE (Wang et al. 2019) within twelve months. SuperGLUE was saturated
        by GPT-3 and its successors within another two years. <strong>MMLU</strong>
        (Hendrycks, Burns, Basart, Zou, Mazeika, Song &amp; Steinhardt 2021 [3]) —
        57 multiple-choice subjects from elementary math through professional
        medicine — was the dominant general-knowledge benchmark from 2021 to 2024,
        with frontier models now scoring in the high 80s and low 90s where human
        experts score around 90. <strong>HumanEval</strong> (Chen, Tworek, Jun et
        al. 2021 [4]) — 164 hand-written Python coding problems with unit tests —
        was the standard coding benchmark from 2021 to 2024; frontier models now
        solve more than 90% of problems on the first attempt, where the dataset's
        original baseline was 28%. By 2025–2026 the measurement frontier had
        shifted again: <strong>GPQA</strong> (Rein, Hou, Stickland et al. 2023)
        for graduate-level science questions even experts can't easily Google;
        <strong> SWE-Bench</strong> (Jiménez, Yang, Wettig et al. 2024) for real
        bug-fix tasks pulled from open-source GitHub issues; <strong>MATH</strong>
        (Hendrycks et al. 2021) and <strong>AIME</strong> for olympiad-level math;
        <strong> MMMU</strong> (Yue, Ni, Zhang et al. 2024) for multimodal
        reasoning; <strong>Humanity's Last Exam</strong> (Center for AI Safety,
        2025) for the deliberately hardest questions across all academic
        disciplines.
      </p>

      <p style={prose}>
        The Goodhart's Law concern grows sharper as benchmarks shape ever-larger
        investments. Two issues have become especially salient. <strong>Contamination</strong>:
        training data scraped from the web frequently contains benchmark questions
        and answers, inflating scores in ways that vary across models and are hard
        to control. The community has moved toward held-out benchmarks (questions
        written after a model's training cutoff) and rotating versions, but
        contamination remains a structural problem for any benchmark that survives
        long enough to matter. <strong>Open-ended evaluation</strong>: many things
        people use models for — helpful conversation, creative writing, agentic
        tool use — have no obvious automatic metric. <strong>Chatbot Arena</strong> /
        <strong> LMArena</strong> (Chiang, Zheng, Sheng et al. 2024) addresses this
        by collecting paired human preferences across millions of comparisons,
        producing Elo-style rankings that capture overall capability without
        committing to any specific task definition. The standardized-benchmark and
        human-preference traditions now run in parallel: benchmarks measure narrow
        capabilities precisely; arenas measure general capability noisily but
        holistically. Both have known failure modes, and the field uses them
        together.
      </p>

      <BenchmarkSaturation />

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

      <p style={prose}>
        The claim that datasets encode their creators' perspectives isn't
        abstract — it has been demonstrated repeatedly. Buolamwini &amp; Gebru's
        <strong> Gender Shades</strong> study (2018) measured commercial
        face-classification systems across demographic groups and found error
        rates up to 34 percentage points higher for darker-skinned women than
        for lighter-skinned men, a gap that traced directly back to training data
        composition. Bolukbasi et al. (2016) showed analogous patterns in word
        embeddings: vectors trained on general web text encoded
        "man:doctor :: woman:nurse"-style associations that propagated into any
        downstream system using those embeddings. These weren't subtle effects —
        they were structural, measurable, and widespread. Gebru, Morgenstern,
        Vecchione, Wortman Vaughan, Wallach, Daume &amp; Crawford's
        <em> Datasheets for Datasets</em> [6] proposed a documentation standard:
        every dataset should ship with a written specification of motivation,
        composition, collection process, recommended uses, and known limitations —
        the way every physical component ships with a datasheet.
        <strong> Model Cards</strong> (Mitchell, Wu, Zaldivar et al. 2019) extended
        the idea to trained models, recommending documentation of intended use
        cases, performance across demographic groups, and known failure modes.
        Adoption has been uneven, but the principle — that systems should ship
        with structured information about their limitations — has become normative
        across the field.
      </p>

      <DatasheetsFramework />

      <p style={prose}>
        Dataset bias has expanded from a research concern into a curation
        discipline. The <strong>LAION-5B</strong> dataset was rescinded and
        reissued in 2023 after researchers (David Thiel, Stanford Internet
        Observatory) discovered child sexual abuse material in the scraped image
        set — a finding that prompted a broad re-examination of "just scrape the
        web" as a defensible data strategy. <strong>Copyright</strong> concerns
        have produced active litigation (the New York Times v. OpenAI suit, the
        Getty Images v. Stability AI suit, ongoing book-piracy investigations)
        and have shifted the legal landscape under which large datasets are
        assembled. Opt-out registries, licensed data deals (publishers selling
        access to model trainers), and synthetic-data substitution are emerging
        as alternatives. The trajectory is clear: the era of scraping the open
        web at scale and asking forgiveness later is closing. What replaces it —
        paid licensing, synthetic generation, opt-in registries, deliberate
        curation — is being actively negotiated. The technical capability to train
        on internet-scale data has, in the span of a few years, produced a
        corresponding set of legal, ethical, and curatorial questions that the
        field is still working out.
      </p>

      <DatasetBias />

      {/* ── Citations ─────────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}

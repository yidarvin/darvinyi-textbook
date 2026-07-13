import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "./components/shared/ErrorBoundary";

// Lazy-load chapter routes so the initial bundle stays small —
// each chapter (with all its widgets) becomes its own chunk and only
// downloads when the user navigates into it.
const StatisticalLearning   = lazy(() => import("./pages/ch01/StatisticalLearning"));
const NeuralNetworks        = lazy(() => import("./pages/ch02/NeuralNetworks"));
const Optimization          = lazy(() => import("./pages/ch03/Optimization"));
const TrainingTechniques    = lazy(() => import("./pages/ch04/TrainingTechniques"));
const WordEmbeddings        = lazy(() => import("./pages/ch05/WordEmbeddings"));
const RNNs                  = lazy(() => import("./pages/ch06/RNNs"));
const Attention             = lazy(() => import("./pages/ch07/Attention"));
const Transformers          = lazy(() => import("./pages/ch08/Transformers"));
const LLMArchitectures      = lazy(() => import("./pages/ch09/LLMArchitectures"));
const LLMTraining           = lazy(() => import("./pages/ch10/LLMTraining"));
const Multimodal            = lazy(() => import("./pages/ch11/Multimodal"));
const ConvNets              = lazy(() => import("./pages/ch12/ConvNets"));
const GNNs                  = lazy(() => import("./pages/ch13/GNNs"));
const ReinforcementLearning = lazy(() => import("./pages/ch14/ReinforcementLearning"));
const CapsuleNetworks       = lazy(() => import("./pages/ch15/CapsuleNetworks"));
const VAEs                  = lazy(() => import("./pages/ch16/VAEs"));
const GANs                  = lazy(() => import("./pages/ch17/GANs"));
const ImageToImage          = lazy(() => import("./pages/ch18/ImageToImage"));
const DiffusionModels       = lazy(() => import("./pages/ch19/DiffusionModels"));
const Datasets              = lazy(() => import("./pages/ch20/Datasets"));
const AIAgents              = lazy(() => import("./pages/ch21/AIAgents"));
const AgentHarnesses        = lazy(() => import("./pages/ch22/AgentHarnesses"));

function ChapterFallback() {
  return (
    <div
      style={{
        maxWidth: "var(--chapter-max-width, 740px)",
        margin: "0 auto",
        padding: "var(--chapter-padding, 52px 44px 100px)",
        color: "var(--text-muted)",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "11px",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
    >
      Loading…
    </div>
  );
}

// Shown when a chapter's render throws, or its lazy chunk fails to fetch
// (e.g. a stale tab navigating to a chapter after a redeploy changed the
// chunk hashes) — a reload gets a fresh chunk manifest in the second case.
function ChapterErrorFallback() {
  return (
    <div
      style={{
        maxWidth: "var(--chapter-max-width, 740px)",
        margin: "0 auto",
        padding: "var(--chapter-padding, 52px 44px 100px)",
      }}
    >
      <div
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "15px",
          color: "var(--text-mid)",
          marginBottom: "16px",
        }}
      >
        This chapter failed to load.
      </div>
      <button
        type="button"
        onClick={() => window.location.reload()}
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "13px",
          color: "var(--accent)",
          background: "var(--accent-dim)",
          border: "1px solid var(--accent)",
          borderRadius: "6px",
          padding: "8px 16px",
          cursor: "pointer",
        }}
      >
        Reload
      </button>
    </div>
  );
}

function L(Element) {
  return (
    <ErrorBoundary fallback={<ChapterErrorFallback />}>
      <Suspense fallback={<ChapterFallback />}>
        <Element />
      </Suspense>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="ch/01" element={L(StatisticalLearning)} />
          <Route path="ch/02" element={L(NeuralNetworks)} />
          <Route path="ch/03" element={L(Optimization)} />
          <Route path="ch/04" element={L(TrainingTechniques)} />
          <Route path="ch/05" element={L(WordEmbeddings)} />
          <Route path="ch/06" element={L(RNNs)} />
          <Route path="ch/07" element={L(Attention)} />
          <Route path="ch/08" element={L(Transformers)} />
          <Route path="ch/09" element={L(LLMArchitectures)} />
          <Route path="ch/10" element={L(LLMTraining)} />
          <Route path="ch/11" element={L(Multimodal)} />
          <Route path="ch/12" element={L(ConvNets)} />
          <Route path="ch/13" element={L(GNNs)} />
          <Route path="ch/14" element={L(ReinforcementLearning)} />
          <Route path="ch/15" element={L(CapsuleNetworks)} />
          <Route path="ch/16" element={L(VAEs)} />
          <Route path="ch/17" element={L(GANs)} />
          <Route path="ch/18" element={L(ImageToImage)} />
          <Route path="ch/19" element={L(DiffusionModels)} />
          <Route path="ch/20" element={L(Datasets)} />
          <Route path="ch/21" element={L(AIAgents)} />
          <Route path="ch/22" element={L(AgentHarnesses)} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

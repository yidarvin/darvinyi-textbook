import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import StatisticalLearning from "./pages/ch01/StatisticalLearning";
import NeuralNetworks from "./pages/ch02/NeuralNetworks";
import Optimization from "./pages/ch03/Optimization";
import TrainingTechniques from "./pages/ch04/TrainingTechniques";
import WordEmbeddings from "./pages/ch05/WordEmbeddings";
import RNNs from "./pages/ch06/RNNs";
import Attention from "./pages/ch07/Attention";
import Transformers from "./pages/ch08/Transformers";
import LLMArchitectures from "./pages/ch09/LLMArchitectures";
import LLMTraining from "./pages/ch10/LLMTraining";
import Multimodal from "./pages/ch11/Multimodal";
import ConvNets from "./pages/ch12/ConvNets";
import GNNs from "./pages/ch13/GNNs";
import ReinforcementLearning from "./pages/ch14/ReinforcementLearning";
import CapsuleNetworks from "./pages/ch15/CapsuleNetworks";
import VAEs from "./pages/ch16/VAEs";
import GANs from "./pages/ch17/GANs";
import ImageToImage from "./pages/ch18/ImageToImage";
import DiffusionModels from "./pages/ch19/DiffusionModels";
import Datasets from "./pages/ch20/Datasets";
import AIAgents from "./pages/ch21/AIAgents";
import AgentHarnesses from "./pages/ch22/AgentHarnesses";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="ch/01" element={<StatisticalLearning />} />
          <Route path="ch/02" element={<NeuralNetworks />} />
          <Route path="ch/03" element={<Optimization />} />
          <Route path="ch/04" element={<TrainingTechniques />} />
          <Route path="ch/05" element={<WordEmbeddings />} />
          <Route path="ch/06" element={<RNNs />} />
          <Route path="ch/07" element={<Attention />} />
          <Route path="ch/08" element={<Transformers />} />
          <Route path="ch/09" element={<LLMArchitectures />} />
          <Route path="ch/10" element={<LLMTraining />} />
          <Route path="ch/11" element={<Multimodal />} />
          <Route path="ch/12" element={<ConvNets />} />
          <Route path="ch/13" element={<GNNs />} />
          <Route path="ch/14" element={<ReinforcementLearning />} />
          <Route path="ch/15" element={<CapsuleNetworks />} />
          <Route path="ch/16" element={<VAEs />} />
          <Route path="ch/17" element={<GANs />} />
          <Route path="ch/18" element={<ImageToImage />} />
          <Route path="ch/19" element={<DiffusionModels />} />
          <Route path="ch/20" element={<Datasets />} />
          <Route path="ch/21" element={<AIAgents />} />
          <Route path="ch/22" element={<AgentHarnesses />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

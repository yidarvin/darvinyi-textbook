import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import StatisticalLearning from "./pages/ch01/StatisticalLearning";
import NeuralNetworks from "./pages/ch02/NeuralNetworks";
import Optimization from "./pages/ch03/Optimization";
import TrainingTechniques from "./pages/ch04/TrainingTechniques";
import ConvNets from "./pages/ch05/ConvNets";
import RNNs from "./pages/ch06/RNNs";
import Attention from "./pages/ch07/Attention";
import Transformers from "./pages/ch08/Transformers";
import Multimodal from "./pages/ch09/Multimodal";
import CapsuleNetworks from "./pages/ch10/CapsuleNetworks";
import VAEs from "./pages/ch11/VAEs";
import GANs from "./pages/ch12/GANs";
import DiffusionModels from "./pages/ch13/DiffusionModels";
import GNNs from "./pages/ch14/GNNs";
import Datasets from "./pages/ch15/Datasets";
import ReinforcementLearning from "./pages/ch16/ReinforcementLearning";
import AIAgents from "./pages/ch17/AIAgents";

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
          <Route path="ch/05" element={<ConvNets />} />
          <Route path="ch/06" element={<RNNs />} />
          <Route path="ch/07" element={<Attention />} />
          <Route path="ch/08" element={<Transformers />} />
          <Route path="ch/09" element={<Multimodal />} />
          <Route path="ch/10" element={<CapsuleNetworks />} />
          <Route path="ch/11" element={<VAEs />} />
          <Route path="ch/12" element={<GANs />} />
          <Route path="ch/13" element={<DiffusionModels />} />
          <Route path="ch/14" element={<GNNs />} />
          <Route path="ch/15" element={<Datasets />} />
          <Route path="ch/16" element={<ReinforcementLearning />} />
          <Route path="ch/17" element={<AIAgents />} />
          {/* Add more as you build */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

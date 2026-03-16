import './App.css'
import ProductPage from './pages/productpage';
import CreateProductPage from './pages/createproductpage';
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProductPage />} />
        <Route path="/create-product" element={<CreateProductPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

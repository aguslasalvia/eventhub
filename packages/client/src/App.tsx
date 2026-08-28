import { BrowserRouter, Route, Routes } from "react-router"
import Home from "./pages/home"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route index path="/" element={<Home />} />
        <Route path="*" element={<h1>Not found</h1>} />
      </Routes>
    </BrowserRouter>
  )
}
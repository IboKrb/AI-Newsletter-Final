import { Routes, Route } from 'react-router'
import Home from './pages/Home'
import Login from "./pages/Login"
import Library from "./pages/Library"
import Admin from "./pages/Admin"
import NotFound from "./pages/NotFound"
import { Toaster } from "@/components/ui/sonner"

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/library" element={<Library />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster richColors position="top-right" closeButton />
    </>
  )
}

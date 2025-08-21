import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
// import { createBrowserRouter, RouterProvider } from 'react-router-dom'
// import Home from './pages/home.jsx'
// import BubbleMapArrow from './pages/bm-arrow.jsx'
// import BubbleMapNoArrow from './pages/bm-noarrow.jsx'

// const router = createBrowserRouter([
//   {
//     path: '',
//     element: <App />
//   },
//   {
//     path: '/Home',
//     element: <Home />
//   },
//   {
//     path: '/bm-no-arrow',
//     element: <BubbleMapNoArrow/>
//   },
//   {
//     path: '/bm-arrow',
//     element: <BubbleMapArrow/>
//   }
// ])

createRoot(document.getElementById('root')).render(
  // <StrictMode>
    <App />
  // </StrictMode>
)

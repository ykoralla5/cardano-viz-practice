import { useState } from 'react'
import './index.css'
// import Main from './components/Main'
import Header from './components/Header'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Home from './pages/home.jsx'
import BubbleMapArrow from './pages/bm-arrow.jsx'
import BubbleMapNoArrow from './pages/bm-noarrow.jsx'
import PoolPerformance from './pages/bm-pool-performance.jsx'

const router = createBrowserRouter([
  {
    path: '',
    element: <Home />
  },
  {
    path: '/Home',
    element: <Home />
  },
  {
    path: '/bm-no-arrow',
    element: <BubbleMapNoArrow/>
  },
  {
    path: '/bm-arrow',
    element: <BubbleMapArrow/>
  }, {
    path: '/pool-performance',
    element: <PoolPerformance/>
  }
])

export default function App() {

  return (
    <>
      <Header />
      <RouterProvider router={router}/>
    </>
  )
}

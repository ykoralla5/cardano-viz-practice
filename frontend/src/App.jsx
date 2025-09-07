import { useState } from 'react'
import './index.css'
// import Main from './components/Main'
import Header from './components/Header'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Home from './pages/home.jsx'
import BubbleMap from './pages/bm.jsx'
import About from './pages/about.jsx'

const router = createBrowserRouter([
  {
    path: '',
    element: <Home />
  },
  {
    path: '/home',
    element: <Home />
  },
  {
    path: '/explorer',
    element: <BubbleMap />
  },
  {
    path: '/about',
    element: <About />
  },
])

export default function App() {

  return (
    <>
      <Header />
      <RouterProvider router={router}/>
    </>
  )
}

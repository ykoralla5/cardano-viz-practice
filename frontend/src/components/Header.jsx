import { useState } from 'react'
import logoWhite from '../assets/cardano-logo-white.svg'
import logoBlue from '../assets/cardano-logo-blue.svg'
import { Link } from 'react-router-dom'

const navigation = [
    { name: 'Home', href: '/home'},
    { name: 'Explorer', href: '/explorer' },
    { name: 'About', href: '/about' }
]

export default function Header({  }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    
    return (
        <header className="h-[8.5vh] bg-gray-100 dark:bg-gray-800 flex justify-center shadow-md px-6 lg:px-8">
            <nav className="w-full mx-auto flex justify-between items-center" aria-label="Global">
                <div className="flex lg:flex-1">
                    <a href="/" className="flex items-center space-x-3 rtl:space-x-reverse">
                        <img src={logoWhite} className="h-8 w-auto" alt="Cardano Logo" />
                        <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">Cardano Blockchain Dashboard</span>
                    </a>
                </div>
                <div className="flex lg:hidden ml-auto">
                    <button data-collapse-toggle="navbar-default"
                        type="button"  
                        aria-controls="navbar-default" 
                        aria-expanded="false"
                        className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
                        onClick={() => setMobileMenuOpen(true)}
                    >
                        <span className="sr-only">Open main menu</span>
                    </button>
                </div>
                <div className="hidden lg:flex lg:flex-1 lg:justify-end gap-10" id="navbar-default">
                    {navigation.map((item) => (
                        <a
                            key={item.name}
                            href={item.href}
                            className="text-base font-medium text-gray-900 dark:text-white"
                        >{item.name}
                        </a>
                    ))}
                </div>
            </nav>
        </header>
   )
}
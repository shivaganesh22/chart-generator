import React, { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate } from "react-router-dom"
import { useAuth } from './other/AuthContext';
import { toastSuccess } from './components/Notifications';
export default function Header() {
  const [hidden, setHidden] = useState(true);
  const inActiveClass = "block py-2 px-3 lg:p-0 text-gray-900 rounded hover:bg-gray-100 lg:hover:bg-transparent lg:hover:text-blue-700 lg:dark:hover:text-blue-500 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white lg:dark:hover:bg-transparent dark:border-gray-700"
  const activeClass = "block  py-2 px-3 lg:p-0 text-white bg-blue-700 rounded lg:bg-transparent lg:text-blue-700 lg:dark:text-blue-500"
  const [darkMode, setDarkMode] = useState(JSON.parse(localStorage.getItem("darkMode")) || false);
  const { isLoggedIn, login, logout, storage, setStorage } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));

    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

  }, [darkMode]);
  useEffect(() => {
    setStorage(storage)
  },);




  return (
    <div >
      
    
      <nav className="bg-white border-b-2 border-gray-200 px-2 sm:px-4 dark:bg-gray-900 dark:border-b-1 dark:border-gray-900">
        <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
          <Link to="/" className="flex items-center space-x-3 rtl:space-x-reverse text-black dark:text-white  ">
            {/* <img src={logo_h} className="h-8" alt="rsgmovies Logo" /> */}
            Logo

          </Link>

          <div className="flex lg:order-2 space-x-3 lg:space-x-0 rtl:space-x-reverse">

            {/* <button onClick={() => setDarkMode(!darkMode)} data-tooltip-target="navbar-search-example-toggle-dark-mode-tooltip" type="button" data-toggle-dark="light" className="flex items-center p-2 mr-0 lg:mr-2 text-xs font-medium text-gray-700 bg-white rounded-lg border border-gray-200 toggle-dark-state-example hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-500 dark:bg-gray-800 focus:outline-none dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700">
              {darkMode ? (<svg aria-hidden="true" data-toggle-icon="sun" className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" fillRule="evenodd" clipRule="evenodd"></path></svg>) : (<svg aria-hidden="true" data-toggle-icon="moon" className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path></svg>)}
            </button> */}
           
            {isLoggedIn ? <button type="button" className="hidden lg:block text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800" onClick={() => { localStorage.removeItem('token'); logout(); toastSuccess("Logout Success"); navigate('/') }}>Logout</button>
              : <button type="button" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800" onClick={()=>{navigate('/login')}}>Login</button>
            }



            <button onClick={() => { setHidden(!hidden) }} data-collapse-toggle="navbar-cta" type="button" className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg lg:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600" aria-controls="navbar-cta" aria-expanded="false">
              <span className="sr-only">Open main menu</span>
              <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h15M1 7h15M1 13h15" />
              </svg>
            </button>
          </div>
          <div className={`items-center justify-between ${hidden ? "hidden" : ""} w-full lg:flex lg:w-auto lg:order-1`} id="navbar-cta">
            <ul className="flex flex-col font-medium p-4 lg:p-0 mt-4 border border-gray-100 rounded-lg bg-gray-50 lg:space-x-8 rtl:space-x-reverse lg:flex-row lg:mt-0 lg:border-0 lg:bg-white dark:bg-gray-800 lg:dark:bg-gray-900 dark:border-gray-700">
              <li>
                <NavLink to="/" className={({ isActive }) => isActive ? activeClass : inActiveClass} onClick={() => setHidden(!hidden)} end>Home</NavLink>
              </li>
              <li>
                <NavLink to="/saved" className={({ isActive }) => isActive ? activeClass : inActiveClass} onClick={() => setHidden(!hidden)}>Saved Charts</NavLink>
              </li>
              
              <li>
                <NavLink to="/dashboard" className={({ isActive }) => isActive ? activeClass : inActiveClass} onClick={() => setHidden(!hidden)}>Dashboard</NavLink>
              </li>
              
              <li>
                <NavLink to="/contact" className={({ isActive }) => isActive ? activeClass : inActiveClass} onClick={() => setHidden(!hidden)}>Contact Us</NavLink>
              </li>
              {isLoggedIn ? <li>
                <button type="button" className="block m-2 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800  lg:hidden" onClick={() => { localStorage.removeItem('token'); logout(); toastSuccess("Logout Success"); navigate('/'); setHidden(!hidden) }}>Logout  </button>
              </li> : ""}

            </ul>
          </div>
        </div>
      </nav>

    </div>
  )
}

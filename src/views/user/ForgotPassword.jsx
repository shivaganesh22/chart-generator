import React, { useState } from 'react'
import { toastSuccess, toastWarning } from '../components/Notifications';
import MyLoader from '../MyLoader'
import { useAuth } from '../other/AuthContext';
import { useNavigate, Link } from 'react-router-dom'
export default function ForgotPassword() {
    const { login, startLoad, stopLoad ,host } = useAuth();
    const navigate = useNavigate();
    const handleSubmit = async (e) => {
        e.preventDefault();
        startLoad();
            try {
                const response = await fetch(`${host}/api/forgotpassword/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({"email": e.target.email.value }),
                });
                const result = await response.json();
                if (response.status == 200) {
                    toastSuccess("Email sent successfully");
                    navigate('/login');
                }
                else {
                   toastWarning(result["error"])
                }

            } catch (error) {

            }
       
        stopLoad();
    }
    return (
        <main>


            <section className="">
                <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto ">

                    <div className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
                        <MyLoader>
                            <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
                                <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white text-center">
                                    Forgot Password
                                </h1>

                                <form className="max-w-sm mx-auto" onSubmit={handleSubmit}>
                                    
                                    <label htmlFor="email-address-icon" className="block my-2 text-sm font-medium text-gray-900 dark:text-white">Your Email</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                                            <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 16">
                                                <path d="m10.036 8.278 9.258-7.79A1.979 1.979 0 0 0 18 0H2A1.987 1.987 0 0 0 .641.541l9.395 7.737Z" />
                                                <path d="M11.241 9.817c-.36.275-.801.425-1.255.427-.428 0-.845-.138-1.187-.395L0 2.6V14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2.5l-8.759 7.317Z" />
                                            </svg>
                                        </div>
                                        <input type="email" name='email' id="email-address-icon" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Email" required />
                                    </div>
                                    <br />
                                    <center>
                                        <button type="submit" className="w-full text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800">Send mail</button>

                                    </center>
                                    <br />
                                    <p className="text-sm font-light text-gray-500 dark:text-gray-400">
                                        Already have an account ?  <Link to="/login" className="font-medium text-primary-600 hover:underline dark:text-primary-500">Login</Link>
                                    </p>
                                </form>



                            </div>
                        </MyLoader>
                    </div>

                </div>

            </section>
        </main>
    )
}

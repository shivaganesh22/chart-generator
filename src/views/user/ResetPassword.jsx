import React, { useState } from 'react'
import { toastSuccess, toastWarning } from '../components/Notifications';
import MyLoader from '../MyLoader'
import { useAuth } from '../other/AuthContext';
import { useNavigate, Link,useParams } from 'react-router-dom'
export default function ResetPassword() {
    const { login, startLoad, stopLoad ,host } = useAuth();
    const navigate = useNavigate();
    const params = useParams();

    const handleSubmit = async (e) => {
        e.preventDefault();
        startLoad();
        if (e.target.password1.value != e.target.password2.value) {
            toastWarning("Passwords doesnot match")
        }
        else{
            try {
                const response = await fetch(`${host}/api/resetpassword/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({"password": e.target.password1.value,"token":params.id }),
                });
                const result = await response.json();
                console.log(result);
                if (response.status == 200) {
                    toastSuccess("Password reset successfully");
                    navigate('/login');
                }
                else {
                   toastWarning(result["error"])
                }

            } catch (error) { }}
       
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
                                    Reset Password
                                </h1>

                                <form className="max-w-sm mx-auto" onSubmit={handleSubmit}>
                                    
                                   <div className="my-2">
                                        <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Create password</label>
                                        <input type="password" name="password1" className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-sm-light" required />
                                    </div>
                                    <div className="mb-5">
                                        <label htmlFor="repeat-password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Confirm password</label>
                                        <input type="password" name="password2" className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-sm-light" required />
                                    </div>
                                    <center>
                                        <button type="submit" className="w-full text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800">Reset Password</button>

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

import React, { useState ,useEffect} from 'react'
import { toastSuccess, toastWarning } from '../components/Notifications';
import MyLoader from '../MyLoader'
import { useAuth } from '../other/AuthContext';
import { useNavigate } from 'react-router-dom'
export default function Contact() {
    const { startLoad, stopLoad ,host} = useAuth();
    const navigate = useNavigate();
    useEffect(() => {
        if (localStorage.getItem('token') == null) { 
            navigate('/login'); 
            toastWarning("Please login first");
        }
    }, []);
    const handleSubmit = async (e) => {
        e.preventDefault();
        startLoad();
        try {
            const response = await fetch(`${host}/api/contact/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization':`Token ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                   
                    "subject": e.target.subject.value,
                    "message": e.target.message.value
                }),
            });
            const result = await response.json();
            if (response.status == 200) {
                toastSuccess("Form Submitted");
                navigate('/');
            }
            else {
                toastWarning("Failed to Submit")
            }

        } catch (error) {
            console.error('Error fetching data:', error);
        }
        stopLoad();
    }
    return (
        <main>
            <section className="">
                <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto">

                    <div className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
                        <MyLoader>
                            <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
                                <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white text-center">
                                    Report / Feedback
                                </h1>

                                <form className="max-w-sm mx-auto" onSubmit={handleSubmit}>
                                    
                                    <div class="mb-2">
                                        <label for="base-input" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Your Subject</label>
                                        <input type="text" name="subject" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder='Subject' />
                                    </div>
                                    <label for="message" class=" block mb-2 text-sm font-medium text-gray-900 dark:text-white">Your message</label>
                                    <textarea name="message" rows="4" class="mb-2 block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Message"></textarea>


                                    <center>
                                        <button type="submit" className="w-full text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800">Submit</button>

                                    </center>
                                    <br />

                                </form>



                            </div>
                        </MyLoader>
                    </div>

                </div>

            </section>
        </main>
    )
}

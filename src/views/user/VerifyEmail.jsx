import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../other/AuthContext';
import { toastSuccess, toastWarning } from '../components/Notifications';
import MyLoader from '../MyLoader';
export default function VerifyEmail() {
    const navigate = useNavigate();
    const { login, startLoad, stopLoad ,host } = useAuth();
    const params = useParams();
    const handleVerify = async () => {
        startLoad();
        try {
            const response = await fetch(`${host}/api/verifyemail/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ "token": params.id }),
            });

            const result = await response.json();
            if (response.status == 200) {
                navigate('/login');
                toastSuccess('Email Verified')
            }

            else {
                toastWarning(result["error"])
            }
        } catch (error) {

        }
        stopLoad();
    };
    return (
        <MyLoader>
        <main>
            
                <section className="flex flex-col justify-center px-2">
                    <div className="flex justify-center my-4">
                        <a onClick={() => { handleVerify() }}>
                            <button className="w-64 text-xl text-white bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 rounded-lg px-5 py-2.5 mr-2 mb-2 font-medium">Verify Email</button>
                        </a>
                    </div>
                </section>
            

        </main>
        </MyLoader>
    )
}

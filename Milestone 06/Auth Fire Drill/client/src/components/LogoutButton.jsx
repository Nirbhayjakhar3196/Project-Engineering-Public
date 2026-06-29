import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const LogoutButton = () => {
    const { logout, token } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {

        try {

            await axios.post(
                'http://localhost:5001/api/auth/logout',
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

        } catch (err) {
            console.log(err);
        }

        logout();
        navigate('/login');

    };

    return (
        <button
            onClick={handleLogout}
            className="btn btn-outline"
            style={{ width: 'auto', padding: '0.5rem 1.25rem' }}
        >
            Logout
        </button>
    );
};

export default LogoutButton;
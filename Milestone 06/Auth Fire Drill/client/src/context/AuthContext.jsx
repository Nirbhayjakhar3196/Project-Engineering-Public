
import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [role, setRole] = useState(null); // BROKEN PART 3: Storing role in localStorage

  useEffect(() => {

    if (token) {

        const decoded = jwtDecode(token);

        setRole(decoded.role);

        setUser({
            id: decoded.userId,
            role: decoded.role
        });

    }

}, [token]);

  const login = (data) => {
    localStorage.setItem("token", data.token);

    const decoded = jwtDecode(data.token);

    setToken(data.token);
    setRole(decoded.role);

    setUser({
        id: decoded.userId,
        role: decoded.role
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setRole(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

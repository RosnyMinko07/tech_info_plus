import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/theme.css';
import './styles/sweetalert-custom.css';
import { ThemeProvider } from './context/ThemeContext';

// Pages
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Articles from './pages/Articles';
import Fournisseurs from './pages/Fournisseurs';
import Devis from './pages/Devis';
import Facturation from './pages/Facturation';
import Comptoir from './pages/Comptoir';
import Stock from './pages/Stock';
import Inventaire from './pages/Inventaire';
import Reglements from './pages/Reglements';
import Avoirs from './pages/Avoirs';
import Utilisateurs from './pages/Utilisateurs';
import Rapports from './pages/Rapports';
import Configuration from './pages/Configuration';
import Bugs from './pages/Bugs';
import SignalerBug from './pages/SignalerBug';

// Composant de protection des routes
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  // Empêcher les nombres négatifs globalement
  useEffect(() => {
    const preventNegative = (e) => {
      if (e.target.type === 'number') {
        // Empêcher le signe moins, plus, et notation scientifique
        if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
          e.preventDefault();
        }
      }
    };

    const handlePaste = (e) => {
      if (e.target.type === 'number') {
        const pastedText = e.clipboardData.getData('text');
        if (pastedText.includes('-') || parseFloat(pastedText) < 0) {
          e.preventDefault();
        }
      }
    };

    const handleInput = (e) => {
      if (e.target.type === 'number' && parseFloat(e.target.value) < 0) {
        e.target.value = 0;
      }
    };

    // Ajouter les event listeners globaux
    document.addEventListener('keydown', preventNegative);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('input', handleInput);

    // Ajouter min="0" à tous les inputs type="number" existants
    const addMinAttribute = () => {
      const numberInputs = document.querySelectorAll('input[type="number"]');
      numberInputs.forEach(input => {
        if (!input.hasAttribute('min')) {
          input.setAttribute('min', '0');
        }
      });
    };

    addMinAttribute();

    // Observer pour les inputs ajoutés dynamiquement
    const observer = new MutationObserver(addMinAttribute);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener('keydown', preventNegative);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('input', handleInput);
      observer.disconnect();
    };
  }, []);

  return (
    <ThemeProvider>
      <Router>
        <div className="App">
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            closeOnClick
            pauseOnHover
            theme="dark"
          />
          
          <Routes>
            {/* Route racine redirige vers login */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* Route de connexion */}
            <Route path="/login" element={<Login />} />
            
            {/* Routes protégées avec Layout */}
            <Route
              path="/*"
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              {/* Routes principales */}
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="clients" element={<Clients />} />
              <Route path="articles" element={<Articles />} />
              <Route path="fournisseurs" element={<Fournisseurs />} />
              <Route path="devis" element={<Devis />} />
              <Route path="facturation" element={<Facturation />} />
              <Route path="comptoir" element={<Comptoir />} />
              <Route path="stock" element={<Stock />} />
              <Route path="inventaire" element={<Inventaire />} />
              <Route path="reglements" element={<Reglements />} />
              <Route path="avoirs" element={<Avoirs />} />
              <Route path="utilisateurs" element={<Utilisateurs />} />
              <Route path="rapports" element={<Rapports />} />
              <Route path="configuration" element={<Configuration />} />
              <Route path="bugs" element={<Bugs />} />
              <Route path="signaler-bug" element={<SignalerBug />} />
            </Route>
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
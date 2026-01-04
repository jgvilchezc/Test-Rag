import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Lock, Mail, Loader2 } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
            email,
            password,
        });
        if (error) throw error;
        alert('Registro exitoso! Por favor revisa tu correo para confirmar.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
      }
    } catch (error) {
        setError(error.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-transparent text-white p-4">
      {/* Background is handled by body in index.css */}
      <div className="w-full max-w-md p-8 space-y-8 glass-panel animate-fade-in relative z-10">
        <div className="text-center">
          <h2 className="text-4xl font-display font-bold tracking-tight text-white drop-shadow-md">
            {isSignUp ? 'Crear Cuenta' : 'Bienvenido'}
          </h2>
          <p className="mt-2 text-sm text-muted">
            {isSignUp ? 'Regístrate para comenzar' : 'Inicia sesión para acceder a tu RAG'}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleAuth}>
          <div className="space-y-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-muted group-focus-within:text-primary transition-colors" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input-field pl-10"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-muted group-focus-within:text-primary transition-colors" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="input-field pl-10"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="alert-error animate-fade-in">
                {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex justify-center py-3"
            >
              {loading ? (
                 <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                isSignUp ? 'Registrarse' : 'Iniciar Sesión'
              )}
            </button>
          </div>
        </form>
        
        <div className="text-center pt-2">
            <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-muted hover:text-white transition-colors"
            >
                {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
            </button>
        </div>
      </div>
    </div>
  );
}

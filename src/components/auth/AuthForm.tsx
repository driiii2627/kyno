'use client';

import { useState } from 'react';
import styles from './AuthForm.module.css';
import Turnstile from './Turnstile';
import { useRouter } from 'next/navigation';

interface AuthFormProps {
    loginCode: string;
    onLogin: (formData: FormData) => Promise<{ error?: string }>;
    onRegister: (formData: FormData) => Promise<{ error?: string; autoLogin?: boolean }>;
    siteKey: string;
}

export default function AuthForm({ loginCode, onLogin, onRegister, siteKey }: AuthFormProps) {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [token, setToken] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);
        formData.append('code', loginCode);

        try {
            if (mode === 'login') {
                const result = await onLogin(formData);
                if (result.error) {
                    setError(result.error);
                } else {
                    router.refresh();
                }
            } else {
                // Register Mode
                // Client-side Turnstile check for Register
                if (!token) {
                    setError('Por favor, complete a verificação de segurança.');
                    setLoading(false);
                    return;
                }

                if (token) formData.append('cf-turnstile-response', token);

                const result = await onRegister(formData);

                if (result.error) {
                    setError(result.error);
                    if (window.turnstile) {
                        window.turnstile.reset();
                        setToken('');
                    }
                } else {
                    // Register success
                    if (result.autoLogin) {
                        router.refresh();
                    } else {
                        // User needs to login manually
                        setMode('login');
                        setError('Conta criada com sucesso! Faça login para continuar.');
                        setPassword('');
                        if (window.turnstile) {
                            window.turnstile.reset();
                            setToken('');
                        }
                    }
                }
            }
        } catch (err) {
            setError('Ocorreu um erro inesperado. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Kyno+</h1>
                <p className={styles.subtitle}>Acesse sua conta para continuar</p>
            </header>

            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${mode === 'login' ? styles.activeTab : ''}`}
                    onClick={() => { setMode('login'); setError(null); }}
                >
                    Entrar
                </button>
                <button
                    className={`${styles.tab} ${mode === 'register' ? styles.activeTab : ''}`}
                    onClick={() => { setMode('register'); setError(null); }}
                >
                    Criar Conta
                </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>E-mail</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={styles.input}
                        placeholder="seu@email.com"
                        required
                    />
                </div>

                <div className={styles.inputGroup}>
                    <label className={styles.label}>Senha</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={styles.input}
                        placeholder="••••••••"
                        required
                        minLength={6}
                    />
                </div>

                {/* Turnstile is Mandatory for Register, Contextual for Login (simulated here) */}
                {(mode === 'register') && (
                    <div className={styles.turnstileWrapper}>
                        <Turnstile
                            siteKey={siteKey}
                            onVerify={(t) => setToken(t)}
                            theme="dark"
                        />
                    </div>
                )}

                {error && <div className={styles.error}>{error}</div>}

                <button type="submit" className={styles.submitButton} disabled={loading}>
                    {loading ? 'Processando...' : (mode === 'login' ? 'Acessar Painel' : 'Criar Conta')}
                </button>

                <p className={styles.helperText}>
                    {mode === 'login' ? 'Esqueceu a senha? Entre em contato com o suporte.' : 'Ao criar conta você concorda com os termos.'}
                </p>
            </form>
        </div>
    );
}

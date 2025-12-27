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
    const [success, setSuccess] = useState<string | null>(null);
    const router = useRouter();

    const calculatePasswordStrength = (pwd: string) => {
        let score = 0;
        if (!pwd) return { score, label: '', colorClass: '' };

        if (pwd.length >= 6) score++;
        if (pwd.length >= 10) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;

        // Max score 5
        if (score <= 2) return { score, label: 'Fraca', colorClass: styles.strengthWeak };
        if (score <= 3) return { score, label: 'Média', colorClass: styles.strengthFair };
        if (score <= 4) return { score, label: 'Boa', colorClass: styles.strengthGood };
        return { score, label: 'Excelente', colorClass: styles.strengthPerfect };
    };

    const strength = calculatePasswordStrength(password);
    const isPasswordStrongEnough = strength.score >= 3;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);

        // Security Checks
        if (!token) {
            setError('Por favor, complete a verificação de segurança.');
            setLoading(false);
            return;
        }

        if (mode === 'register' && !isPasswordStrongEnough) {
            setError('A senha precisa ser mais forte.');
            setLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);
        formData.append('code', loginCode);
        if (token) formData.append('cf-turnstile-response', token);

        try {
            if (mode === 'login') {
                const result = await onLogin(formData);
                if (result.error) {
                    setError(result.error);
                    // Reset token on error
                    if (window.turnstile) {
                        window.turnstile.reset();
                        setToken('');
                    }
                } else {
                    setSuccess('Bem vindo de volta! Redirecionando...');
                    setTimeout(() => {
                        router.refresh();
                    }, 1000);
                }
            } else {
                // Register Mode
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
                        setSuccess('Bem vindo! Redirecionando...');
                        setTimeout(() => {
                            router.refresh();
                        }, 1000);
                    } else {
                        // User needs to login manually
                        setMode('login');
                        setSuccess('Conta criada com sucesso! Faça login para continuar.');
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
            setLoading(false);
        } finally {
            if (!success) setLoading(false);
        }
    };

    const handleModeSwitch = (newMode: 'login' | 'register') => {
        setMode(newMode);
        setError(null);
        setSuccess(null);
        setToken('');
        if (window.turnstile) window.turnstile.reset();
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
                    onClick={() => handleModeSwitch('login')}
                >
                    Entrar
                </button>
                <button
                    className={`${styles.tab} ${mode === 'register' ? styles.activeTab : ''}`}
                    onClick={() => handleModeSwitch('register')}
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

                    {mode === 'register' && password.length > 0 && (
                        <div className={styles.strengthMeter}>
                            <div className={styles.strengthLabel}>
                                <span>Força da senha</span>
                                <span>{strength.label}</span>
                            </div>
                            <div className={styles.strengthBarBg}>
                                <div
                                    className={`${styles.strengthBarFill} ${strength.colorClass}`}
                                    style={{ width: `${(strength.score / 5) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className={styles.turnstileWrapper}>
                    <Turnstile
                        siteKey={siteKey}
                        onVerify={(t) => setToken(t)}
                        theme="dark"
                    />
                </div>

                {error && <div className={styles.error}>{error}</div>}

                {success && (
                    <div style={{
                        backgroundColor: 'rgba(34, 197, 94, 0.2)',
                        border: '1px solid #22c55e',
                        color: '#22c55e',
                        padding: '12px',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        marginBottom: '1rem',
                        textAlign: 'center'
                    }}>
                        {success}
                    </div>
                )}

                <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={
                        loading ||
                        !token ||
                        (mode === 'register' && !isPasswordStrongEnough)
                    }
                >
                    {loading ? 'Processando...' : (mode === 'login' ? 'Entrar' : 'Criar Conta')}
                </button>

                <p className={styles.helperText}>
                    {mode === 'login' ? 'Esqueceu a senha? Entre em contato com o suporte.' : 'Ao criar conta você concorda com os termos.'}
                </p>
            </form>
        </div>
    );
}

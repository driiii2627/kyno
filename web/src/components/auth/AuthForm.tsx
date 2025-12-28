'use client';

import { useState, useEffect } from 'react';
import styles from './AuthForm.module.css';
import Turnstile from './Turnstile';
import { useRouter } from 'next/navigation';

interface AuthFormProps {
    loginCode: string;
    onLogin: (formData: FormData) => Promise<{ error?: string; blockedUntil?: string }>;
    onRegister: (formData: FormData) => Promise<{ error?: string; autoLogin?: boolean; blockedUntil?: string }>;
    siteKey: string;
}

const ALLOWED_DOMAINS = ['gmail.com', 'outlook.com', 'hotmail.com', 'live.com', 'yahoo.com', 'icloud.com', 'proton.me', 'protonmail.com'];

export default function AuthForm({ loginCode, onLogin, onRegister, siteKey }: AuthFormProps) {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [token, setToken] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [blockedUntil, setBlockedUntil] = useState<Date | null>(null);
    const [timeLeft, setTimeLeft] = useState<string>('');

    const router = useRouter();

    // Rate Limit Timer
    useEffect(() => {
        if (!blockedUntil) return;

        const interval = setInterval(() => {
            const now = new Date();
            const diff = blockedUntil.getTime() - now.getTime();

            if (diff <= 0) {
                setBlockedUntil(null);
                setTimeLeft('');
                clearInterval(interval);
                return;
            }

            const minutes = Math.floor((diff / 1000 / 60) % 60);
            const seconds = Math.floor((diff / 1000) % 60);
            setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }, 1000);

        return () => clearInterval(interval);
    }, [blockedUntil]);

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

    const isEmailValid = (e: string) => {
        if (!e) return true;
        const domain = e.split('@')[1]?.toLowerCase();
        return ALLOWED_DOMAINS.includes(domain);
    };

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

        if (mode === 'register') {
            if (!isPasswordStrongEnough) {
                setError('A senha precisa ser mais forte.');
                setLoading(false);
                return;
            }
            if (!isEmailValid(email)) {
                setError('Domínio de e-mail não permitido (apenas Gmail, Outlook, Yahoo, etc).');
                setLoading(false);
                return;
            }
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
                    if (result.blockedUntil) {
                        setBlockedUntil(new Date(result.blockedUntil));
                    }
                    // Reset token on error
                    if (window.turnstile) {
                        window.turnstile.reset();
                        setToken('');
                    }
                } else {
                    setSuccess('Bem vindo de volta! Redirecionando...');
                    // Keep loading true to show overlay
                    setTimeout(() => {
                        router.push('/');
                    }, 2000); // 2s delay as requested
                    return;
                }
            } else {
                // Register Mode
                const result = await onRegister(formData);

                if (result.error) {
                    setError(result.error);
                    if (result.blockedUntil) {
                        setBlockedUntil(new Date(result.blockedUntil));
                    }
                    if (window.turnstile) {
                        window.turnstile.reset();
                        setToken('');
                    }
                } else {
                    // Register success
                    if (result.autoLogin) {
                        setSuccess('Bem vindo! Redirecionando...');
                        setTimeout(() => {
                            router.push('/');
                        }, 2000);
                        return;
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

    if (blockedUntil) {
        return (
            <div className={styles.container}>
                <div className={styles.rateLimitContainer}>
                    <div className={styles.timer}>{timeLeft}</div>
                    <p className={styles.timerLabel}>Muitas tentativas. Aguarde para tentar novamente.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Loading Overlay */}
            {success && (
                <div className={styles.loadingOverlay}>
                    <div className={styles.spinner}></div>
                    <div className={styles.loadingText}>Entrando...</div>
                </div>
            )}

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
                    {mode === 'register' && email && !isEmailValid(email) && (
                        <span style={{ fontSize: '0.75rem', color: '#eab308', marginTop: '4px' }}>
                            Apenas e-mails confiáveis (Gmail, Outlook, Yahoo...)
                        </span>
                    )}
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

                {/* We can hide the static success box if we have the overlay, or keep it. 
                    The overlay covers everything so this might not be seen, but good for 'Create Account' success */}
                {success && !success.includes('Redirecionando') && (
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
                        (mode === 'register' && (!isPasswordStrongEnough || !isEmailValid(email)))
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

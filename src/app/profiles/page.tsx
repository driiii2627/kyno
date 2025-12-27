'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Profiles.module.css';
import { getProfilesAction, createProfileAction, switchProfileAction, deleteProfileAction, updateProfileAction } from './actions';
import Turnstile from '@/components/auth/Turnstile';
import { User, Edit2, Plus, Trash2 } from 'lucide-react';

interface Profile {
    id: string;
    name: string;
    avatar_url: string;
}

const AVATARS = [
    // Famous Characters (TMDB High Res)
    'https://image.tmdb.org/t/p/w500/5weKu49pzJCt06OPpjvT80efnQj.jpg', // No Way Home Spider-Man
    'https://image.tmdb.org/t/p/w500/udDclJoHjfjb8JzDKgdHg2kT8pj.jpg', // Joker
    'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg', // Dark Knight Batman
    'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg', // Fight Club
    'https://image.tmdb.org/t/p/w500/8t882GWfgO72787x8j0TfC2d38.jpg', // Pulp Fiction (Mia)
    'https://image.tmdb.org/t/p/w500/saPqeb5rC7PQJv7g12r0sH2C0p.jpg', // Avengers (Iron Manish art)

    // Vibrant Avatars
    'https://api.dicebear.com/7.x/notionists/svg?seed=Felix',
    'https://api.dicebear.com/7.x/notionists/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Zoey',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Jack',
    'https://api.dicebear.com/7.x/micah/svg?seed=Milo',
    'https://api.dicebear.com/7.x/micah/svg?seed=Lola',

    // Classic
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Rocky',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Robot1',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Robot2'
];

export default function ProfilesPage() {
    const router = useRouter();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isManaging, setIsManaging] = useState(false);

    // Check for ?manage=true
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('manage') === 'true') {
            setIsManaging(true);
        }
    }, []);

    // View State: 'SELECT' | 'EDIT' | 'CREATE'
    const [view, setView] = useState<'SELECT' | 'EDIT' | 'CREATE'>('SELECT');

    // Form State
    const [editProfile, setEditProfile] = useState<Profile | null>(null);
    const [newName, setNewName] = useState('');
    const [newAvatar, setNewAvatar] = useState(AVATARS[0]);
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);

    // Auth/Status
    const [turnstileToken, setTurnstileToken] = useState('');
    const [createError, setCreateError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    // Granular Loading
    const [enteringProfileId, setEnteringProfileId] = useState<string | null>(null);

    useEffect(() => {
        loadProfiles();
    }, []);

    const loadProfiles = async () => {
        setLoading(true);
        const { profiles, error } = await getProfilesAction();
        if (profiles) setProfiles(profiles);
        setLoading(false);
    };

    const handleSelectProfile = async (id: string) => {
        if (enteringProfileId) return; // Debounce

        if (isManaging) {
            const profile = profiles.find(p => p.id === id);
            if (profile) {
                setEditProfile(profile);
                setNewName(profile.name);
                setNewAvatar(profile.avatar_url);
                setView('EDIT');
            }
            return;
        }

        setEnteringProfileId(id);
        const { success } = await switchProfileAction(id);

        if (success) {
            router.refresh();
            router.push('/');
        } else {
            setEnteringProfileId(null);
        }
    };

    const handleSave = async () => {
        setCreateError(null);
        if (!newName.trim()) {
            setCreateError('Digite um nome para o perfil.');
            return;
        }

        setProcessing(true);
        const formData = new FormData();
        formData.append('name', newName);
        formData.append('avatar', newAvatar);

        if (view === 'EDIT' && editProfile) {
            formData.append('id', editProfile.id);
            const result = await updateProfileAction(formData);
            if (result.error) {
                setCreateError(result.error);
            } else {
                await loadProfiles();
                setView('SELECT');
                setIsManaging(false);
            }
        } else {
            // CREATE
            if (!turnstileToken) {
                setCreateError('Complete a verificação de segurança.');
                setProcessing(false);
                return;
            }
            formData.append('cf-turnstile-response', turnstileToken);
            const result = await createProfileAction(formData);
            if (result.error) {
                setCreateError(result.error);
                if (window.turnstile) window.turnstile.reset();
                setTurnstileToken('');
            } else {
                await loadProfiles();
                setView('SELECT');
            }
        }
        setProcessing(false);
    };

    const deleteProfile = async () => {
        if (!editProfile) return;
        if (!confirm('Excluir este perfil permanentemente?')) return;

        await deleteProfileAction(editProfile.id);
        await loadProfiles();
        setView('SELECT');
        setIsManaging(false);
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
            </div>
        );
    }

    if (view === 'CREATE' || view === 'EDIT') {
        return (
            <div className={styles.container}>
                <div className={styles.editContainer}>
                    <div className={styles.editHeader}>
                        <h1 className={styles.editTitle}>
                            {view === 'EDIT' ? 'Editar Perfil' : 'Adicionar Perfil'}
                        </h1>
                        <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginTop: '0.5rem' }}>
                            {view === 'EDIT' ? 'Personalize seu espaço.' : 'Crie um espaço para outra pessoa.'}
                        </p>
                    </div>

                    <div className={styles.editContent}>
                        <div className={styles.editAvatarPreview}>
                            <img src={newAvatar} alt="Avatar" className={styles.previewImage} />
                            <div
                                className={styles.editIcon}
                                onClick={() => setShowAvatarPicker(true)}
                            >
                                <Edit2 size={24} />
                            </div>
                        </div>

                        <div className={styles.editForm}>
                            <div className={styles.inputGroup}>
                                <input
                                    className={styles.input}
                                    placeholder="Nome do Perfil"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    maxLength={20}
                                />
                            </div>

                            {view === 'CREATE' && (
                                <div className={styles.turnstileWrapper}>
                                    <Turnstile
                                        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                                        onVerify={setTurnstileToken}
                                        theme="dark"
                                    />
                                </div>
                            )}

                            {createError && <p style={{ color: '#ef4444', textAlign: 'center', fontSize: '0.9rem' }}>{createError}</p>}

                            <div className={styles.actionButtons}>
                                <button
                                    className={styles.saveButton}
                                    onClick={handleSave}
                                    disabled={processing}
                                >
                                    {processing ? 'Salvando...' : 'Salvar'}
                                </button>
                                <button
                                    className={styles.cancelButton}
                                    onClick={() => {
                                        setView('SELECT');
                                        setCreateError(null);
                                    }}
                                >
                                    Cancelar
                                </button>

                                {view === 'EDIT' && (
                                    <button
                                        onClick={deleteProfile}
                                        className={styles.deleteButton}
                                    >
                                        Excluir Perfil
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {showAvatarPicker && (
                    <div className={styles.pickerOverlay}>
                        <div className={styles.pickerHeader}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }} onClick={() => setShowAvatarPicker(false)}>
                                <span style={{ color: '#fff', fontSize: '1.5rem' }}>←</span>
                                <h2 style={{ fontSize: '2rem', margin: 0, fontWeight: 500 }}>Escolher Avatar</h2>
                            </div>
                        </div>
                        <div className={styles.pickerGrid}>
                            {AVATARS.map((av, idx) => (
                                <img
                                    key={idx}
                                    src={av}
                                    className={styles.pickerItem}
                                    onClick={() => {
                                        setNewAvatar(av);
                                        setShowAvatarPicker(false);
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Quem está assistindo?</h1>

            <div className={styles.profileGrid}>
                {profiles.map(profile => (
                    <div
                        key={profile.id}
                        className={styles.profileCard}
                        onClick={() => handleSelectProfile(profile.id)}
                        style={{ opacity: enteringProfileId && enteringProfileId !== profile.id ? 0.3 : 1 }}
                    >
                        <div className={styles.avatarWrapper}>
                            <img src={profile.avatar_url} alt={profile.name} className={styles.avatar} />
                            {isManaging && (
                                <div className={styles.editOverlay}>
                                    <Edit2 size={32} />
                                </div>
                            )}
                            {enteringProfileId === profile.id && (
                                <div className={styles.cardSpinner}>
                                    <div className={styles.spinnerSmall}></div>
                                </div>
                            )}
                        </div>
                        <span className={styles.profileName}>{enteringProfileId === profile.id ? 'Entrando...' : profile.name}</span>
                    </div>
                ))}

                {profiles.length < 3 && !isManaging && (
                    <div
                        className={styles.profileCard}
                        onClick={() => {
                            setNewName('');
                            setNewAvatar(AVATARS[0]);
                            setTurnstileToken('');
                            setView('CREATE');
                        }}
                    >
                        <div className={styles.addButton}>
                            <Plus size={64} />
                        </div>
                        <span className={styles.profileName}>Adicionar</span>
                    </div>
                )}
            </div>

            <button
                className={styles.manageButton}
                onClick={() => setIsManaging(!isManaging)}
            >
                {isManaging ? 'Concluído' : 'Gerenciar Perfis'}
            </button>
        </div>
    );
}

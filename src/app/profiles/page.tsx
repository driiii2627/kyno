'use client';

import { useState, useEffect } from 'react';
// Remove useRouter for switching, but keep for other Nav if needed. 
// Actually switchProfileAction redirects server-side now.
// We might need it for forceful refresh if needed, but let's try clean first.
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

// Extended Avatar List
const AVATARS = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Zack',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Sky',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Lilith',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Rocky',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Shadow',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Nala',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Simba',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Coco',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Pepper',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Buster',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Oreo',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie'
];

export default function ProfilesPage() {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isManaging, setIsManaging] = useState(false);

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

        // Switch Profile Logic
        // Server action handles redirect('/');
        await switchProfileAction(id);
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
                <p style={{ marginTop: '1rem', color: '#666' }}>Carregando perfis...</p>
            </div>
        );
    }

    // RENDER: CREATE or EDIT View (Full Page)
    if (view === 'CREATE' || view === 'EDIT') {
        return (
            <div className={styles.container}>
                <div className={styles.editContainer}>
                    <div className={styles.editHeader}>
                        <h1 className={styles.editTitle}>
                            {view === 'EDIT' ? 'Editar Perfil' : 'Adicionar Perfil'}
                        </h1>
                        <p style={{ color: '#808080', fontSize: '1.2rem' }}>
                            {view === 'EDIT' ? 'Personalize as configurações do perfil.' : 'Crie um perfil para outra pessoa assistir.'}
                        </p>
                    </div>

                    <div className={styles.editContent}>
                        {/* Right: Avatar Preview (Mobile: Top) */}
                        <div className={styles.editAvatarPreview}>
                            <img src={newAvatar} alt="Avatar" className={styles.previewImage} />
                            <div
                                className={styles.editIcon}
                                onClick={() => setShowAvatarPicker(true)}
                            >
                                <Edit2 size={18} />
                            </div>
                        </div>

                        {/* Left: Inputs */}
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

                            {/* Turnstile only for Create */}
                            {view === 'CREATE' && (
                                <div style={{ background: '#000', padding: '10px', display: 'flex', justifyContent: 'center' }}>
                                    <Turnstile
                                        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                                        onVerify={setTurnstileToken}
                                        theme="dark"
                                    />
                                </div>
                            )}

                            {createError && <p style={{ color: '#e50914' }}>{createError}</p>}

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
                                        style={{
                                            background: 'transparent',
                                            border: '1px solid #e50914',
                                            color: '#e50914',
                                            padding: '0.8rem 2rem',
                                            textTransform: 'uppercase',
                                            cursor: 'pointer',
                                            marginLeft: 'auto'
                                        }}
                                    >
                                        Excluir Perfil
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Avatar Picker Overlay */}
                {showAvatarPicker && (
                    <div className={styles.pickerOverlay}>
                        <div className={styles.pickerHeader}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <button onClick={() => setShowAvatarPicker(false)} style={{ color: '#fff', fontSize: '1.5rem' }}>←</button>
                                <h2 style={{ fontSize: '2rem', margin: 0 }}>Escolher Avatar</h2>
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

    // RENDER: SELECT View (Default)
    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Quem está assistindo?</h1>

            <div className={styles.profileGrid}>
                {profiles.map(profile => (
                    <div
                        key={profile.id}
                        className={styles.profileCard}
                        onClick={() => handleSelectProfile(profile.id)}
                    >
                        <div className={styles.avatarWrapper}>
                            <img src={profile.avatar_url} alt={profile.name} className={styles.avatar} />
                            {isManaging && (
                                <div className={styles.editOverlay}>
                                    <Edit2 size={32} />
                                </div>
                            )}
                        </div>
                        <span className={styles.profileName}>{profile.name}</span>
                    </div>
                ))}

                {/* Add Profile Button */}
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

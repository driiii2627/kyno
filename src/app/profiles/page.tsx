'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Profiles.module.css';
import { getProfilesAction, createProfileAction, switchProfileAction, deleteProfileAction, updateProfileAction } from './actions';
import Turnstile from '@/components/auth/Turnstile';

interface Profile {
    id: string;
    name: string;
    avatar_url: string;
}

const AVATARS = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Zack',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Sky',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Lilith'
];

export default function ProfilesPage() {
    const router = useRouter();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isManaging, setIsManaging] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Create/Edit Profile Form State
    const [editProfile, setEditProfile] = useState<Profile | null>(null);
    const [newName, setNewName] = useState('');
    const [newAvatar, setNewAvatar] = useState(AVATARS[0]);
    const [turnstileToken, setTurnstileToken] = useState('');
    const [createError, setCreateError] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        loadProfiles();
    }, []);

    const loadProfiles = async () => {
        const { profiles, error } = await getProfilesAction();
        if (profiles) {
            setProfiles(profiles);
        }
        setLoading(false);
    };

    const handleSelectProfile = async (id: string) => {
        if (isManaging) {
            // Open Edit Modal
            const profile = profiles.find(p => p.id === id);
            if (profile) {
                setNewName(profile.name);
                setNewAvatar(profile.avatar_url);
                setEditProfile(profile);
                setShowCreateModal(true);
            }
            return;
        }

        const { success } = await switchProfileAction(id);
        if (success) {
            router.push('/');
        }
    };

    const handleSaveProfile = async () => {
        setCreateError(null);
        if (!newName.trim()) {
            setCreateError('Digite um nome para o perfil.');
            return;
        }

        setCreating(true);
        const formData = new FormData();
        formData.append('name', newName);
        formData.append('avatar', newAvatar);

        if (editProfile) {
            // Update Mode
            formData.append('id', editProfile.id);
            const result = await updateProfileAction(formData);

            if (result.error) {
                setCreateError(result.error);
            } else {
                await loadProfiles();
                handleCloseModal();
            }
        } else {
            // Create Mode
            if (!turnstileToken) {
                setCreateError('Complete a verificação de segurança.');
                setCreating(false);
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
                handleCloseModal();
            }
        }
        setCreating(false);
    };

    const handleCloseModal = () => {
        setShowCreateModal(false);
        setEditProfile(null);
        setNewName('');
        setCreateError(null);
        setTurnstileToken('');
        if (window.turnstile) window.turnstile?.reset();
    };

    const handleDeleteProfile = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Tem certeza que deseja excluir este perfil?')) return;

        await deleteProfileAction(id);
        await loadProfiles();
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div style={{ color: '#fff' }}>Carregando perfis...</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>{isManaging ? 'Gerenciar Perfis' : 'Quem está assistindo?'}</h1>

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
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: 0, left: 0, right: 0, bottom: 0,
                                        background: 'rgba(0,0,0,0.6)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#fff',
                                        flexDirection: 'column',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <span style={{ fontSize: '2rem' }}>✎</span>
                                    <span style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Editar</span>

                                    {/* Delete Button overlaid */}
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: '5px',
                                            right: '5px',
                                            background: 'red',
                                            borderRadius: '50%',
                                            width: '24px',
                                            height: '24px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.8rem',
                                            cursor: 'pointer'
                                        }}
                                        onClick={(e) => handleDeleteProfile(profile.id, e)}
                                    >
                                        X
                                    </div>
                                </div>
                            )}
                        </div>
                        <span className={styles.profileName}>{profile.name}</span>
                    </div>
                ))}

                {profiles.length < 3 && !isManaging && (
                    <div
                        className={styles.profileCard}
                        onClick={() => {
                            setEditProfile(null);
                            setNewName('');
                            setShowCreateModal(true);
                        }}
                    >
                        <div className={`${styles.avatarWrapper} ${styles.addButton}`}>
                            +
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

            {/* Create/Edit Modal */}
            {showCreateModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2 className={styles.modalTitle}>{editProfile ? 'Editar Perfil' : 'Adicionar Perfil'}</h2>

                        <div className={styles.actionButtons} style={{ justifyContent: 'center' }}>
                            <img src={newAvatar} alt="Preview" style={{ width: 100, height: 100, borderRadius: '50%' }} />
                        </div>

                        <div>
                            <label style={{ color: '#808080', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>Escolha um avatar:</label>
                            <div className={styles.avatarGrid}>
                                {AVATARS.map((av, idx) => (
                                    <img
                                        key={idx}
                                        src={av}
                                        className={`${styles.gridAvatar} ${newAvatar === av ? styles.selected : ''}`}
                                        onClick={() => setNewAvatar(av)}
                                    />
                                ))}
                            </div>
                        </div>

                        <input
                            className={styles.input}
                            placeholder="Nome"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            maxLength={15}
                        />

                        {/* Turnstile - Only for Creation */}
                        {!editProfile && (
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <Turnstile
                                    siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                                    onVerify={setTurnstileToken}
                                    theme="dark"
                                />
                            </div>
                        )}

                        {createError && <p style={{ color: '#ef4444', textAlign: 'center' }}>{createError}</p>}

                        <div className={styles.actionButtons}>
                            <button
                                className={styles.saveButton}
                                onClick={handleSaveProfile}
                                disabled={creating || (!editProfile && !turnstileToken)}
                            >
                                {creating ? 'Processando...' : 'Salvar'}
                            </button>
                            <button
                                className={styles.cancelButton}
                                onClick={handleCloseModal}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

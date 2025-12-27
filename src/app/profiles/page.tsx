'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Profiles.module.css';
import { getProfilesAction, createProfileAction, switchProfileAction, deleteProfileAction, updateProfileAction } from './actions';
import Turnstile from '@/components/auth/Turnstile';
import { User, Edit2, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/ToastContext';

interface Profile {
    id: string;
    name: string;
    avatar_url: string;
}

const AVATAR_CATEGORIES = {
    'Stranger Things': [
        'https://i.ibb.co/N6x3VF66/AAAABSo-jd-QDT6-VMJr7-Va-Lx-XSAWia-Dwya15-Zpqe7r5-z-Iwc8-Y70d2p3a-RC-r-Kk-LCxgak-AKf-lj-VW1-Uma-fx-R06es.png',
        'https://i.ibb.co/ndBXZMf/AAAABULyt-B835457fm5-Y0-T4-E52fuj-CDj-IMKzkqrk-T9v-UXg-Avxq-LXz26t-Ct-DJGG5-KMCpe-UFc-IJc-BDh-Pl-VKaws-Z.png',
        'https://i.ibb.co/0jQPBLHs/AAAABby-CFMx-Hi-QFn-Flr-HYnwm-Jcam-LTSWqz-M8-W-r1t-Sg1-NL51m-Cu8v-m-GIJLmdj-N3g-W-6-SN3-Fi8l-Yl-Xl-ZHY83.png',
        'https://i.ibb.co/ycvdGVDM/AAAABZ1-Xom-GA7-Sa-DOQ4w-Xc-U-Jky-Hq-Zjz-PBZHj-D57k-Lt-Uw-YOKt-Ym8-MXX7-OU54kg-z-QT-f-RWv-UDj3-QTq5-ZVXf-S.png'
    ],
    'Lucifer': [
        'https://i.ibb.co/dwNB3356/AAAABZTO6i-Ld-MK66-Sb-Fd-LYOsu-WNQSy-Ua-FD8-GPNp-Auhn2-U7s-Ufv95jj5-Kb7-Gqr6-CSayp-CIj-Oi7ldgq-JPejm-XVud.png',
        'https://i.ibb.co/gFMWK0k1/AAAABW75gw1fd6-E-71-Wu7xy-PYjr-Wov-Pjv-Fy-Qt8e1x-Qy44c-Rj-Yqd-TVWc947w-ZWX089gg-XDRzxg-a-Ubb-Y8-Bo-H2-TA.png',
        'https://i.ibb.co/s9jYxdSw/AAAABTRrsz-1ts-M-2m-bz-EY8s-VHp3-NZKYjuf-MMy-X8p63x-MM5a-Nza3kluw3-ccux-MNPJ5ft-TOv-Nczlx-D094-Www-Div.png'
    ],
    'The Witcher': [
        'https://i.ibb.co/4w14nd6F/AAAABe-QVP3-Hvz-LKP1d-E6-BP5-BAkvs4-f-JKzj5p-IAyo-B4-Fld25dl-DAAQ-MW8-Wy2-O-L2qs-U5l-CENVQjr-LRFQmcyam-Pgn.png',
        'https://i.ibb.co/NndGNKM0/AAAABb8b7-p43y-Jw3j-AQF6p-TNc4-F0rkv-BXb-LZAKZsc-Usw-VI-X2-Avtjdox-BSMyw-Hk-FQmv9-MIhe-m-Hy-IJxghqj-M5-S.png',
        'https://i.ibb.co/1YZ0bWQs/AAAABd-GOg-Or-DX96v-Yc-S8x-UKBfaf-HTDP2-Qx-Ohl-IIar-O3le-G8-Tl-KFQ9-Vlmn6mz-AJJQBOhcj5-UL8f-Tz-Kz-TTPS2.png'
    ],
    'Outer Banks': [
        'https://i.ibb.co/LdjFTSF9/AAAABb-CTHBMt-KGXNw6u-U1lip-XZii9-N8-SAdql-Gsfj-UUO6bn-Sda152-Fbr1m25k-G6a-Iqcng-Hk-LRk-ODT6b8g2u-Hx9o.png',
        'https://i.ibb.co/H9gxvhx/AAAABckq-Qwm-ATm-FM6-XMGph7d-Lk-Qg0i1r0h-Ak8h-Wam5-RFAJDx-N05ua-QHQh-Xo1z5-B-t-Sgxu4-UZRIFv-Gju-Ko-Mb4j.png',
        'https://i.ibb.co/3Yd1hqHT/AAAABQb-L2f20m-GC4-Y859-IVbe-JCy-WZFe-Pl-Gc-BKlzbe-WLRFwz-Ul76ci-P1p-OO8j-KAXi-PWu-BPHepb-V2b-sk-L84z.png',
        'https://i.ibb.co/C5fQ9Z68/AAAABc5zk4i-Uqh-CDL4k-N0i-H3n-Zjyg-jzv-KNBib-MQsv0-Nb-ZR2qn-O46-Esg-Vs-MP8-ITwvt-Na-BMWTfnse-YEIss-Ii7-D.png'
    ],
    'La Casa de Papel': [
        'https://i.ibb.co/nqPfS4d6/AAAABVrl86-Z63fibn4z-JIZE1g-W3-JGr-ric40bd-TPDk3j-GUSS-Nb-Zwb6b-Uo-Gj-He-D3k-HMREUPTtcy-Hum-Ui-MDVp13y.png',
        'https://i.ibb.co/678mhcFR/AAAABZbs-Wc-BAKful-E6f-F1-Lmh-El1fr7x-Kkj-Dnoa-TCE0-Tg-Y4-PMr22-Sswku-Ljgaya-GKm-A740if-Ua-BA63-T-FF-6-Ca.png'
    ],
    'Original Kyno+': [
        'https://api.dicebear.com/7.x/notionists/svg?seed=Felix',
        'https://api.dicebear.com/7.x/notionists/svg?seed=Aneka',
        'https://api.dicebear.com/7.x/adventurer/svg?seed=Zoey',
        'https://api.dicebear.com/7.x/adventurer/svg?seed=Jack',
        'https://api.dicebear.com/7.x/micah/svg?seed=Milo',
        'https://api.dicebear.com/7.x/micah/svg?seed=Lola',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Rocky',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
        'https://api.dicebear.com/7.x/bottts/svg?seed=Robot1',
        'https://api.dicebear.com/7.x/bottts/svg?seed=Robot2'
    ]
};

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
    const [newAvatar, setNewAvatar] = useState(AVATAR_CATEGORIES['Original Kyno+'][0]);
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);

    // Auth/Status
    const [turnstileToken, setTurnstileToken] = useState('');
    const [processing, setProcessing] = useState(false);
    const toast = useToast();

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
            toast.error('Erro ao acessar perfil.');
        }
    };

    const handleSave = async () => {
        if (!newName.trim()) {
            toast.error('Digite um nome para o perfil.');
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
                toast.error(result.error);
            } else {
                toast.success('Perfil atualizado com sucesso!');
                await loadProfiles();
                setView('SELECT');
                setIsManaging(false);
            }
        } else {
            // CREATE
            if (!turnstileToken) {
                toast.error('Complete a verificação de segurança.');
                setProcessing(false);
                return;
            }
            formData.append('cf-turnstile-response', turnstileToken);
            const result = await createProfileAction(formData);
            if (result.error) {
                toast.error(result.error);
                if (window.turnstile) window.turnstile.reset();
                setTurnstileToken('');
            } else {
                toast.success('Perfil criado com sucesso!');
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
                        <div className={styles.pickerScrollContent}>
                            {Object.entries(AVATAR_CATEGORIES).map(([category, urls]) => (
                                <div key={category} className={styles.categorySection}>
                                    <h3 className={styles.categoryTitle}>{category}</h3>
                                    <div className={styles.pickerGrid}>
                                        {urls.map((av, idx) => (
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
                            setNewAvatar(AVATAR_CATEGORIES['Original Kyno+'][0]);
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

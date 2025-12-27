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

// ... imports
import { getDominantColor } from '@/utils/colors';

// Feature Flag
const ENABLE_DYNAMIC_THEME = true;

// ... Profile interface ...

// ... AVATAR_CATEGORIES ...

export default function ProfilesPage() {
    const router = useRouter();
    // ... existing state ...
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isManaging, setIsManaging] = useState(false);

    // Dynamic Theme State
    const [themeColor, setThemeColor] = useState<string>('');

    // ... useEffect for loadProfiles ...

    // Effect for "Create/Edit" mode dynamic color
    useEffect(() => {
        if (!ENABLE_DYNAMIC_THEME) return;

        // If in create or edit view, use the newAvatar
        if ((view === 'CREATE' || view === 'EDIT') && newAvatar) {
            getDominantColor(newAvatar).then(color => {
                if (color) setThemeColor(color);
            });
        }
        // If in Select mode, reset or default?
        // Let's reset to default dark blue/black when selecting
        else {
            setThemeColor('');
        }
    }, [newAvatar, view]);


    // ... functions ...

    // Background Style
    const backgroundStyle = themeColor
        ? { background: `radial-gradient(circle at center, ${themeColor} 0%, #020617 100%)` }
        : {}; // Fallback to CSS default

    if (loading) {
        return ( // ... existing loading
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
            </div>
        );
    }

    if (view === 'CREATE' || view === 'EDIT') {
        return (
            <div className={styles.container} style={backgroundStyle}>
                {/* ... existing edit content ... */}
                <div className={styles.editContainer}>
                    {/* ... */}
                    <div className={styles.editContent}>
                        {/* ... Avatar Preview etc using newAvatar ... */}
                        <div className={styles.editAvatarPreview}>
                            <img
                                src={newAvatar}
                                alt="Avatar"
                                className={styles.previewImage}
                                crossOrigin="anonymous" // Important for canvas
                            />
                            {/* ... */}
                        </div>
                        {/* ... */}
                    </div>
                </div>
                {/* ... picker overlay ... */}
            </div>
        );
    }

    return (
        <div className={styles.container}> {/* Select View doesn't need dynamic theme yet, unless requested for hover? User said "when creating/managing" context mostly */}
            <h1 className={styles.title}>Quem está assistindo?</h1>
            {/* ... profiles grid ... */}
            {profiles.length < 3 && !isManaging && (
                <div
                    className={styles.profileCard}
                    onClick={() => {
                        setNewName('');
                        const defaultAvatar = AVATAR_CATEGORIES['Original Kyno+'][0];
                        setNewAvatar(defaultAvatar);
                        setTurnstileToken('');
                        setView('CREATE');
                    }}
                >
                    {/* ... */}
                </div>
            )}

            {/* ... button ... */}
        </div>
    );
}

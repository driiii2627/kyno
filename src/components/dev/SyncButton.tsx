'use client';

import { useState } from 'react';
import { seedDatabase } from '@/app/actions';
import { Loader2, Database, Check } from 'lucide-react';

export default function SyncButton() {
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    const handleSync = async () => {
        setLoading(true);
        try {
            await seedDatabase();
            setDone(true);
            // Refresh page to show new content
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (e) {
            console.error("Sync failed", e);
            alert("Erro ao sincronizar. Verifique o console.");
        } finally {
            setLoading(false);
        }
    };

    if (done) {
        return (
            <div style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                zIndex: 9999,
                backgroundColor: '#22c55e',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                fontWeight: 'bold'
            }}>
                <Check size={20} />
                Sincronizado!
            </div>
        );
    }

    return (
        <button
            onClick={handleSync}
            disabled={loading}
            style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                zIndex: 9999,
                backgroundColor: '#ef4444', // Red for visibility
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                fontWeight: 'bold',
                transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
        >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Database size={20} />}
            {loading ? 'Sincronizando...' : 'Forçar Sync (15 Filmes)'}
        </button>
    );
}

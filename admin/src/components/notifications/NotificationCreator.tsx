'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Plus, Trash2, Smartphone, Monitor, Send, Eye } from 'lucide-react';

interface ActionButton {
    label: string;
    url: string;
    color: string;
    style: 'solid' | 'outline';
}

export function NotificationCreator({ onSuccess }: { onSuccess: () => void }) {
    const supabase = createClient();
    const [loading, setLoading] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [type, setType] = useState('info');
    const [targetAudience, setTargetAudience] = useState('all');
    const [actionButtons, setActionButtons] = useState<ActionButton[]>([]);

    // Button Entry State
    const [newBtnLabel, setNewBtnLabel] = useState('');
    const [newBtnUrl, setNewBtnUrl] = useState('');
    const [newBtnColor, setNewBtnColor] = useState('#ffffff');

    const handleAddButton = () => {
        if (!newBtnLabel || !newBtnUrl) return;
        setActionButtons([...actionButtons, {
            label: newBtnLabel,
            url: newBtnUrl,
            color: newBtnColor,
            style: 'solid'
        }]);
        setNewBtnLabel('');
        setNewBtnUrl('');
        setNewBtnColor('#ffffff');
    };

    const removeButton = (index: number) => {
        setActionButtons(actionButtons.filter((_, i) => i !== index));
    };

    const handleSend = async () => {
        if (!title || !message) return;
        setLoading(true);

        try {
            const { error } = await supabase.from('notifications').insert({
                title,
                message,
                image_url: imageUrl || null,
                action_buttons: actionButtons,
                type,
                target_audience: targetAudience,
                is_active: true
            });

            if (error) throw error;

            // Reset Form
            setTitle('');
            setMessage('');
            setImageUrl('');
            setActionButtons([]);
            alert('Notificação enviada com sucesso!');
            onSuccess();
        } catch (err) {
            console.error(err);
            alert('Erro ao enviar notificação.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Editor Column */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <Send size={20} className="text-blue-400" />
                    Criar Notificação
                </h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs uppercase text-zinc-500 font-bold mb-1">Título</label>
                        <input
                            type="text"
                            className="w-full bg-black/50 border border-zinc-700 rounded p-3 text-white focus:border-blue-500 outline-none"
                            placeholder="Ex: Nova Temporada Disponível!"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-xs uppercase text-zinc-500 font-bold mb-1">Mensagem</label>
                        <textarea
                            className="w-full bg-black/50 border border-zinc-700 rounded p-3 text-white focus:border-blue-500 outline-none h-24"
                            placeholder="Escreva algo engajador..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-xs uppercase text-zinc-500 font-bold mb-1">Imagem URL</label>
                        <input
                            type="text"
                            className="w-full bg-black/50 border border-zinc-700 rounded p-3 text-white focus:border-blue-500 outline-none"
                            placeholder="https://..."
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs uppercase text-zinc-500 font-bold mb-1">Tipo</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full bg-black/50 border border-zinc-700 rounded p-3 text-white outline-none"
                            >
                                <option value="info">Informação</option>
                                <option value="warning">Aviso</option>
                                <option value="promo">Promoção</option>
                                <option value="update">Atualização</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs uppercase text-zinc-500 font-bold mb-1">Público</label>
                            <select
                                value={targetAudience}
                                onChange={(e) => setTargetAudience(e.target.value)}
                                className="w-full bg-black/50 border border-zinc-700 rounded p-3 text-white outline-none"
                            >
                                <option value="all">Todos</option>
                                <option value="premium">Premium</option>
                                <option value="free">Gratuito</option>
                            </select>
                        </div>
                    </div>

                    {/* Action Buttons Builder */}
                    <div className="pt-4 border-t border-zinc-800">
                        <label className="block text-xs uppercase text-zinc-500 font-bold mb-3">Botões de Ação</label>

                        <div className="flex gap-2 mb-3">
                            <input
                                type="text"
                                placeholder="Texto (ex: Assistir)"
                                className="flex-1 bg-black/50 border border-zinc-700 rounded p-2 text-sm"
                                value={newBtnLabel}
                                onChange={(e) => setNewBtnLabel(e.target.value)}
                            />
                            <input
                                type="text"
                                placeholder="/url"
                                className="flex-1 bg-black/50 border border-zinc-700 rounded p-2 text-sm"
                                value={newBtnUrl}
                                onChange={(e) => setNewBtnUrl(e.target.value)}
                            />
                            <input
                                type="color"
                                className="w-10 h-10 bg-transparent border-0 cursor-pointer"
                                value={newBtnColor}
                                onChange={(e) => setNewBtnColor(e.target.value)}
                            />
                            <button
                                onClick={handleAddButton}
                                className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded"
                            >
                                <Plus size={20} />
                            </button>
                        </div>

                        {/* Buttons List */}
                        <div className="space-y-2">
                            {actionButtons.map((btn, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-zinc-800/50 p-2 rounded px-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: btn.color }} />
                                        <span className="text-sm font-medium">{btn.label}</span>
                                        <span className="text-xs text-zinc-500">{btn.url}</span>
                                    </div>
                                    <button onClick={() => removeButton(idx)} className="text-red-400 hover:text-red-300">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleSend}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 rounded-lg mt-6 shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {loading ? 'Enviando...' : 'ENVIAR NOTIFICAÇÃO'}
                    </button>
                </div>
            </div>

            {/* Preview Column */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-zinc-400 mb-2">
                    <Eye size={18} /> <span className="text-sm font-bold uppercase">Preview do Usuário</span>
                </div>

                {/* Simulated Phone UI */}
                <div className="mx-auto w-[320px] h-[640px] bg-black border-[8px] border-zinc-800 rounded-[3rem] relative overflow-hidden shadow-2xl">
                    {/* Fake App Header */}
                    <div className="absolute top-0 left-0 right-0 h-14 bg-gradient-to-b from-black/80 to-transparent z-10 flex items-center justify-between px-6 pt-4">
                        <div className="w-20 h-4 bg-zinc-800 rounded-full opacity-50" />
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                            <div className="w-2 h-2 bg-red-500 rounded-full" />
                        </div>
                    </div>

                    {/* Background simulates app content */}
                    <div className="absolute inset-0 bg-zinc-900 opacity-50 bg-[url('https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=1000&auto=format&fit=crop')] bg-cover grayscale" />

                    {/* THE POPUP */}
                    <div className="absolute inset-0 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm z-20 animate-in fade-in zoom-in duration-300">
                        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full overflow-hidden shadow-2xl">
                            {imageUrl && (
                                <div className="h-40 w-full relative">
                                    <img src={imageUrl} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] to-transparent" />
                                </div>
                            )}

                            <div className="p-5 text-center">
                                <h4 className="text-xl font-bold text-white mb-2 leading-tight">
                                    {title || 'Título da Notificação'}
                                </h4>
                                <p className="text-sm text-gray-300 mb-6 leading-relaxed">
                                    {message || 'Sua mensagem aparecerá aqui. Descreva as novidades, promoções ou avisos importantes.'}
                                </p>

                                <div className="space-y-3">
                                    {actionButtons.length > 0 ? (
                                        actionButtons.map((btn, idx) => (
                                            <button
                                                key={idx}
                                                className="w-full py-3 rounded-lg font-bold text-sm transition-transform active:scale-95"
                                                style={{
                                                    backgroundColor: btn.color,
                                                    color: '#fff', // Ideal would be to calculate contrast
                                                    boxShadow: `0 4px 12px ${btn.color}40`
                                                }}
                                            >
                                                {btn.label}
                                            </button>
                                        ))
                                    ) : (
                                        <button className="w-full py-3 bg-white text-black rounded-lg font-bold text-sm opacity-50">
                                            Botão de Exemplo
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <p className="text-center text-xs text-zinc-500">Visualização aproximada (Mobile)</p>
            </div>
        </div>
    );
}

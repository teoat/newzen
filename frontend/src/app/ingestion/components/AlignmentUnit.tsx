import React, { useState } from 'react';
import { 
    ChevronUp, ChevronDown, Edit2, Trash2, Save, Database, ListFilter, Zap 
} from 'lucide-react';
import { MappingItem } from '../types';
import { CORE_SCHEMA } from '../constants';

interface AlignmentUnitProps {
    mapping: MappingItem;
    columns: string[];
    index: number;
    isFirst: boolean;
    isLast: boolean;
    onUpdate: (v: string) => void;
    onDelete: () => void;
    onMove: (d: 'up' | 'down') => void;
    onEditLabel: (l: string) => void;
    onUpdateIntent: (intent: MappingItem['intent']) => void;
}

export function AlignmentUnit({ 
    mapping, columns, index, isFirst, isLast, 
    onUpdate, onDelete, onMove, onEditLabel, onUpdateIntent 
}: AlignmentUnitProps) {
    const Icon = (CORE_SCHEMA.find(s => s.field === mapping.systemField)?.icon) || Database;
    const [isEditing, setIsEditing] = useState(false);
    const [tempLabel, setTempLabel] = useState(mapping.label);

    const handleSave = () => {
        onEditLabel(tempLabel);
        setIsEditing(false);
    };

    return (
        <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-900/40 border border-white/5 hover:border-indigo-500/40 transition-all group relative overflow-hidden">
            <div className="flex flex-col gap-0.5 shrink-0">
                <button 
                     onClick={() => onMove('up')} 
                     disabled={isFirst}
                     className="p-1 hover:bg-white/10 rounded-md text-slate-500 hover:text-white transition-colors disabled:opacity-10 disabled:cursor-not-allowed"
                     title="Move Up"
                >
                    <ChevronUp className="w-3 h-3" />
                </button>
                <button 
                     onClick={() => onMove('down')} 
                     disabled={isLast}
                     className="p-1 hover:bg-white/10 rounded-md text-slate-500 hover:text-white transition-colors disabled:opacity-10 disabled:cursor-not-allowed"
                     title="Move Down"
                >
                    <ChevronDown className="w-3 h-3" />
                </button>
            </div>

            <div className="w-8 h-8 bg-slate-950 rounded-lg flex items-center justify-center text-indigo-400 border border-white/5 shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <Icon className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0">
                {isEditing ? (
                    <div className="flex items-center gap-1">
                        <input 
                            value={tempLabel}
                            onChange={(e) => setTempLabel(e.target.value)}
                            title="Edit field label"
                            aria-label="Edit field label"
                            className="bg-slate-950 border border-indigo-500/50 rounded px-2 py-0.5 text-[10px] font-black uppercase text-white w-full outline-none"
                            autoFocus
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
                        />
                        <button 
                            onClick={handleSave} 
                            title="Save label"
                            aria-label="Save label"
                            className="p-1 text-emerald-400 hover:text-white"
                        >
                            <Save className="w-3 h-3" />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 group/label cursor-text" onClick={() => setIsEditing(true)}>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate group-hover:text-white transition-colors">
                            {mapping.label}
                        </span>
                        {mapping.required && <span className="text-rose-500 text-[8px] font-bold">*</span>}
                        <Edit2 className="w-2.5 h-2.5 text-slate-600 opacity-0 group-hover/label:opacity-100 transition-opacity" />
                    </div>
                )}
            </div>

            <div className="w-40 relative group/select shrink-0">
                <select 
                    value={mapping.fileColumn}
                    onChange={(e) => onUpdate(e.target.value)}
                    title={`Select matching column for ${mapping.label}`}
                    aria-label={`Select matching column for ${mapping.label}`}
                    className={`w-full bg-slate-950 border rounded-xl pl-3 pr-8 py-2 text-[10px] font-black uppercase italic outline-none transition-all appearance-none cursor-pointer ${
                        mapping.fileColumn ? 'border-emerald-500/30 text-emerald-400' : 'border-white/5 text-slate-600 hover:border-white/10'
                    }`}
                >
                    <option value="">-- UNMATCHED --</option>
                        {columns.map((col: string) => (
                            <option key={col} value={col}>{col.toUpperCase()}</option>
                        ))}

                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-700 group-hover/select:text-indigo-500 transition-colors">
                    <ListFilter className="w-3 h-3" />
                </div>
            </div>

            {mapping.isCustom && (
                <div className="w-32 relative group/intent shrink-0">
                    <select 
                        value={mapping.intent || 'GENERAL'}
                        onChange={(e) => onUpdateIntent(e.target.value as MappingItem['intent'])}
                        title={`Select forensic intent for ${mapping.label}`}
                        className="w-full bg-slate-950 border border-white/5 rounded-xl pl-3 pr-8 py-2 text-[10px] font-black uppercase text-indigo-400 outline-none transition-all appearance-none cursor-pointer hover:border-indigo-500/30"
                    >
                        <option value="GENERAL">General</option>
                        <option value="LOCATION">Location</option>
                        <option value="QUANTITY">Quantity</option>
                        <option value="SECONDARY_ID">ID/Account</option>
                        <option value="TIMESTAMP">Timeline</option>
                        <option value="RISK_INDICATOR">Risk Tag</option>
                    </select>
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-500">
                        <Zap className="w-3 h-3" />
                    </div>
                </div>
            )}

            {!mapping.required && (
                <button 
                    onClick={onDelete} 
                    className="p-2 hover:bg-rose-500/10 hover:text-rose-500 text-slate-700 transition-all rounded-lg shrink-0"
                    title="Remove Field"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );
}

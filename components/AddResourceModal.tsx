import React, { useState } from 'react';
import { X, Check, Loader2, FlaskConical, Building2, DoorOpen, Package } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface AddResourceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CATEGORIES = ['Lecture Halls', 'Labs', 'Rooms', 'Equipment', 'Vehicles'];
const STATUSES = ['Available', 'Booked', 'Maintenance'];

const EQUIPMENT_OPTIONS = [
    'Projector', 'Whiteboard', 'Air Conditioning', 'Wi-Fi', 'Computers',
    'Microscopes', 'Audio System', 'CCTV', 'Smart Board',
];

export default function AddResourceModal({ isOpen, onClose, onSuccess }: AddResourceModalProps) {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        type: 'Lecture Halls',
        capacity: '',
        location: '',
        equipment: [] as string[],
        availability_status: 'Available',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const toggleEquipment = (item: string) => {
        setFormData(prev => ({
            ...prev,
            equipment: prev.equipment.includes(item)
                ? prev.equipment.filter(e => e !== item)
                : [...prev.equipment, item],
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const token = (user && typeof user.getIdToken === 'function') ? await user.getIdToken() : 'dev-token';
            const response = await fetch('http://localhost:5000/api/resources', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to create resource');
            }
            onSuccess();
            onClose();
            // reset
            setFormData({ name: '', type: 'Lecture Halls', capacity: '', location: '', equipment: [], availability_status: 'Available' });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div
                className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100">
                    <div>
                        <h2 className="text-xl font-bold text-[#1E3A8A]">Add New Resource</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Fill in the details below to create a resource</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 px-7 py-6">
                    {error && (
                        <div className="mb-5 p-3.5 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium flex items-center gap-2">
                            <X className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    <form id="add-resource-form" onSubmit={handleSubmit} className="space-y-5">
                        {/* Resource Name */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                                Resource Name <span className="text-red-400">*</span>
                            </label>
                            <input
                                required
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g. Lab 01, Hall A"
                                className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                        </div>

                        {/* Category & Capacity */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                                    Type <span className="text-red-400">*</span>
                                </label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                                >
                                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                                    Capacity <span className="text-red-400">*</span>
                                </label>
                                <input
                                    required
                                    name="capacity"
                                    type="number"
                                    min="1"
                                    value={formData.capacity}
                                    onChange={handleChange}
                                    placeholder="e.g. 60"
                                    className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                            </div>
                        </div>

                        {/* Location */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                                Location <span className="text-red-400">*</span>
                            </label>
                            <input
                                required
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="e.g. Block A, Floor 2"
                                className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                        </div>

                        {/* Equipment */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                                Equipment / Amenities
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {EQUIPMENT_OPTIONS.map(item => (
                                    <button
                                        key={item}
                                        type="button"
                                        onClick={() => toggleEquipment(item)}
                                        className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-150 ${
                                            formData.equipment.includes(item)
                                                ? 'bg-[#1E3A8A] text-white border-[#1E3A8A] shadow-sm'
                                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-400 hover:text-[#1E3A8A]'
                                        }`}
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                                Status
                            </label>
                            <select
                                name="availability_status"
                                value={formData.availability_status}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                            >
                                {STATUSES.map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="px-7 py-5 border-t border-slate-100 bg-slate-50/60 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="add-resource-form"
                        disabled={loading}
                        className="px-6 py-2.5 rounded-xl bg-[#1E3A8A] hover:bg-[#1e40af] text-white text-sm font-semibold flex items-center gap-2 transition-colors shadow-md shadow-blue-900/20 disabled:opacity-60 active:scale-95"
                    >
                        {loading ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                        ) : (
                            <><Check className="w-4 h-4" /> Save Resource</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState } from 'react';
import { X, Upload, Users, Mail, Plus, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function BulkInviteModal({ isOpen, onClose, onSubmit }) {
    const [mode, setMode] = useState('form'); // 'form' | 'csv'
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [csvFile, setCsvFile] = useState(null);
    const [csvData, setCsvData] = useState([]);
    const [formData, setFormData] = useState({
        invites: [{ name: '', email: '', role: 'student' }]
    });

    const roles = [
        { value: 'student', label: 'Student' },
        { value: 'tutor', label: 'Tutor' }
    ];

    const handleFormInviteChange = (index, field, value) => {
        const newInvites = [...formData.invites];
        newInvites[index][field] = value;
        setFormData({ invites: newInvites });
    };

    const addFormInvite = () => {
        setFormData(prev => ({
            invites: [...prev.invites, { name: '', email: '', role: 'student' }]
        }));
    };

    const removeFormInvite = (index) => {
        if (formData.invites.length > 1) {
            const newInvites = formData.invites.filter((_, i) => i !== index);
            setFormData({ invites: newInvites });
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCsvFile(file);
            parseCSV(file);
        }
    };

    const parseCSV = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const lines = text.split('\n').filter(line => line.trim());
            
            // Skip header if exists
            const startIndex = lines[0].toLowerCase().includes('name') ? 1 : 0;
            
            const parsedData = [];
            for (let i = startIndex; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line) {
                    const [name, email, role] = line.split(',').map(item => item.trim().replace(/"/g, ''));
                    if (name && email) {
                        parsedData.push({
                            name,
                            email,
                            role: (role || 'student').toLowerCase()
                        });
                    }
                }
            }
            
            setCsvData(parsedData);
        };
        reader.readAsText(file);
    };

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const validateFormInvites = () => {
        const errors = [];
        
        formData.invites.forEach((invite, index) => {
            if (!invite.name || !invite.email) {
                errors.push(`Row ${index + 1}: Name and email are required`);
            } else if (!validateEmail(invite.email)) {
                errors.push(`Row ${index + 1}: Invalid email format`);
            }
        });

        return errors;
    };

    const validateCSVInvites = () => {
        const errors = [];
        
        csvData.forEach((invite, index) => {
            if (!invite.name || !invite.email) {
                errors.push(`Row ${index + 1}: Name and email are required`);
            } else if (!validateEmail(invite.email)) {
                errors.push(`Row ${index + 1}: Invalid email format`);
            } else if (!['student', 'tutor'].includes(invite.role)) {
                errors.push(`Row ${index + 1}: Role must be student or tutor`);
            }
        });

        return errors;
    };

    const handleSubmit = async () => {
        let invites = [];
        let errors = [];

        if (mode === 'form') {
            errors = validateFormInvites();
            invites = formData.invites.filter(invite => invite.name && invite.email);
        } else {
            errors = validateCSVInvites();
            invites = csvData;
        }

        if (errors.length > 0) {
            toast.error(`Validation errors: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}`);
            return;
        }

        if (invites.length === 0) {
            toast.error('No valid invites to create');
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit(invites, mode);
            // Reset form on success
            setFormData({ invites: [{ name: '', email: '', role: 'student' }] });
            setCsvFile(null);
            setCsvData([]);
            onClose();
        } catch (error) {
            console.error('Submit error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Bulk Invite Users</h2>
                            <p className="text-gray-600 mt-1">Invite multiple students and tutors to your institute</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {/* Mode Selection */}
                    <div className="flex gap-4 mb-6">
                        <button
                            onClick={() => setMode('form')}
                            className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                                mode === 'form'
                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                        >
                            <Users className="w-5 h-5 inline mr-2" />
                            Manual Entry
                        </button>
                        <button
                            onClick={() => setMode('csv')}
                            className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                                mode === 'csv'
                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                        >
                            <Upload className="w-5 h-5 inline mr-2" />
                            CSV Upload
                        </button>
                    </div>

                    {mode === 'form' ? (
                        /* Manual Form Mode */
                        <div className="space-y-4">
                            {formData.invites.map((invite, index) => (
                                <div key={index} className="grid grid-cols-12 gap-3 items-center">
                                    <div className="col-span-4">
                                        <input
                                            type="text"
                                            placeholder="Full Name"
                                            value={invite.name}
                                            onChange={(e) => handleFormInviteChange(index, 'name', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div className="col-span-4">
                                        <input
                                            type="email"
                                            placeholder="Email Address"
                                            value={invite.email}
                                            onChange={(e) => handleFormInviteChange(index, 'email', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <select
                                            value={invite.role}
                                            onChange={(e) => handleFormInviteChange(index, 'role', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        >
                                            {roles.map(role => (
                                                <option key={role.value} value={role.value}>
                                                    {role.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-1">
                                        {formData.invites.length > 1 && (
                                            <button
                                                onClick={() => removeFormInvite(index)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={addFormInvite}
                                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
                            >
                                <Plus className="w-4 h-4" />
                                Add Another Invite
                            </button>
                        </div>
                    ) : (
                        /* CSV Upload Mode */
                        <div className="space-y-4">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <div className="mb-4">
                                    <label htmlFor="csv-upload" className="cursor-pointer">
                                        <span className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                                            Choose CSV File
                                        </span>
                                        <input
                                            id="csv-upload"
                                            type="file"
                                            accept=".csv"
                                            onChange={handleFileUpload}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Upload a CSV file with columns: name, email, role
                                </p>
                                <p className="text-xs text-gray-500 mt-2">
                                    Role should be "student" or "tutor" (defaults to student)
                                </p>
                            </div>

                            {csvFile && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        <div>
                                            <p className="font-medium text-green-900">
                                                {csvFile.name} uploaded successfully
                                            </p>
                                            <p className="text-sm text-green-700">
                                                {csvData.length} invites found
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {csvData.length > 0 && (
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-900 mb-3">Preview ({csvData.length} invites)</h4>
                                    <div className="max-h-40 overflow-y-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-gray-200">
                                                    <th className="text-left py-2">Name</th>
                                                    <th className="text-left py-2">Email</th>
                                                    <th className="text-left py-2">Role</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {csvData.slice(0, 10).map((invite, index) => (
                                                    <tr key={index} className="border-b border-gray-100">
                                                        <td className="py-2">{invite.name}</td>
                                                        <td className="py-2">{invite.email}</td>
                                                        <td className="py-2 capitalize">{invite.role}</td>
                                                    </tr>
                                                ))}
                                                {csvData.length > 10 && (
                                                    <tr>
                                                        <td colSpan="3" className="py-2 text-center text-gray-500">
                                                            ... and {csvData.length - 10} more
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || (mode === 'csv' ? csvData.length === 0 : formData.invites.every(invite => !invite.name || !invite.email))}
                            className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center justify-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Creating Invites...
                                </div>
                            ) : (
                                `Create ${mode === 'form' ? formData.invites.filter(invite => invite.name && invite.email).length : csvData.length} Invites`
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

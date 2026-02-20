'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Flag, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/axios';

export function ReportAbuseModal({ isOpen, onClose, targetId, targetType = 'Course' }) {
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!reason) {
            toast.error('Please select a reason');
            return;
        }

        try {
            setLoading(true);
            const res = await api.post('/reports', {
                targetId,
                targetType,
                reason,
                description
            });

            if (res.data.success) {
                toast.success('Report submitted. Thank you for helping keep our community safe.');
                onClose();
                setReason('');
                setDescription('');
            }
        } catch (error) {
            console.error('Report error:', error);
            toast.error('Failed to submit report. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="w-5 h-5" /> Report Issue
                    </DialogTitle>
                    <DialogDescription>
                        Help us understand the problem. What's wrong with this content?
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Reason</Label>
                        <Select onValueChange={setReason}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a reason" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Inappropriate Content">Inappropriate Content</SelectItem>
                                <SelectItem value="Spam">Spam or Misleading</SelectItem>
                                <SelectItem value="Harassment">Harassment or Hate Speech</SelectItem>
                                <SelectItem value="Misleading Information">Misleading Information</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>Additional Details (Optional)</Label>
                        <Textarea
                            placeholder="Please provide more details..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleSubmit} disabled={loading || !reason}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Flag className="w-4 h-4 mr-2" />}
                        Submit Report
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

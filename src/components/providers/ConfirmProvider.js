'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Info } from 'lucide-react';

const ConfirmContext = createContext();

export function useConfirm() {
    return useContext(ConfirmContext);
}

export function ConfirmProvider({ children }) {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState({
        title: 'Confirm Action',
        message: 'Are you sure you want to proceed?',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        variant: 'default', // 'default' or 'destructive'
    });
    const [resolveRef, setResolveRef] = useState(null);

    const confirmDialog = useCallback((title, message, customOptions = {}) => {
        setOptions({
            title: title || 'Confirm Action',
            message: message || 'Are you sure you want to proceed?',
            confirmText: customOptions.confirmText || 'Yes',
            cancelText: customOptions.cancelText || 'No',
            variant: customOptions.variant || 'default',
        });
        setIsOpen(true);

        return new Promise((resolve) => {
            setResolveRef(() => resolve);
        });
    }, []);

    const handleConfirm = () => {
        setIsOpen(false);
        if (resolveRef) resolveRef(true);
    };

    const handleCancel = () => {
        setIsOpen(false);
        if (resolveRef) resolveRef(false);
    };

    return (
        <ConfirmContext.Provider value={{ confirmDialog }}>
            {children}

            <Dialog open={isOpen} onOpenChange={(open) => {
                if (!open) handleCancel();
            }}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            {options.variant === 'destructive' ? (
                                <div className="p-2 bg-red-100 rounded-full">
                                    <AlertTriangle className="w-5 h-5 text-red-600" />
                                </div>
                            ) : (
                                <div className="p-2 bg-blue-100 rounded-full">
                                    <Info className="w-5 h-5 text-blue-600" />
                                </div>
                            )}
                            <DialogTitle>{options.title}</DialogTitle>
                        </div>
                        <DialogDescription className="pt-3 text-base">
                            {options.message}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 gap-2 sm:gap-0">
                        <Button variant="outline" onClick={handleCancel}>
                            {options.cancelText}
                        </Button>
                        <Button
                            variant={options.variant === 'destructive' ? 'destructive' : 'default'}
                            className={options.variant === 'destructive' ? "bg-red-600 hover:bg-red-700" : ""}
                            onClick={handleConfirm}
                        >
                            {options.confirmText}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </ConfirmContext.Provider>
    );
}

'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

type NotificationType = 'success' | 'warning' | 'info' | 'error';

interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
}

interface NotificationContextType {
    notify: (notification: Omit<Notification, 'id'>) => void;
    dismiss: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useForensicNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useForensicNotification must be used within ForensicNotificationProvider');
    }
    return context;
};

export const ForensicNotificationProvider = ({ children }: { children?: ReactNode }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const dismiss = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const notify = useCallback((notification: Omit<Notification, 'id'>) => {
        const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newNotification: Notification = {
            id,
            duration: 5000,
            ...notification,
        };

        setNotifications(prev => [...prev, newNotification]);

        if (newNotification.duration && newNotification.duration > 0) {
            setTimeout(() => {
                dismiss(id);
            }, newNotification.duration);
        }
    }, [dismiss]);

    // Event bus integration - Subscribe to forensic events
    React.useEffect(() => {
        // Only import and use in client side
        if (typeof window === 'undefined') return;

        import('@/lib/ForensicEventBus').then(({ forensicBus }) => {
            const subscriptions: string[] = [];

            // Subscribe to each event type
            subscriptions.push(
                forensicBus.subscribe('TRANSACTION_FLAGGED', (event) => {
                    notify({
                        type: 'warning',
                        title: 'Transaction Flagged',
                        message: event.payload.reason || 'Anomaly detected',
                        duration: 6000,
                    });
                })
            );

            subscriptions.push(
                forensicBus.subscribe('VENDOR_SUSPICIOUS', (event) => {
                    notify({
                        type: 'error',
                        title: `High-Risk Vendor: ${event.payload.vendorName}`,
                        message: `Risk level: ${event.payload.riskLevel}`,
                        duration: 7000,
                    });
                })
            );

            subscriptions.push(
                forensicBus.subscribe('SANCTION_HIT', (event) => {
                    notify({
                        type: 'error',
                        title: `SANCTION HIT: ${event.payload.entityName}`,
                        message: `Matched on ${event.payload.sanctionList} (Score: ${(event.payload.matchScore * 100).toFixed(0)}%)`,
                        duration: 10000,
                    });
                })
            );

            // Cleanup
            return () => {
                subscriptions.forEach(id => forensicBus.unsubscribe(id));
            };
        });
    }, [notify]);

    return (
        <NotificationContext.Provider value={{ notify, dismiss }}>
            {children}
            <NotificationContainer notifications={notifications} onDismiss={dismiss} />
        </NotificationContext.Provider>
    );
};

function NotificationContainer({ 
    notifications, 
    onDismiss 
}: { 
    notifications: Notification[]; 
    onDismiss: (id: string) => void;
}) {
    return (
        <div className="fixed top-20 right-8 z-[9999] flex flex-col gap-3 max-w-md">
            <AnimatePresence mode="popLayout">
                {notifications.map(notification => (
                    <NotificationCard
                        key={notification.id}
                        notification={notification}
                        onDismiss={() => onDismiss(notification.id)}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
}

function NotificationCard({ 
    notification, 
    onDismiss 
}: { 
    notification: Notification; 
    onDismiss: () => void;
}) {
    const config = {
        success: {
            icon: CheckCircle2,
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/30',
            iconColor: 'text-emerald-500',
            textColor: 'text-emerald-400',
        },
        warning: {
            icon: AlertTriangle,
            bg: 'bg-orange-500/10',
            border: 'border-orange-500/30',
            iconColor: 'text-orange-500',
            textColor: 'text-orange-400',
        },
        info: {
            icon: Info,
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/30',
            iconColor: 'text-blue-500',
            textColor: 'text-blue-400',
        },
        error: {
            icon: XCircle,
            bg: 'bg-rose-500/10',
            border: 'border-rose-500/30',
            iconColor: 'text-rose-500',
            textColor: 'text-rose-400',
        },
    };

    const style = config[notification.type];
    const Icon = style.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`
                ${style.bg} ${style.border} backdrop-blur-xl
                border rounded-2xl p-5 shadow-2xl
                min-w-[320px] max-w-md
            `}
        >
            <div className="flex items-start gap-4">
                <div className={`p-2 rounded-xl ${style.bg} ${style.border} border`}>
                    <Icon className={`w-5 h-5 ${style.iconColor}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-black uppercase tracking-widest ${style.textColor} mb-1 italic`}>
                        {notification.title}
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                        {notification.message}
                    </p>
                    
                    {notification.action && (
                        <button
                            onClick={notification.action.onClick}
                            className={`
                                mt-3 px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest
                                ${style.bg} ${style.border} border ${style.textColor}
                                hover:bg-opacity-20 transition-all
                            `}
                        >
                            {notification.action.label}
                        </button>
                    )}
                </div>
                
                <button
                    onClick={onDismiss}
                    className="text-slate-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
                    aria-label="Dismiss notification"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
}

// Helper hook for common notification patterns
export const useForensicNotifications = () => {
    const { notify } = useForensicNotification();

    return {
        success: (title: string, message: string, action?: Notification['action']) => {
            notify({ type: 'success', title, message, action });
        },
        warning: (title: string, message: string, action?: Notification['action']) => {
            notify({ type: 'warning', title, message, action });
        },
        info: (title: string, message: string, action?: Notification['action']) => {
            notify({ type: 'info', title, message, action });
        },
        error: (title: string, message: string, action?: Notification['action']) => {
            notify({ type: 'error', title, message, action });
        },
        matchFound: (confidence: number, tier: string, count: number = 1) => {
            notify({
                type: confidence >= 0.95 ? 'success' : confidence >= 0.85 ? 'info' : 'warning',
                title: `RECONCILIATION: ${count} MATCH${count > 1 ? 'ES' : ''} FOUND`,
                message: `Confidence: ${(confidence * 100).toFixed(0)}% | Tier: ${tier} | Ready for review`,
                duration: 7000,
            });
        },
        ingestionComplete: (records: number, filename: string) => {
            notify({
                type: 'success',
                title: 'INGESTION COMPLETE',
                message: `${records.toLocaleString()} records from ${filename} successfully sealed to vault`,
                duration: 6000,
            });
        },
        fraudAlert: (severity: 'high' | 'critical', message: string) => {
            notify({
                type: severity === 'critical' ? 'error' : 'warning',
                title: severity === 'critical' ? '🚨 CRITICAL FRAUD ALERT' : '⚠️ FRAUD TRIGGER DETECTED',
                message,
                duration: 10000,
            });
        },
    };
};

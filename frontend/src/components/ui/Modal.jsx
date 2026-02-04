import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // Keyframes for smooth animation
    const styles = `
        @keyframes modalFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes modalScaleIn {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
        .animate-modal-fade {
            animation: modalFadeIn 0.2s ease-out forwards;
        }
        .animate-modal-scale {
            animation: modalScaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
    `;

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <style>{styles}</style>

            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
                {/* Background overlay */}
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-modal-fade"
                    aria-hidden="true"
                    onClick={onClose}
                ></div>

                {/* Modal panel */}
                <div
                    className={`
                        relative inline-block bg-white rounded-2xl text-left overflow-hidden shadow-2xl 
                        transform transition-all align-middle 
                        w-full ${maxWidth} p-6 
                        animate-modal-scale
                    `}
                >
                    <div className="absolute top-0 right-0 pt-4 pr-4">
                        <button
                            onClick={onClose}
                            type="button"
                            className="bg-white rounded-full p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <span className="sr-only">Close</span>
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="w-full">
                        <div className="mt-3 text-center sm:mt-0 sm:text-left">
                            {title && (
                                <h3 className="text-xl font-bold leading-6 text-slate-900 mb-2" id="modal-title">
                                    {title}
                                </h3>
                            )}
                            <div className="mt-2 text-slate-600">
                                {children}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

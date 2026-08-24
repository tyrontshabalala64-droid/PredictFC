 import React from 'react'
import { X } from 'lucide-react'

export default function FullImageModal({ imageUrl, onClose, username }) {
    React.useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleEsc)
        return () => window.removeEventListener('keydown', handleEsc)
    }, [onClose])

    return (
        <div 
            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
            onClick={onClose}
        >
            <div 
                className="relative max-w-3xl max-h-[90vh] w-full h-full flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-white/70 hover:text-white bg-black/50 rounded-full p-2 transition z-10"
                >
                    <X size={24} />
                </button>

                {/* Image */}
                <img
                    src={imageUrl}
                    alt={`${username || 'User'}'s profile`}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                />

                {/* Username watermark */}
                {username && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-sm font-medium bg-black/30 px-4 py-1 rounded-full">
                        @{username}
                    </div>
                )}
            </div>
        </div>
    )
}
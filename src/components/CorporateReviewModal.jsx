import React, { useState } from "react";
import { generateCorporateReview } from "../utils/ai";

export default function CorporateReviewModal({ isOpen, onClose, resource }) {
    const [review, setReview] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleGenrate = async () => {
        setIsLoading(true);
        setReview("");
        const result = await generateCorporateReview(resource);
        setReview(result);
        setIsLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-white border-4 border-black w-full max-w-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="bg-yellow-400 border-b-4 border-black p-4 flex justify-betwee items-center">
                    <h2 className="text-xl font-black text-black uppercase tracking-tighter">
                        AI Performance Review
                    </h2>
                    <button onClick={onClose} className="text-black hover:bg-black hover:text-white px-2 font-bold text-xl border-2 border-transparent transition-colors">
                        x
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="flex items-center gap-4 bg-gray-100 p-3 border-2 border-black">
                        <div className="w-12 h-12 bg-black text-white flex items-center justify-center font-black text-xl">
                            {resource.name.chartAt(0)}
                        </div>
                        <div>
                            <p className="font-black uppercase">{resource.name}</p>
                            <p className="text-sm font-mono text-gray-600">Resource Id: #{resource.id.substring(0,6)}</p>
                        </div>
                    </div>

                    <div className="min-h-[120px] bg-blue-50 border-2 border-black p-4 font-serif text-sm relative">
                        <span className="absolute -top-3 left-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 uppercase tracking-wider border-2 border-black">
                            Official Evaluation
                        </span>

                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-full space-y-2 text-blue-800 animate-pulse">
                                <span className="text-2xl">⚙️</span>
                                <p className="tracking-widest uppercase font-bold text-xs">Synergizing metrics...</p>
                            </div>
                        ) : review ? (
                            <p className="text-black leading-relaxed">"{review}"</p>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400 italic">
                                Awaiting managerial initiation...
                            </div>
                            )}
                        </div>

                        <button 
                            onClick={handleGenerate}
                            disabled={isLoading}
                            className="w-full bg-black text-white py-3 font-black uppercase tracking-widest hover:bg-blue-600 border-2 border-black disabled:opacity-50 transition-colors"
                        >
                            {isLoading ? 'GENERATING...' : 'REQUEST AI REVIEW'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
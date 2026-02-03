"use client";

import React from 'react';

export default function AdBanner() {
    return (
        <div className="w-full max-w-2xl mx-auto my-6 px-4">
            <div className="bg-[#1a1a1a] border border-dashed border-[#333] rounded-lg p-6 flex flex-col items-center justify-center text-center">
                <span className="text-gray-500 text-xs font-mono uppercase tracking-widest mb-2">
                    Advertisement
                </span>

                {/* 
                    PASTE YOUR AD NETWORK CODE HERE 
                    Example: <script ...></script> 
                */}
                <div className="w-full h-[100px] bg-[#222] rounded flex items-center justify-center">
                    <span className="text-gray-600 text-sm">
                        Ad Space (Place Script Here)
                    </span>
                </div>

            </div>
        </div>
    );
}

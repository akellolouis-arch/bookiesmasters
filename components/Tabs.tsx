"use client";

import React from "react";

interface Tab {
    id: string;
    label: string;
}

interface TabsProps {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (id: string) => void;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange }) => {
    return (
        <div className="flex overflow-x-auto gap-1 border-b border-gray-700/50 mb-2 scrollbar-hide">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`pb-1 px-1 text-sm font-medium transition-colors whitespace-nowrap relative ${activeTab === tab.id
                        ? "text-gray-900"
                        : "text-gray-600 hover:text-gray-800"
                        }`}
                >
                    {tab.label}
                    {activeTab === tab.id && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white rounded-t-md" />
                    )}
                </button>
            ))}
        </div>
    );
};

export default Tabs;

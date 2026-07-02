"use client";

import { useState, useEffect } from 'react';

export default function PredictionStructurePage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/debug/prediction-structure');
                if (!res.ok) {
                    throw new Error(`Error: ${res.statusText}`);
                }
                const json = await res.json();
                setData(json);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="p-10 text-xl">Loading prediction structure...</div>;
    if (error) return <div className="p-10 text-red-500">Error: {error}</div>;

    return (
        <div className="min-h-screen bg-gray-900 text-green-400 p-8 font-mono">
            <h1 className="text-2xl mb-4 font-bold text-gray-900">Prediction Object Structure</h1>
            <p className="mb-4 text-gray-600">Below is the <code>prediction</code> object from MongoDB for fixture {data?.fixtureId}:</p>

            <div className="bg-gray-50 border border-yellow-500 rounded-lg p-6 mb-8 overflow-auto">
                <h2 className="text-yellow-500 text-xl mb-2 font-bold">Prediction Data</h2>
                <pre className="text-lg">
                    {JSON.stringify(data?.prediction, null, 2)}
                </pre>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 overflow-auto max-h-[50vh] opacity-50">
                <h3 className="text-gray-600 text-sm mb-2">Full Fixture Context</h3>
                <pre className="text-xs">
                    {JSON.stringify(data, null, 2)}
                </pre>
            </div>
        </div>
    );
}

import React, { useState } from 'react'
import MitutoyoSettings from './sensors/MitutoyoSettings'
import AirgaugeSettings from './sensors/AirgaugeSettings';

function SensorSettings() {
    const [activeTab, setActiveTab] = useState('airgauge');

    const listSensor = [
        {
            name: 'Airgauge',
            type: 'airgauge',
        },
        {
            name: 'Mitutoyo',
            type: 'mitutoyo',
        }
    ]

    return (
        <div className="min-h-screen bg-page p-6 text-primary transition-colors duration-300">
            {/* Background Blobs สำหรับหน้าหลัก */}
            <div className="fixed inset-0 overflow-hidden -z-10">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px]"></div>
            </div>

            <div className="max-w-6xl mx-auto space-y-8">
                {/* Tab Navigation Area */}
                <div className="flex gap-3 p-1.5 glass-card w-fit rounded-2xl border border-border-color">
                    {listSensor.map((sensor) => (
                        <button
                            key={sensor.type}
                            onClick={() => setActiveTab(sensor.type)}
                            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2
                                ${activeTab === sensor.type
                                    ? 'bg-accent text-white shadow-[0_8px_20px_-6px_rgba(var(--color-accent),0.5)] scale-105'
                                    : 'text-secondary hover:text-primary hover:bg-card-hover'
                                }`}
                        >
                            <div className={`w-2 h-2 rounded-full ${activeTab === sensor.type ? 'bg-white' : 'bg-secondary/40'}`}></div>
                            {sensor.name}
                        </button>
                    ))}
                </div>

                {/* Content Area with Animation */}
                <div className="transition-all duration-500 ease-in-out">
                    <div className="relative">
                        {/* Airgauge Tab */}
                        <div className={activeTab === 'airgauge' ? 'block animate-in fade-in' : 'hidden'}>
                            <AirgaugeSettings />
                        </div>

                        {/* Mitutoyo Tab */}
                        <div className={activeTab === 'mitutoyo' ? 'block animate-in fade-in' : 'hidden'}>
                            <MitutoyoSettings />
                        </div>

                        
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SensorSettings
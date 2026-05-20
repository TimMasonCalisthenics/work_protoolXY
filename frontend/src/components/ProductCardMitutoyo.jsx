import React, { useState } from "react";

function ProductCardMitutoyo({ image, name, detail }) {
  const [mitutoyo, setMitutoyo] = useState({value: '', status: ''});
  const mitutoyoConfig = {min: detail.min, max: detail.max};
  const handleMitutoyoChange = ( value) => {
    if (value === '') {
      setMitutoyo(prev => ({ ...prev, value: '', status: '' }));
      return;
    }
    const num = parseFloat(value);
    const isPass = num >= mitutoyoConfig.min && num <= mitutoyoConfig.max;
    setMitutoyo(prev => ({ ...prev, value: value, status: isPass ? 'OK' : 'NG' }));
  };
  const getStatusColorMitutoyo = (val, min, max) => {
    if (val === '' || val === null || isNaN(val)) return 'bg-yellow-400 dark:bg-gray-800 border-gray-300 dark:border-gray-600';
    const num = parseFloat(val);
    if (num >= min && num <= max) return 'bg-green-500 text-white border-green-600';
    return 'bg-red-500 text-white border-red-600';
  };
  return (
    <article className="flex flex-col w-full rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">

    <div className="flex items-center gap-4">
                    <label className="w-20 font-bold text-center text-lg">{detail.label}</label>
                    <div className="relative flex-1">
                        <input
                            type="number"
                            step="0.001"
                            value={mitutoyo.value}
                            onChange={(e) => handleMitutoyoChange(e.target.value)}
                            className="w-full h-16 text-3xl text-center font-bold border-2 border-black rounded bg-white text-black"
                        />
                        <div className={`absolute top-0 flex items-center justify-center right-0 h-full w-20 border-l border-black ${getStatusColorMitutoyo( mitutoyo.value, mitutoyoConfig.min, mitutoyoConfig.max)}`}>
                            {mitutoyo.status}
                        </div>
                    </div>
            </div>
      {/* Image */}
      <div className="aspect-[4/3] w-full">
        <img src={image} alt={name} className="w-full h-full max-h-[400px] object-contain" />
      </div>

    </article>
  );
}

export default ProductCardMitutoyo;

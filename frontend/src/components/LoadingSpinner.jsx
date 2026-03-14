const LoadingSpinner = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="relative w-16 h-16">
                {/* Outer ring */}
                <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                {/* Spinning gradient ring */}
                <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                {/* Center dot with pulse */}
                <div className="absolute inset-4 bg-gradient-to-br from-indigo-500 to-rose-500 rounded-full animate-pulse shadow-lg shadow-indigo-200"></div>
            </div>
            <div className="flex flex-col items-center">
                <span className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Loading</span>
                <div className="flex space-x-1 mt-1">
                    <div className="w-1 h-1 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1 h-1 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1 h-1 bg-indigo-600 rounded-full animate-bounce"></div>
                </div>
            </div>
        </div>
    );
};

export default LoadingSpinner;

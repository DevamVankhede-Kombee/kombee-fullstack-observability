const Alert = ({ type = 'info', message, onClose }) => {
  const configs = {
    success: {
      bg: 'bg-gradient-to-r from-emerald-50 to-teal-50',
      border: 'border-emerald-200',
      text: 'text-emerald-800',
      icon: '✓',
      iconBg: 'bg-emerald-500'
    },
    error: {
      bg: 'bg-gradient-to-r from-red-50 to-rose-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: '✕',
      iconBg: 'bg-red-500'
    },
    warning: {
      bg: 'bg-gradient-to-r from-amber-50 to-orange-50',
      border: 'border-amber-200',
      text: 'text-amber-800',
      icon: '⚠',
      iconBg: 'bg-amber-500'
    },
    info: {
      bg: 'bg-gradient-to-r from-blue-50 to-cyan-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: 'ℹ',
      iconBg: 'bg-blue-500'
    },
  };

  const config = configs[type] || configs.info;

  return (
    <div className={`flex items-center justify-between p-5 rounded-2xl border-2 ${config.bg} ${config.border} animate-slideIn shadow-lg`}>
      <div className="flex items-center space-x-4">
        <div className={`flex-shrink-0 w-10 h-10 ${config.iconBg} rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-md`}>
          {config.icon}
        </div>
        <p className={`text-sm font-semibold ${config.text}`}>{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className={`flex-shrink-0 ml-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/50 transition-all ${config.text}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default Alert;

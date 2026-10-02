import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Delete',
  confirmColor = 'rose', // 'rose' | 'amber' | 'brand'
  isLoading = false,
}) {
  if (!isOpen) return null;

  const colorMap = {
    rose: {
      bg: 'bg-accent-rose/10',
      border: 'border-accent-rose/30',
      text: 'text-accent-rose',
      button: 'bg-accent-rose hover:bg-accent-rose/80',
      icon: 'text-accent-rose',
    },
    amber: {
      bg: 'bg-accent-amber/10',
      border: 'border-accent-amber/30',
      text: 'text-accent-amber',
      button: 'bg-accent-amber hover:bg-accent-amber/80',
      icon: 'text-accent-amber',
    },
    brand: {
      bg: 'bg-brand/10',
      border: 'border-brand/30',
      text: 'text-brand',
      button: 'bg-brand hover:bg-brand-hover',
      icon: 'text-brand',
    },
  };

  const colors = colorMap[confirmColor] || colorMap.rose;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-sm bg-bg-surface border border-border-subtle rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-dim hover:text-text-main transition-colors p-1 rounded-lg hover:bg-bg-elevated"
        >
          <X size={16} strokeWidth={2.5} />
        </button>

        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center mb-4`}>
          <AlertTriangle size={22} className={colors.icon} strokeWidth={2} />
        </div>

        {/* Content */}
        <h3 className="text-lg font-extrabold text-text-main mb-1.5">{title}</h3>
        <p className="text-sm text-text-muted mb-6 leading-relaxed">{message}</p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-sm text-text-muted bg-bg-elevated border border-border-subtle hover:text-text-main hover:bg-bg-subtle transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-3 rounded-xl font-bold text-sm text-white ${colors.button} transition-all disabled:opacity-50 flex items-center justify-center gap-2`}
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
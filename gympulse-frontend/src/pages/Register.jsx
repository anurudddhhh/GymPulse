import { SignUp } from '@clerk/clerk-react';

// Shared dark-mode appearance overrides -- same premium theme as Login
const clerkAppearance = {
  layout: {
    socialButtonsPlacement: 'top',
    socialButtonsVariant: 'blockButton',
    termsPageUrl: null,
    privacyPageUrl: null,
  },
  variables: {
    colorPrimary: '#3b82f6',
    colorBackground: '#18181b',
    colorText: '#ffffff',
    colorTextSecondary: '#a1a1aa',
    colorInputBackground: '#27272a',
    colorInputText: '#ffffff',
    colorTextOnPrimaryBackground: '#ffffff',
    borderRadius: '0.5rem',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontWeight: { normal: 500, medium: 600, bold: 700 },
  },
  elements: {
    rootBox: {
      width: '100%',
      maxWidth: '420px',
    },
    card: {
      backgroundColor: '#18181b',
      border: '1px solid #27272a',
      borderRadius: '0.75rem',
      boxShadow: 'none',
    },
    headerTitle: {
      color: '#ffffff',
      fontWeight: 700,
      fontSize: '1.5rem',
      letterSpacing: '-0.025em',
    },
    headerSubtitle: {
      color: '#71717a',
      fontWeight: 500,
    },
    socialButtonsBlockButton: {
      backgroundColor: '#27272a',
      border: '1px solid #3f3f46',
      color: '#ffffff',
      fontWeight: 600,
      borderRadius: '0.5rem',
      transition: 'all 150ms ease',
      '&:hover': {
        backgroundColor: '#3f3f46',
        borderColor: '#52525b',
      },
    },
    dividerLine: {
      backgroundColor: '#27272a',
    },
    dividerText: {
      color: '#71717a',
    },
    formFieldLabel: {
      color: '#a1a1aa',
      fontWeight: 500,
    },
    formFieldInput: {
      backgroundColor: '#27272a',
      border: '1px solid transparent',
      color: '#ffffff',
      borderRadius: '0.5rem',
      fontWeight: 500,
      '&:focus': {
        borderColor: '#3b82f6',
        boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.25)',
      },
      '&::placeholder': {
        color: '#71717a',
      },
    },
    formButtonPrimary: {
      backgroundColor: '#3b82f6',
      color: '#ffffff',
      fontWeight: 700,
      borderRadius: '0.5rem',
      boxShadow: 'none',
      transition: 'all 150ms ease',
      '&:hover': {
        backgroundColor: '#2563eb',
      },
    },
    footerAction: {
      '& a': {
        color: '#3b82f6',
        fontWeight: 600,
        '&:hover': {
          color: '#60a5fa',
        },
      },
    },
    footerActionText: {
      color: '#71717a',
    },
    identityPreview: {
      backgroundColor: '#27272a',
      border: '1px solid #3f3f46',
      borderRadius: '0.5rem',
    },
    identityPreviewEditButton: {
      color: '#3b82f6',
    },
    formFieldSuccessText: {
      color: '#22c55e',
    },
    formFieldErrorText: {
      color: '#ef4444',
    },
    alert: {
      backgroundColor: '#27272a',
      border: '1px solid #3f3f46',
      borderRadius: '0.5rem',
      color: '#ffffff',
    },
    alertText: {
      color: '#ffffff',
    },
    otpCodeFieldInput: {
      backgroundColor: '#27272a',
      border: '1px solid #3f3f46',
      color: '#ffffff',
      borderRadius: '0.5rem',
    },
  },
};

export default function Register() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#09090b] text-white p-4 font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight">Join GymPulse</h1>
          <p className="text-zinc-500 font-medium mt-2">Create your account and start tracking.</p>
        </div>
        <SignUp
          appearance={clerkAppearance}
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          forceRedirectUrl="/app/workout"
        />
      </div>
    </div>
  );
}
import { SignUp } from '@clerk/clerk-react';

// GymPulse minimalist dark-slate appearance overrides for Clerk SignUp
const clerkAppearance = {
  layout: {
    socialButtonsPlacement: 'top',
    socialButtonsVariant: 'blockButton',
    termsPageUrl: null,
    privacyPageUrl: null,
  },
  variables: {
    colorPrimary: '#3b82f6',
    colorBackground: '#181a1f',
    colorText: '#f4f5f7',
    colorTextSecondary: '#9499a6',
    colorInputBackground: '#21232a',
    colorInputText: '#f4f5f7',
    colorTextOnPrimaryBackground: '#ffffff',
    borderRadius: '0.75rem',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    fontWeight: { normal: 500, medium: 600, bold: 700 },
  },
  elements: {
    rootBox: {
      width: '100%',
      maxWidth: '420px',
    },
    card: {
      backgroundColor: '#181a1f',
      border: '1px solid #272a33',
      borderRadius: '1.25rem',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
    },
    headerTitle: {
      color: '#f4f5f7',
      fontWeight: 800,
      fontSize: '1.5rem',
      letterSpacing: '-0.025em',
    },
    headerSubtitle: {
      color: '#9499a6',
      fontWeight: 500,
    },
    socialButtonsBlockButton: {
      backgroundColor: '#21232a',
      border: '1px solid #272a33',
      color: '#f4f5f7',
      fontWeight: 600,
      borderRadius: '0.75rem',
      transition: 'all 150ms ease',
      '&:hover': {
        backgroundColor: '#292c35',
        borderColor: '#363a45',
      },
    },
    dividerLine: {
      backgroundColor: '#272a33',
    },
    dividerText: {
      color: '#606573',
      fontSize: '0.75rem',
      fontWeight: 600,
    },
    formFieldLabel: {
      color: '#9499a6',
      fontWeight: 600,
      fontSize: '0.8rem',
    },
    formFieldInput: {
      backgroundColor: '#21232a',
      border: '1px solid #272a33',
      color: '#f4f5f7',
      borderRadius: '0.75rem',
      fontWeight: 500,
      '&:focus': {
        borderColor: '#3b82f6',
        boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)',
      },
      '&::placeholder': {
        color: '#606573',
      },
    },
    formButtonPrimary: {
      backgroundColor: '#3b82f6',
      color: '#ffffff',
      fontWeight: 700,
      borderRadius: '0.75rem',
      boxShadow: '0 0 15px rgba(59, 130, 246, 0.25)',
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
      color: '#9499a6',
    },
    identityPreview: {
      backgroundColor: '#21232a',
      border: '1px solid #272a33',
      borderRadius: '0.75rem',
    },
    identityPreviewEditButton: {
      color: '#3b82f6',
    },
    formFieldSuccessText: {
      color: '#10b981',
    },
    formFieldErrorText: {
      color: '#f43f5e',
    },
    alert: {
      backgroundColor: '#21232a',
      border: '1px solid #272a33',
      borderRadius: '0.75rem',
      color: '#f4f5f7',
    },
    alertText: {
      color: '#f4f5f7',
    },
    otpCodeFieldInput: {
      backgroundColor: '#21232a',
      border: '1px solid #272a33',
      color: '#f4f5f7',
      borderRadius: '0.75rem',
    },
  },
};

export default function Register() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-bg-base text-text-main p-4 font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight">Join GymPulse</h1>
          <p className="text-text-muted font-medium mt-2 text-sm">Create your account to start tracking routines and nutrition.</p>
        </div>
        <SignUp
          appearance={clerkAppearance}
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          forceRedirectUrl="/onboarding"
        />
      </div>
    </div>
  );
}
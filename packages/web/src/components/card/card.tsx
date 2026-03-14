type CardVariant = 'default' | 'issue' | 'needs-you' | 'subtle';

type CardProps = {
  children: React.ReactNode;
  variant?: CardVariant;
  interactive?: boolean;
  onClick?: () => void;
};

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-white/3 ring-1 ring-white/6',
  issue: 'bg-white/3 ring-1 ring-white/6',
  'needs-you': 'bg-amber-500/4 ring-1 ring-amber-500/12',
  subtle: 'bg-transparent',
};

const Card = ({ children, variant = 'default', interactive = false, onClick }: CardProps): React.ReactElement => (
  <div
    role={interactive ? 'button' : undefined}
    tabIndex={interactive ? 0 : undefined}
    onClick={onClick}
    onKeyDown={
      interactive
        ? (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onClick?.();
            }
          }
        : undefined
    }
    className={`
      rounded-xl p-5 transition-all duration-base
      ${variantStyles[variant]}
      ${
        interactive
          ? `cursor-pointer group ${
              variant === 'needs-you'
                ? 'hover:bg-amber-500/6 hover:ring-amber-500/20'
                : 'hover:bg-white/5 hover:ring-white/10'
            }`
          : ''
      }
    `}
  >
    {children}
  </div>
);

type CardHeaderProps = {
  children: React.ReactNode;
  trailing?: React.ReactNode;
};

const CardHeader = ({ children, trailing }: CardHeaderProps): React.ReactElement => (
  <div className="flex items-start justify-between gap-4 mb-2">
    <div className="flex items-center gap-2.5 flex-wrap min-w-0">{children}</div>
    {trailing && <div className="flex items-center gap-2 flex-shrink-0">{trailing}</div>}
  </div>
);

type CardBodyProps = {
  children: React.ReactNode;
};

const CardBody = ({ children }: CardBodyProps): React.ReactElement => (
  <div className="text-text-secondary text-base leading-relaxed mb-4">{children}</div>
);

type CardFooterProps = {
  children: React.ReactNode;
};

const CardFooter = ({ children }: CardFooterProps): React.ReactElement => (
  <div className="flex items-center justify-between">{children}</div>
);

type CardCalloutProps = {
  children: React.ReactNode;
  variant?: 'info' | 'critical';
};

const calloutStyles: Record<string, string> = {
  info: 'bg-blue-500/5 ring-1 ring-blue-500/10 text-blue-300',
  critical: 'bg-red-500/5 ring-1 ring-red-500/10 text-red-300',
};

const CardCallout = ({ children, variant = 'critical' }: CardCalloutProps): React.ReactElement => (
  <div className={`rounded-lg px-4 py-3 mb-4 ${calloutStyles[variant]}`}>
    <p className="text-sm leading-relaxed">{children}</p>
  </div>
);

export type { CardProps, CardVariant, CardHeaderProps, CardBodyProps, CardFooterProps, CardCalloutProps };
export { Card, CardHeader, CardBody, CardFooter, CardCallout };

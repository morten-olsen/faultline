type PageShellProps = {
  children: React.ReactNode
}

const PageShell = ({ children }: PageShellProps): React.ReactElement => (
  <div className="bg-bg min-h-screen font-sans text-text antialiased">
    <div className="max-w-lg mx-auto px-5">
      {children}
    </div>
  </div>
)

export type { PageShellProps }
export { PageShell }

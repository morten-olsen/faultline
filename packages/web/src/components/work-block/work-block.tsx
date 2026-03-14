type WorkBlockProps = {
  children: React.ReactNode;
};

const WorkBlock = ({ children }: WorkBlockProps): React.ReactElement => (
  <div className="ml-8.5 bg-surface rounded-xl p-3.5 ring-1 ring-white/5">{children}</div>
);

export type { WorkBlockProps };
export { WorkBlock };

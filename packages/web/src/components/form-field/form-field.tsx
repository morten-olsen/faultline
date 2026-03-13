type FormFieldProps = {
  label: string
  description?: string
  error?: string
  children: React.ReactNode
}

const FormField = ({ label, description, error, children }: FormFieldProps): React.ReactElement => (
  <div className="space-y-2">
    <div>
      <label className="text-sm font-medium text-text">{label}</label>
      {description && (
        <p className="text-sm text-text-muted mt-0.5">{description}</p>
      )}
    </div>
    {children}
    {error && (
      <p className="text-red-400 text-sm ml-1">{error}</p>
    )}
  </div>
)

export type { FormFieldProps }
export { FormField }

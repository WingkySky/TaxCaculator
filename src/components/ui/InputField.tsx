import { InputHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            className="text-sm font-medium"
            style={{ color: 'var(--color-text)' }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={clsx(
            'px-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2',
            className
          )}
          style={{
            backgroundColor: 'var(--color-bg)',
            borderColor: error ? 'var(--color-danger)' : 'var(--color-border)',
            color: 'var(--color-text)',
          }}
          {...props}
        />
        {error && (
          <span className="text-sm" style={{ color: 'var(--color-danger)' }}>
            {error}
          </span>
        )}
      </div>
    );
  }
);

InputField.displayName = 'InputField';

export default InputField;
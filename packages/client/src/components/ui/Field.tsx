import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import "./Field.css";

interface FieldWrapperProps {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}

function FieldWrapper({ label, htmlFor, error, children }: FieldWrapperProps) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error && <span className="field__error">{error}</span>}
    </div>
  );
}

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  label: string;
  htmlFor: string;
  error?: string;
};

export function Input({ label, htmlFor, error, ...rest }: InputProps) {
  return (
    <FieldWrapper label={label} htmlFor={htmlFor} error={error}>
      <input id={htmlFor} className={`field__control ${error ? "field__control--invalid" : ""}`} {...rest} />
    </FieldWrapper>
  );
}

type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> & {
  label: string;
  htmlFor: string;
  error?: string;
};

export function Textarea({ label, htmlFor, error, ...rest }: TextareaProps) {
  return (
    <FieldWrapper label={label} htmlFor={htmlFor} error={error}>
      <textarea id={htmlFor} className={`field__control ${error ? "field__control--invalid" : ""}`} {...rest} />
    </FieldWrapper>
  );
}

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> & {
  label: string;
  htmlFor: string;
  error?: string;
};

export function Select({ label, htmlFor, error, children, ...rest }: SelectProps) {
  return (
    <FieldWrapper label={label} htmlFor={htmlFor} error={error}>
      <select id={htmlFor} className={`field__control ${error ? "field__control--invalid" : ""}`} {...rest}>
        {children}
      </select>
    </FieldWrapper>
  );
}

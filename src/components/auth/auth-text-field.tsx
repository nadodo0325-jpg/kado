type AuthTextFieldProps = {
  id: string;
  name: string;
  label: string;
  type?: "text" | "email" | "password";
  placeholder?: string;
};

export function AuthTextField({
  id,
  name,
  label,
  type = "text",
  placeholder,
}: AuthTextFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        className="mt-2 w-full border border-[var(--kado-border)] px-3 py-3 text-[16px] outline-none focus:border-zinc-500 sm:text-sm"
      />
    </div>
  );
}
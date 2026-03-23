import React, { useState } from "react";

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: string;
  isPassword?: boolean;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  icon,
  isPassword,
  ...props
}) => {
  const [show, setShow] = useState(false);
  const type = isPassword ? (show ? "text" : "password") : props.type || "text";

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-black text-sm font-medium">{label}</span>
      <div className="relative group flex items-center">
        {icon && (
          <div className="absolute left-4 text-gray-400 group-focus-within:text-primary transition-colors z-10">
            <span className="material-symbols-outlined text-[20px]">
              {icon}
            </span>
          </div>
        )}

        <input
          {...props}
          type={type}
          className={`input ${icon ? "pl-11" : "px-4"} ${isPassword ? "pr-12 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden" : "pr-4"} text-base`}
        />

        {/* hide password? */}
        {isPassword && (
          <button
            tabIndex={-1}
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-0 px-4 h-full flex items-center justify-center text-gray-400 hover:text-primary cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">
              {show ? "visibility" : "visibility_off"}
            </span>
          </button>
        )}
      </div>
    </label>
  );
};

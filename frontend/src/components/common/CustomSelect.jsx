import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = "Select option...",
  icon: TriggerIcon,
  className = "",
  buttonClassName = "",
  menuClassName = "",
  size = "md", // "sm" | "md"
  align = "left", // "left" | "right"
  fullWidth = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard events (Escape to close)
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value) || {
    label: value || placeholder,
    value: value,
  };

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const isSmall = size === "sm";

  return (
    <div
      ref={dropdownRef}
      className={`relative text-left ${
        fullWidth ? "w-full block" : "inline-block"
      } ${isOpen ? "z-50" : "z-20"} ${className}`}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`custom-select-btn flex items-center justify-between gap-2.5 rounded-xl transition-colors font-medium text-xs outline-none focus:outline-none ring-0 focus:ring-0 cursor-pointer ${
          fullWidth ? "w-full" : "min-w-max"
        } ${isSmall ? "px-2.5 py-1.5" : "px-3.5 py-2"} ${
          isOpen ? "is-open" : ""
        } ${buttonClassName}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 truncate text-left">
          {TriggerIcon && (
            <TriggerIcon className="w-3.5 h-3.5 opacity-70 shrink-0" />
          )}
          {selectedOption.dotColor && (
            <span
              className="w-2 h-2 rounded-full shrink-0 shadow-sm"
              style={{ backgroundColor: selectedOption.dotColor }}
            />
          )}
          {selectedOption.icon && (
            <span className="shrink-0 flex items-center">{selectedOption.icon}</span>
          )}
          <span className="font-semibold tracking-tight truncate">
            {selectedOption.label}
          </span>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ml-1.5 opacity-70 ${
            isOpen ? "rotate-180 opacity-100" : ""
          }`}
        />
      </button>

      {/* Floating Menu */}
      {isOpen && (
        <div
          role="listbox"
          className={`custom-select-menu absolute z-50 mt-1.5 ${
            fullWidth ? "w-full min-w-[200px]" : "min-w-full w-max max-w-sm"
          } max-h-72 overflow-y-auto rounded-xl p-1.5 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 ${
            align === "right" ? "right-0" : "left-0"
          } ${menuClassName}`}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(opt.value)}
                className={`custom-select-item w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors whitespace-nowrap cursor-pointer ${
                  isSelected ? "is-selected" : ""
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {opt.dotColor && (
                    <span
                      className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: opt.dotColor }}
                    />
                  )}
                  {opt.icon && <span className="shrink-0 flex items-center">{opt.icon}</span>}
                  <span className="truncate">{opt.label}</span>
                </div>

                {isSelected && (
                  <Check className="w-3.5 h-3.5 shrink-0 ml-2" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

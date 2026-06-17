'use client';

import { useState } from 'react';

interface CurrencyInputProps {
  value: number;
  onChange: (cents: number) => void;
  currency?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function CurrencyInput({
  value,
  onChange,
  currency = 'USD',
  placeholder = '0.00',
  className = '',
  disabled = false,
}: CurrencyInputProps) {
  const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£' };
  const symbol = symbols[currency] ?? currency;

  const centsToDisplay = (cents: number): string => {
    const whole = Math.floor(Math.abs(cents) / 100);
    const frac = Math.abs(cents) % 100;
    return `${whole}.${String(frac).padStart(2, '0')}`;
  };

  const [display, setDisplay] = useState<string>(value > 0 ? centsToDisplay(value) : '');

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9.]/g, '');
    setDisplay(raw);

    const parsed = parseFloat(raw);
    if (!isNaN(parsed) && parsed >= 0) {
      const cents = Math.round(parsed * 100);
      onChange(cents);
    } else if (raw === '' || raw === '.') {
      onChange(0);
    }
  }

  function handleBlur() {
    const parsed = parseFloat(display);
    if (!isNaN(parsed)) {
      const cents = Math.round(parsed * 100);
      setDisplay(centsToDisplay(cents));
      onChange(cents);
    }
  }

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-mono">
        {symbol}
      </span>
      <input
        type="text"
        inputMode="decimal"
        value={display}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={`pms-input pl-7 font-mono ${className}`}
      />
    </div>
  );
}

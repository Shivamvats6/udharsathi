import { useState } from "react";
import { BookUser } from "lucide-react";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onPickName?: (name: string) => void;
  placeholder?: string;
}

const COUNTRY_CODE = "+91";

// "+919876500005" / "09876500005" / "98765 00005" -> "9876500005"
function toLocalDigits(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (raw.trim().startsWith("+91") || (digits.length > 10 && digits.startsWith("91"))) {
    digits = digits.slice(2);
  }
  if (digits.length > 10) digits = digits.slice(-10);
  return digits.slice(0, 10);
}

export function PhoneInput({ value, onChange, onPickName, placeholder = "98765 43210" }: PhoneInputProps) {
  const [hint, setHint] = useState<string | null>(null);
  const local = toLocalDigits(value || "");

  function handleTyping(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    onChange(digits ? `${COUNTRY_CODE}${digits}` : "");
  }

  async function pickContact() {
    setHint(null);
    const nav = navigator as any;
    if (!("contacts" in nav) || !("ContactsManager" in window)) {
      setHint("Ye feature sirf Android Chrome (HTTPS) par chalta hai. Number manually daalein.");
      return;
    }
    try {
      const results = await nav.contacts.select(["name", "tel"], { multiple: false });
      if (!results || results.length === 0) return;
      const contact = results[0];
      const tel: string | undefined = contact.tel?.[0];
      if (tel) {
        const digits = toLocalDigits(tel);
        if (digits) onChange(`${COUNTRY_CODE}${digits}`);
      } else {
        setHint("Is contact mein number nahi hai.");
      }
      const name: string | undefined = contact.name?.[0];
      if (name && onPickName) onPickName(name);
    } catch {
      // user ne picker cancel kar diya
    }
  }

  return (
    <div>
      <div className="flex items-stretch gap-2">
        <div className="shrink-0 flex items-center gap-1.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-600">
          <span>🇮🇳</span>
          <span>{COUNTRY_CODE}</span>
        </div>
        <input
          className="input-field flex-1 min-w-0"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={10}
          value={local}
          onChange={handleTyping}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={pickContact}
          title="Contacts se chunein"
          className="shrink-0 w-11 flex items-center justify-center rounded-xl bg-blue-50 text-brand hover:bg-blue-100"
        >
          <BookUser size={18} />
        </button>
      </div>
      {hint && <p className="text-[11px] text-amber-600 mt-1">{hint}</p>}
    </div>
  );
}
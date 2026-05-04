import { forwardRef, useRef } from 'react';

function mergeRefs(...refs) {
  return (value) => {
    refs.forEach((ref) => {
      if (!ref) {
        return;
      }

      if (typeof ref === 'function') {
        ref(value);
      } else {
        ref.current = value;
      }
    });
  };
}

const DateInput = forwardRef(function DateInput(
  { className = '', onClick, ...props },
  forwardedRef
) {
  const internalRef = useRef(null);

  function openPicker() {
    const input = internalRef.current;

    if (!input) {
      return;
    }

    if (typeof input.showPicker === 'function') {
      input.showPicker();
      return;
    }

    input.focus();
  }

  function handleClick(event) {
    onClick?.(event);

    if (!event.defaultPrevented) {
      openPicker();
    }
  }

  return (
    <div className="relative">
      <input
        {...props}
        ref={mergeRefs(internalRef, forwardedRef)}
        type="date"
        onClick={handleClick}
        className={`${className} pr-14`}
      />
      <button
        type="button"
        onClick={openPicker}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-50"
        aria-label="Open calendar"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M8 2v4" />
          <path d="M16 2v4" />
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M3 10h18" />
        </svg>
      </button>
    </div>
  );
});

export default DateInput;

import type { ComponentPropsWithoutRef } from 'react';

export const DeleteIcon = (props: ComponentPropsWithoutRef<'svg'>) => {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M4.16669 5.83333H15.8334"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M8.33331 9.16667V13.3333"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M11.6667 9.16667V13.3333"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M5.83331 5.83333L6.24998 15C6.24998 15.9205 6.99617 16.6667 7.91665 16.6667H12.0833C13.0038 16.6667 13.75 15.9205 13.75 15L14.1666 5.83333"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.5 5.83333V4.58333C7.5 3.893 8.05964 3.33333 8.75 3.33333H11.25C11.9404 3.33333 12.5 3.893 12.5 4.58333V5.83333"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
};
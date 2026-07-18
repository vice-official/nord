import type { ComponentPropsWithoutRef } from 'react';

export const EditIcon = (props: ComponentPropsWithoutRef<'svg'>) => {
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
        d="M4.16669 15.8333H7.08335L15.625 7.29167C16.4304 6.48625 16.4304 5.18042 15.625 4.375C14.8196 3.56958 13.5138 3.56958 12.7084 4.375L4.16669 12.9167V15.8333Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.875 5.20833L14.7917 8.125"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
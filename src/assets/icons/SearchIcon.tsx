import type { ComponentPropsWithoutRef } from 'react';

export const SearchIcon = (props: ComponentPropsWithoutRef<'svg'>) => {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M9.50039 9.50039L6.90189 6.90189M6.90189 6.90189C7.60518 6.1986 8.00028 5.24474 8.00028 4.25014C8.00028 3.25554 7.60518 2.30168 6.90189 1.59839C6.1986 0.895103 5.24474 0.5 4.25014 0.5C3.25554 0.5 2.30168 0.895103 1.59839 1.59839C0.895103 2.30168 0.5 3.25554 0.5 4.25014C0.5 5.24474 0.895103 6.1986 1.59839 6.90189C2.30168 7.60518 3.25554 8.00028 4.25014 8.00028C5.24474 8.00028 6.1986 7.60518 6.90189 6.90189Z" stroke="#979797" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  )
}
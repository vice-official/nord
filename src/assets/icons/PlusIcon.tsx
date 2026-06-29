import type { ComponentPropsWithoutRef } from 'react';

export const PlusIcon = (props: ComponentPropsWithoutRef<'svg'>) => {
  return(
    <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M1 10.0417H19.0833" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M10.0417 1V19.0833" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  )
}
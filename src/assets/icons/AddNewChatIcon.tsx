import type { ComponentPropsWithoutRef } from 'react';

export const AddNewChatIcon = (props: ComponentPropsWithoutRef<'svg'>) => {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M5 9.5C7.48528 9.5 9.5 7.48528 9.5 5C9.5 2.51472 7.48528 0.5 5 0.5C2.51472 0.5 0.5 2.51472 0.5 5C0.5 7.48528 2.51472 9.5 5 9.5Z" stroke="#979797" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M5 3.2V6.8" stroke="#979797" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M3.2 5H6.8" stroke="#979797" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  )
}
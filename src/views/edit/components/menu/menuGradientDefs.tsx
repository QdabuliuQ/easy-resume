export const MENU_GRADIENT_ID = 'resume-menu-item-grad';

export default function MenuGradientDefs() {
  return (
    <svg width={0} height={0} className='absolute' aria-hidden>
      <defs>
        <linearGradient id={MENU_GRADIENT_ID} x1='0%' y1='0%' x2='100%' y2='0%'>
          <stop offset='0%' stopColor='var(--color-primary-gradient-start)' />
          <stop offset='100%' stopColor='var(--color-primary)' />
        </linearGradient>
      </defs>
    </svg>
  );
}

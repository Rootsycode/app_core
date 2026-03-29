export const AddIcon = ({ color }) => (
  <svg
    width='24'
    height='24'
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path
      d='M12 22C17.5228 22 22 17.5229 22 12C22 6.47718 17.5228 2.00003 12 2.00003C6.47715 2.00003 2 6.47718 2 12C2 17.5229 6.47715 22 12 22Z'
      stroke={color ? color : 'currentColot'}
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M12 8.00003V16'
      stroke={color ? color : 'currentColot'}
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M8 12H16'
      stroke={color ? color : 'currentColot'}
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
)

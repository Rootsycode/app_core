import React from 'react'

interface RootsyLogoProps {
  width?: number
  height?: number
  className?: string
  textColor?: string
  align?: 'center' | 'left'
}

export const RootsyLogo: React.FC<RootsyLogoProps> = ({
  width = 140,
  height = 32,
  className,
  textColor = '#FFFFFF',
  align = 'center'
}) => {
  const textAnchor = align === 'left' ? 'start' : 'middle'
  const x = align === 'left' ? 2 : 70

  return (
    <svg
      width={width}
      height={height}
      viewBox='0 0 140 32'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      className={className}
    >
      <text
        x={x}
        y='24'
        fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
        fontSize='24'
        fontWeight='700'
        letterSpacing='-0.5'
        fill={textColor}
        textAnchor={textAnchor}
      >
        ROOTSY
      </text>
    </svg>
  )
}


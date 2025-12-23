import React from 'react'

interface RootsyLogoProps {
  width?: number
  height?: number
  className?: string
  textColor?: string
}

export const RootsyLogo: React.FC<RootsyLogoProps> = ({ 
  width = 140, 
  height = 32,
  className,
  textColor = '#FFFFFF'
}) => {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 140 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Texto ROOTSY con tipografía moderna */}
      <text 
        x="70" 
        y="24" 
        fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" 
        fontSize="24" 
        fontWeight="700" 
        letterSpacing="-0.5"
        fill={textColor}
        textAnchor="middle"
      >
        ROOTSY
      </text>
    </svg>
  )
}


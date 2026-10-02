import React from 'react';

import styles from './Chair.module.css';

interface ChairProps {
  number: number | string;
  onClick?: () => void;
  className?: string;
}

// SVG de vista desde arriba (Top-View Chair / Seat)
export const TopViewChairIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Respaldo curvo superior */}
    <path d="M5 9C5 5.68629 7.68629 3 11 3H13C16.3137 3 19 5.68629 19 9" />
    
    {/* Asiento (rectángulo suave) */}
    <rect x="5" y="8" width="14" height="11" rx="3" />
    
    {/* Reposabrazos izquierdo y derecho */}
    <path d="M4 11V15" />
    <path d="M20 11V15" />
  </svg>
);

export const Chair: React.FC<ChairProps> = ({ number, onClick, className = '' }) => {
  return (
    <div className={`${styles.seatWrapper} ${className}`} onClick={onClick}>
      <TopViewChairIcon className={styles.chairIcon} />
      <span className={styles.seatNumber}>{number}</span>
    </div>
  );
};
